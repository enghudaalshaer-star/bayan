'use strict';
/* =====================================================================
   بيان — الامتحانات الرسمية على السيرفر (Cloud Functions، خطة Blaze)
   1) startExam      : يبدأ الامتحان — يتحقق من الصلاحية وفصل الطالب والموعد، ويسحب أسئلة الطالب،
                       وينشئ جلسته sittings وورقته sitPapers (أسئلته فقط، بلا إجابات).
                       بنك الأسئلة examPapers والإجابات examKeys لا يصلان للطالب أبداً.
   2) gradeOnSubmit  : عند التسليم يصحّح الاختيار وصح/خطأ والقصير المطابق، ويكتب grades
                       (دون إعلانها). المقالي يبقى للمشرف.
   3) closeExpired   : كل 10 دقائق يسلّم أوراق من انتهى وقته ولم يسلّم (فتُصحَّح تلقائياً).

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
const { drawPaper, gradeSitting } = require('./grading');

const REGION = 'us-central1';
const GRACE = 90e3; // مهلة الشبكة بعد انتهاء الوقت — تطابق القواعد و EXAM_GRACE في core.js
setGlobalOptions({ region: REGION, maxInstances: 20 });
initializeApp();
const db = getFirestore();
const ms = v => (v && typeof v.toMillis === 'function' ? v.toMillis() : +v || 0);
const fail = (code, msg) => { throw new HttpsError(code, msg); };

/* ---------- 1) بدء الامتحان ---------- */
exports.startExam = onCall({ cors: true }, async req => {
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
