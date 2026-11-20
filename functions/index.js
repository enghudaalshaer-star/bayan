'use strict';
/* =====================================================================
   بيان — الامتحانات الرسمية على السيرفر (Cloud Functions، خطة Blaze)
   1) startExam      : يبدأ الامتحان — يتحقق من الصلاحية وفصل الطالب والموعد، ويسحب أسئلة الطالب،
                       وينشئ جلسته sittings وورقته sitPapers (أسئلته فقط، بلا إجابات).
                       بنك الأسئلة examPapers والإجابات examKeys لا يصلان للطالب أبداً.
   2) gradeOnSubmit  : عند التسليم يصحّح الاختيار وصح/خطأ والقصير المطابق، ويكتب grades
                       (دون إعلانها). المقالي يبقى للمشرف.
   3) closeExpired   : كل 10 دقائق يسلّم أوراق من انتهى وقته ولم يسلّم (فتُصحَّح تلقائياً).
   4) issueCert      : يُصدر شهادة الدورة للطالب بعد التحقق على السيرفر (التسجيل، إتمام الدروس، أو إعادة تصحيح
                       محاولة الاختبار من إجاباتها). الاسم يؤخذ من القيد أو الحساب — لا من المتصفح.
   5) certStats      : يحدّث عدد الشهادات في stats/public (تعرضه الصفحة الرئيسية بدل قراءة كل الشهادات).
   6) syncUserAuth   : إيقاف الطالب (users.disabled) يوقف حسابه في Firebase Auth ويُنهي جلساته،
                       وحذف مستنده يحذف حساب الدخول.
   7) rebuildCatalog : (catalogOnCourse / catalogOnFaq) فهرس الدورات الخفيف والأسئلة الشائعة في stats/catalog —
                       الصفحات العامة تقرأ مستنداً واحداً بدل كل الدورات.
   8) enrollStats    : عدد دورات كل طالب users.nEnr، و certStats يحدّث users.nCert أيضاً (قسم «الطلاب» لا يقرأ كل التسجيلات).
      regStats       : عدد فصول الطالب records.nTerms (قسم «القيد»).
   9) recountStats   : (للمشرف) يعيد احتساب كل ما سبق من الصفر — يُشغَّل من الإعدادات بعد النشر أول مرة.
   App Check: بعد تفعيله في Firebase وضبط APPCHECK_SITE_KEY في js/config.js ومراقبة الطلبات أياماً، اجعل APPCHECK = true هنا.

   النشر (مرة واحدة، من مجلد المشروع):
     npm i -g firebase-tools   ← firebase login
     cd functions && npm install && cd ..
     firebase deploy --only functions,firestore:rules
   مهم: REGION هنا و FUNCTIONS_REGION في js/config.js يجب أن يتطابقا، ويطابقا موقع Firestore
        (Firebase ← Firestore Database): nam5 ← us-central1 · eur3 ← europe-west1 · منطقة مفردة ← نفس الاسم
   ===================================================================== */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { setGlobalOptions, logger } = require('firebase-functions/v2');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { randomInt } = require('crypto');
const { drawPaper, gradeSitting } = require('./grading');

const REGION = 'us-central1';
// فرض App Check على الدوال القابلة للاستدعاء: اتركه false حتى يُفعَّل App Check في الموقع (APPCHECK_SITE_KEY)
const APPCHECK = false;
const ID_RE = /^[A-Za-z0-9_-]{1,80}$/;
const GRACE = 90e3; // مهلة الشبكة بعد انتهاء الوقت — تطابق القواعد و EXAM_GRACE في core.js
setGlobalOptions({ region: REGION, maxInstances: 20 });
initializeApp();
const db = getFirestore();
const ms = v => (v && typeof v.toMillis === 'function' ? v.toMillis() : +v || 0);
const fail = (code, msg) => { throw new HttpsError(code, msg); };

/* ---------- 1) بدء الامتحان ---------- */
exports.startExam = onCall({ cors: true, enforceAppCheck: APPCHECK }, async req => {
  const uid = req.auth?.uid; if (!uid) fail('unauthenticated', 'سجّل دخولك أولاً');
  const eid = String(req.data?.examId || '');
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(eid)) fail('invalid-argument', 'امتحان غير صالح');
  const sid = `${eid}_${uid}`;

  const eSnap = await db.doc(`exams/${eid}`).get();
  if (!eSnap.exists) fail('not-found', 'الامتحان غير موجود');
  const e = eSnap.data();
  if (!e.published || !['quiz', 'final'].includes(e.kind)) fail('failed-precondition', 'الامتحان غير متاح');

  const [enr, usr, admin] = await Promise.all([
    db.doc(`enrollments/${uid}_${e.courseId}`).get(), db.doc(`users/${uid}`).get(), db.doc(`admins/${uid}`).get()]);
  if (admin.exists) fail('permission-denied', 'حساب المشرف لا يدخل الامتحانات — استعمل حساب طالب للتجربة');
  if (!enr.exists) fail('permission-denied', 'لست مسجّلاً في هذه المادة');
  if (usr.exists && usr.data().disabled) fail('permission-denied', 'حسابك موقوف — تواصل مع الإدارة');
  // امتحان فصل معيّن: لطلاب المادة المسجّلين في ذلك الفصل (ومن يعيد المادة فيه)
  const et = e.termId || '', st = enr.data().termId || '';
  if (et && st && et !== st) fail('permission-denied', 'هذا الامتحان لطلاب فصل آخر');

  return db.runTransaction(async tx => {
    const sRef = db.doc(`sittings/${sid}`), pRef = db.doc(`sitPapers/${sid}`);
    const [s, paper] = await Promise.all([tx.get(sRef), tx.get(db.doc(`examPapers/${eid}`))]);
    if (s.exists) {
      if (s.data().status === 'submitted') fail('failed-precondition', 'سلّمت هذا الامتحان من قبل');
      return { resumed: true, serverNow: Date.now() };
    }
    const now = Date.now();
    if (+e.opensAt && now < +e.opensAt) fail('failed-precondition', 'لم يُفتح الامتحان بعد');
    if (+e.closesAt && now > +e.closesAt) fail('failed-precondition', 'انتهى موعد هذا الامتحان');
    const drawn = drawPaper(e, paper.exists ? paper.data().questions || [] : []);
    if (!drawn.length) fail('failed-precondition', 'لم تُجهَّز أسئلة هذا الامتحان بعد');
    const prof = usr.exists ? usr.data() : {};
    tx.set(sRef, { uid, userName: prof.name || enr.data().userName || '', examId: eid, courseId: e.courseId, kind: e.kind,
      qids: drawn.map(q => q.id), answers: {}, status: 'started', startedAt: FieldValue.serverTimestamp(), savedAt: FieldValue.serverTimestamp(), by: 'server' });
    tx.set(pRef, { uid, examId: eid, courseId: e.courseId, at: now,
      questions: drawn.map(q => { const o = { id: q.id, type: q.type, text: q.text, pts: +q.pts || 1 }; if (Array.isArray(q.options)) o.options = q.options; return o; }) });
    return { resumed: false, serverNow: Date.now() };
  });
});

/* ---------- 2) التصحيح عند التسليم ---------- */
exports.gradeOnSubmit = onDocumentWritten('sittings/{id}', async ev => {
  const before = ev.data.before.exists ? ev.data.before.data() : null;
  const s = ev.data.after.exists ? ev.data.after.data() : null;
  if (!s || s.status !== 'submitted' || before?.status === 'submitted') return;
  const id = ev.params.id;
  const [eSnap, pSnap, kSnap, gSnap] = await Promise.all([
    db.doc(`exams/${s.examId}`).get(), db.doc(`examPapers/${s.examId}`).get(), db.doc(`examKeys/${s.examId}`).get(), db.doc(`grades/${id}`).get()]);
  if (!eSnap.exists || !pSnap.exists) return;
  const e = eSnap.data(), prev = gSnap.exists ? gSnap.data() : {};
  const g = gradeSitting(s, pSnap.data().questions || [], (kSnap.exists ? kSnap.data().answers : null) || {}, prev);
  await db.doc(`grades/${id}`).set({
    uid: s.uid, userName: s.userName || '', examId: s.examId, courseId: s.courseId, kind: s.kind || e.kind,
    points: g.points, total: g.total, score: g.score, pending: g.pending, review: g.review,
    passed: !g.pending && g.score >= (+e.passScore || 60), rows: g.rows, manual: g.manual, notes: g.notes,
    feedback: prev.feedback || '', gradedAt: Date.now(), by: 'function'
  });
});

/* ---------- 3) تسليم الأوراق المنتهية ---------- */
exports.closeExpired = onSchedule({ schedule: 'every 10 minutes', timeZone: 'UTC' }, async () => {
  const snap = await db.collection('sittings').where('status', '==', 'started').get();
  const cache = {}, now = Date.now(); let n = 0;
  for (const d of snap.docs) {
    const s = d.data();
    if (!(s.examId in cache)) cache[s.examId] = (await db.doc(`exams/${s.examId}`).get()).data() || null;
    const e = cache[s.examId]; if (!e) continue;
    let dl = Infinity;
    if (+e.duration) dl = ms(s.startedAt) + e.duration * 6e4;
    if (+e.closesAt) dl = Math.min(dl, +e.closesAt);
    if (dl !== Infinity && now > dl + GRACE) { await d.ref.update({ status: 'submitted', submittedAt: FieldValue.serverTimestamp(), autoClosed: true }); n++; }
  }
  if (n) logger.info(`closeExpired: سُلّمت ${n} ورقة انتهى وقتها`);
});

/* ---------- 4) إصدار شهادة الدورة ---------- */
const CODE_CH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const rnd4 = () => Array.from({ length: 4 }, () => CODE_CH[randomInt(CODE_CH.length)]).join('');
const revealMode = ex => ex.reveal === 'hidden' ? 'hidden' : ex.reveal === true || ex.reveal === 'full' ? 'full' : ex.reveal === 'mark' || ex.reveal === undefined ? 'mark' : 'none';
exports.issueCert = onCall({ cors: true, enforceAppCheck: APPCHECK }, async req => {
  const uid = req.auth?.uid; if (!uid) fail('unauthenticated', 'سجّل دخولك أولاً');
  const cid = String(req.data?.courseId || ''), aid = String(req.data?.attemptId || '');
  if (!ID_RE.test(cid)) fail('invalid-argument', 'دورة غير صالحة');
  if (aid && !ID_RE.test(aid)) fail('invalid-argument', 'محاولة غير صالحة');

  const [cSnap, enr, usr, admin, offx] = await Promise.all([
    db.doc(`courses/${cid}`).get(), db.doc(`enrollments/${uid}_${cid}`).get(), db.doc(`users/${uid}`).get(), db.doc(`admins/${uid}`).get(),
    db.collection('exams').where('courseId', '==', cid).where('published', '==', true).limit(1).get()]);
  if (admin.exists) fail('permission-denied', 'المشرف يُصدر الشهادات من لوحة التحكم');
  if (!cSnap.exists || !cSnap.data().published) fail('not-found', 'الدورة غير موجودة');
  if (!enr.exists) fail('permission-denied', 'لست مسجّلاً في هذه الدورة');
  const prof = usr.exists ? usr.data() : {};
  if (prof.disabled) fail('permission-denied', 'حسابك موقوف — تواصل مع الإدارة');
  const c = cSnap.data();
  if (+c.offExams > 0 || !offx.empty) fail('failed-precondition', 'تصدر شهادة هذه المادة بعد اعتماد نتائج امتحاناتها الرسمية');

  const ex = c.exam || {}, qs = Array.isArray(ex.questions) ? ex.questions : [];
  const lessons = Array.isArray(c.lessons) ? c.lessons : [], done = enr.data().completed || [];
  const allDone = lessons.every(l => done.includes(l.id));
  let score = null;
  if (qs.length) {
    if (ex.requireLessons && !allDone) fail('failed-precondition', 'أتمم جميع دروس الدورة أولاً');
    if (!aid) fail('failed-precondition', 'لا توجد محاولة ناجحة في الاختبار');
    const at = await db.doc(`attempts/${aid}`).get();
    if (!at.exists || at.data().uid !== uid || at.data().courseId !== cid) fail('permission-denied', 'محاولة غير صالحة');
    // إعادة التصحيح على السيرفر من الإجابات المحفوظة — لا يُعتمد على الدرجة التي كتبها المتصفح
    const ans = at.data().answers || {};
    const sc = Math.round(qs.filter(q => ans[q.id] === q.answer).length / qs.length * 100);
    if (sc < (+ex.passScore || 60)) fail('failed-precondition', 'لم تبلغ درجة النجاح في هذه المحاولة');
    const hidden = revealMode(ex) === 'hidden';
    if (hidden && !ex.autoCert) fail('permission-denied', 'تُصدر الإدارة شهادة هذا الاختبار');
    score = hidden ? null : sc;
  } else if (!lessons.length || !allDone) fail('failed-precondition', 'أتمم جميع دروس الدورة أولاً');

  // الاسم الرسمي: من القيد إن كانت المادة في برنامج، وإلا من الحساب
  const rec = c.program ? await db.doc(`records/${uid}_${c.program}`).get() : null;
  const r = rec?.exists ? rec.data() : {};
  const name = String(r.name || prof.name || '').slice(0, 120), nameEn = String(r.nameEn || prof.nameEn || '').slice(0, 120);
  if (!name) fail('failed-precondition', 'أكمل اسمك في حسابك أولاً');

  return db.runTransaction(async tx => {
    const ex0 = await tx.get(db.collection('certificates').where('uid', '==', uid).where('courseId', '==', cid).limit(1));
    if (!ex0.empty) return { code: ex0.docs[0].id, existed: true };
    let code = '', ref = null;
    for (let i = 0; i < 5; i++) { code = `BYN-${rnd4()}-${rnd4()}`; ref = db.doc(`certificates/${code}`); if (!(await tx.get(ref)).exists) break; }
    tx.create(ref, { uid, courseId: cid, name, nameEn, courseTitle: c.title || '', courseTitleEn: c.titleEn || '', instructor: c.instructor || '',
      instructorEn: c.instructorEn || '', certType: c.certType || '', score, issuedAt: Date.now(), by: 'server' });
    return { code, existed: false };
  });
});

/* ---------- 5) عدد الشهادات ---------- */
exports.certStats = onDocumentWritten('certificates/{id}', async ev => {
  const b = ev.data.before.exists, a = ev.data.after.exists; if (a === b) return;
  await Promise.all([db.doc('stats/public').set({ certs: FieldValue.increment(a ? 1 : -1), updatedAt: Date.now() }, { merge: true }), bumpUser(ev, 'nCert')]);
});
/* عدّاد في مستند الطالب: update (لا set) حتى لا يُعاد إنشاء مستند طالب محذوف */
async function bumpUser(ev, field) {
  const b = ev.data.before.exists, a = ev.data.after.exists; if (a === b) return;
  const uid = (a ? ev.data.after : ev.data.before).data().uid; if (!uid || typeof uid !== 'string') return;
  try { await db.doc(`users/${uid}`).update({ [field]: FieldValue.increment(a ? 1 : -1) }); }
  catch (e) { if (e.code !== 5) throw e; } // 5 = NOT_FOUND
}
exports.enrollStats = onDocumentWritten('enrollments/{id}', ev => bumpUser(ev, 'nEnr'));
/* عدد فصول الطالب في قيده records/{uid}_{program}.nTerms (قسم «القيد» لا يقرأ كل القيود الفصلية) */
exports.regStats = onDocumentWritten('regs/{id}', async ev => {
  const b = ev.data.before.exists, a = ev.data.after.exists; if (a === b) return;
  const g = (a ? ev.data.after : ev.data.before).data(); if (!g.uid || !g.program) return;
  try { await db.doc(`records/${g.uid}_${g.program}`).update({ nTerms: FieldValue.increment(a ? 1 : -1) }); }
  catch (e) { if (e.code !== 5) throw e; }
});

/* ---------- 7) فهرس الدورات ---------- */
// نفس liteCourse في js/core.js: بلا نصوص الدروس ولا أسئلة الاختبار ولا روابط ملفات Storage
function liteCourse(c) {
  const o = { ...c };
  if (Array.isArray(o.lessons)) o.lessons = o.lessons.map(({ content, ...l }) => l);
  if (o.exam && Array.isArray(o.exam.questions)) o.exam = { ...o.exam, questions: o.exam.questions.map(q => ({ id: q.id })) };
  if (Array.isArray(o.attachments)) o.attachments = o.attachments.map(a => a.path ? { ...a, url: '' } : a);
  return o;
}
async function rebuildCatalog() {
  const [cs, fs] = await Promise.all([db.collection('courses').get(), db.collection('faqs').get()]);
  const cat = { courses: cs.docs.map(d => liteCourse({ id: d.id, ...d.data() })), faqs: fs.docs.map(d => ({ id: d.id, ...d.data() })), updatedAt: Date.now() };
  // حد المستند 1 م.ب: إن كبر الفهرس تعود الصفحات لقراءة الدورات مباشرة (courses غائبة)
  if (Buffer.byteLength(JSON.stringify(cat)) > 900000) { logger.warn('rebuildCatalog: الفهرس أكبر من 900 ك.ب'); await db.doc('stats/catalog').set({ tooBig: true, updatedAt: Date.now() }); return cat; }
  await db.doc('stats/catalog').set(cat); return cat;
}
exports.catalogOnCourse = onDocumentWritten('courses/{id}', () => rebuildCatalog());
exports.catalogOnFaq = onDocumentWritten('faqs/{id}', () => rebuildCatalog());

/* ---------- 9) إعادة الاحتساب (للمشرف) ---------- */
exports.recountStats = onCall({ cors: true, enforceAppCheck: APPCHECK, timeoutSeconds: 300, memory: '512MiB' }, async req => {
  const uid = req.auth?.uid; if (!uid) fail('unauthenticated', 'سجّل دخولك أولاً');
  if (!(await db.doc(`admins/${uid}`).get()).exists) fail('permission-denied', 'للمشرف فقط');
  const [users, enr, certs, recs, regs] = await Promise.all([db.collection('users').select().get(), db.collection('enrollments').select('uid').get(), db.collection('certificates').select('uid').get(),
    db.collection('records').select('cohort').get(), db.collection('regs').select('uid', 'program').get()]);
  const ne = {}, nc = {}, nt = {};
  for (const d of regs.docs) { const k = `${d.get('uid')}_${d.get('program')}`; nt[k] = (nt[k] || 0) + 1; }
  const cohorts = [...new Set(recs.docs.map(d => d.get('cohort')).filter(Boolean))];
  for (const d of enr.docs) { const u = d.get('uid'); if (u) ne[u] = (ne[u] || 0) + 1; }
  for (const d of certs.docs) { const u = d.get('uid'); if (u) nc[u] = (nc[u] || 0) + 1; }
  const w = db.bulkWriter();
  for (const d of users.docs) w.update(d.ref, { nEnr: ne[d.id] || 0, nCert: nc[d.id] || 0 });
  for (const d of recs.docs) w.update(d.ref, { nTerms: nt[d.id] || 0 });
  w.set(db.doc('counters/students'), { cohorts }, { merge: true });
  w.set(db.doc('stats/public'), { certs: certs.size, updatedAt: Date.now() }, { merge: true });
  await w.close();
  const cat = await rebuildCatalog();
  return { users: users.size, certs: certs.size, courses: (cat.courses || []).length, records: recs.size };
});

/* ---------- 6) إيقاف الحساب وحذفه في Firebase Auth ---------- */
exports.syncUserAuth = onDocumentWritten('users/{uid}', async ev => {
  const uid = ev.params.uid;
  const before = ev.data.before.exists ? ev.data.before.data() : null, after = ev.data.after.exists ? ev.data.after.data() : null;
  const was = !!before?.disabled, is = !!after?.disabled;
  if (after && was === is) return;                       // لا تغيير في الإيقاف
  if ((await db.doc(`admins/${uid}`).get()).exists) return; // لا يُمس حساب مشرف
  try {
    if (!after) { await getAuth().deleteUser(uid); logger.info(`syncUserAuth: حُذف حساب ${uid}`); return; }
    await getAuth().updateUser(uid, { disabled: is });
    if (is) await getAuth().revokeRefreshTokens(uid);
    logger.info(`syncUserAuth: ${is ? 'أُوقف' : 'فُعّل'} ${uid}`);
  } catch (e) { if (e.code !== 'auth/user-not-found') { logger.error('syncUserAuth', e); throw e; } }
});
