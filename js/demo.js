'use strict';
/* =====================================================================
   بيان — البيانات التجريبية الكاملة (تُحمَّل عند الحاجة فقط، لا يحمّلها الطلاب)
   تملأ كل أقسام المنصة: طلاب بحسابات دخول، طلبات التحاق بكل الحالات، قيد ودفعات،
   ثلاثة فصول (منتهٍ وجارٍ وقادم)، مواد بدروس ومرفقات، امتحانات رسمية بتسليمات ودرجات،
   علامات وكشوف درجات بمعدلات (وطالب يعيد مادة)، شهادات، رسائل، أسئلة شائعة، ولقاءات مباشرة.
   كل ما يُنشأ يُسجَّل في settings/demo فيُحذف كله بزر «حذف البيانات التجريبية».
   كلمة مرور كل الطلاب التجريبيين: 123456
   ===================================================================== */
const DEMO_PASS = '123456';
const DEMO_DAY = 864e5;
const DEMO_STUDENTS = [
  { key: 'demo', name: 'عبد الله أحمد', nameEn: 'Abdullah Ahmad', phone: '+963 944112233', gender: 'm', country: 'سوريا', nationality: 'سوري', city: 'دمشق', birth: '2001-04-12', qual: 'bachelor' },
  { key: 'fatima', name: 'فاطمة الزهراء حسن', nameEn: 'Fatima Al-Zahraa Hasan', phone: '+90 5321234567', gender: 'f', country: 'تركيا', nationality: 'سورية', city: 'إسطنبول', birth: '1999-09-03', qual: 'diploma' },
  { key: 'omar', name: 'عمر خالد الحمصي', nameEn: 'Omar Khaled Al-Homsi', phone: '+966 501234567', gender: 'm', country: 'السعودية', nationality: 'سوري', city: 'الرياض', birth: '2003-01-20', qual: 'secondary' },
  { key: 'aisha', name: 'عائشة محمود', nameEn: 'Aisha Mahmoud', phone: '+49 15123456789', gender: 'f', country: 'ألمانيا', nationality: 'سورية', city: 'برلين', birth: '2000-06-15', qual: 'bachelor' },
  { key: 'maryam', name: 'مريم يوسف', nameEn: 'Maryam Yousef', phone: '+962 791234567', gender: 'f', country: 'الأردن', nationality: 'أردنية', city: 'عمّان', birth: '2009-02-10', qual: 'below' },
  { key: 'yusuf', name: 'يوسف إبراهيم', nameEn: 'Yusuf Ibrahim', phone: '+20 1001234567', gender: 'm', country: 'مصر', nationality: 'مصري', city: 'القاهرة', birth: '1998-11-02', qual: 'master' },
  { key: 'khadija', name: 'خديجة عمر', nameEn: 'Khadija Omar', phone: '+971 501234567', gender: 'f', country: 'الإمارات', nationality: 'سورية', city: 'دبي', birth: '2007-03-28', qual: 'secondary' },
  { key: 'hasan', name: 'حسن العلي', nameEn: 'Hasan Al-Ali', phone: '+961 3123456', gender: 'm', country: 'لبنان', nationality: 'لبناني', city: 'بيروت', birth: '2010-07-07', qual: 'below' }
];
/* روابط عامة ثابتة لأنواع المرفقات السبعة */
const DEMO_FILES = {
  pdf: ['https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'dummy.pdf', 13264],
  word: ['https://calibre-ebook.com/downloads/demos/demo.docx', 'demo.docx', 1311881],
  excel: ['https://go.microsoft.com/fwlink/?LinkID=521962', 'Financial Sample.xlsx', 83418],
  image: ['https://upload.wikimedia.org/wikipedia/commons/2/27/Basmala.svg', 'Basmala.svg', 0],
  audio: ['https://server8.mp3quran.net/afs/001.mp3', 'al-fatiha.mp3', 0],
  video: ['https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', 'flower.mp4', 1128303],
  file: ['https://github.com/enghudaalshaer-star/bayan/archive/refs/heads/main.zip', 'bayan.zip', 0]
};

async function seedDemo(progress = () => {}) {
  const now = Date.now(), d0 = t => fromDateInput(toDateInput(t)), day = n => d0(now + n * DEMO_DAY);
  const ts = ms => S.live ? firebase.firestore.Timestamp.fromMillis(ms) : ms;
  const prev = (await safeGet('settings', 'demo')) || {}, track = prev.ids || {}, authUsers = new Set(prev.auth || []);
  const put = async (c, id, v) => { await DB.set(c, id, v); (track[c] = track[c] || []); if (!track[c].includes(id)) track[c].push(id); };
  const step = (t) => progress(t);

  /* ---------- الطلاب وحساباتهم ---------- */
  step('حسابات الطلاب');
  const U = {};
  for (const s of DEMO_STUDENTS) {
    const prof = { name: s.name, nameEn: s.nameEn, username: s.key, phone: s.phone, createdAt: now - 320 * DEMO_DAY + DEMO_STUDENTS.indexOf(s) * 9 * DEMO_DAY, disabled: false };
    if (!S.live) {
      const id = s.key === 'demo' ? 'demo' : 'demo-' + s.key;
      await put('users', id, { ...prof, passHash: await sha(DEMO_PASS) }); U[s.key] = { uid: id, ...s };
      continue;
    }
    const sec = firebase.apps.find(a => a.name === 'demo-seed') || firebase.initializeApp(FIREBASE_CONFIG, 'demo-seed');
    let cred;
    try { cred = await sec.auth().createUserWithEmailAndPassword(toEmail(s.key), DEMO_PASS); }
    catch (e) {
      if (e.code !== 'auth/email-already-in-use') throw new Error(fbErr(e));
      try { cred = await sec.auth().signInWithEmailAndPassword(toEmail(s.key), DEMO_PASS); } catch { console.warn('تخطّي الحساب', s.key); continue; }
    }
    const uid = cred.user.uid; await sec.auth().signOut();
    await put('users', uid, prof); authUsers.add(s.key); U[s.key] = { uid, ...s };
  }
  const has = k => !!U[k];

  /* ---------- الدورات والمواد (تُستعمل الموجودة بنفس الاسم ولا تُعدَّل) ---------- */
  step('المواد والدروس والمرفقات');
  const all = await safeList('courses'), byTitle = t => all.find(c => (c.title || '').trim() === t);
  const att = (k, title, lessonId = '', extra = {}) => { const [url, name, size] = DEMO_FILES[k]; return { id: genId() + Math.random().toString(36).slice(2, 5), title, kind: k, url, name, size, mime: '', path: '', lessonId, at: now, ...extra }; };
  const C = {};
  const L = (title, type, content = '', extra = {}) => ({ id: genId() + Math.random().toString(36).slice(2, 5), title, type, url: '', content, duration: extra.duration || '12', ...extra });
  const lessonsFor = (p) => {
    const [term, title, , book, author] = p;
    return [
      L(`مقدمة المادة: ${title}`, 'text', `تُدرَّس هذه المادة في ${termLabel(term)} من كتاب «${book}» لـ${author}.\n\nنتعرّف في هذا الدرس على موضوعات المادة وطريقة دراستها وتوزيع علامتها: حضور ومشاركة ومذاكرة وامتحان نهائي.`, { duration: '10' }),
      L('الدرس الأول: المفاهيم الأساسية', 'pdf', 'ملخص الدرس في ملف PDF للمراجعة والطباعة.', { url: DEMO_FILES.pdf[0], duration: '15' }),
      L('الدرس الثاني: تطبيق صوتي', 'audio', 'استمع للتطبيق ثم أعده بصوتك.', { url: DEMO_FILES.audio[0], duration: '8' }),
      L('الدرس الثالث: مسائل وتمارين', 'text', 'حلّ التمارين التالية ثم راجعها مع الملف المرفق:\n١. عرّف المصطلحات الواردة في الدرس الأول.\n٢. اذكر ثلاثة أمثلة تطبيقية.\n٣. لخّص الدرس في خمسة أسطر.', { duration: '20' })
    ];
  };
  for (const c of academyCourses()) {
    const ex = all.find(x => (x.title || '').trim() === c.title && (x.program || '') === c.program);
    if (ex) { C[c.title] = ex; continue; }
    const id = 'demo-c-' + (c.program === 'academy' ? `a${c.term}-${c.order}` : `i-${c.ijazaKey}`);
    const plan = ACADEMY_PLAN.find(p => p[1] === c.title);
    const v = { ...c, published: true, instructor: ['د. ماهر شاكر', 'د. غالية طلبية', 'د. أريج حلواني'][(c.order || 1) % 3], createdAt: c.createdAt, gradePass: 60 };
    if (plan && +plan[0] <= 2) v.lessons = lessonsFor(plan);
    if (c.program === 'ijaza') { v.lessons = [L('مقدمة الإجازة وشروطها', 'text', c.description), L('تطبيق: سورة الفاتحة', 'audio', 'استمع ثم اقرأ على شيخك في اللقاء.', { url: DEMO_FILES.audio[0] })]; v.gradeDist = { att: 20, part: 20, quiz: 0, final: 60 }; }
    if (plan && +plan[0] <= 2) {
      const ls = v.lessons;
      v.attachments = [att('pdf', 'ملخص الدرس الأول', ls[1].id), att('word', 'أسئلة المراجعة (قابلة للتعديل)', ls[3].id), att('audio', 'تسجيل المحاضرة', ls[2].id)];
      if (c.title === 'فقه العبادات') v.attachments.push(att('excel', 'جدول مواقيت ومقادير الزكاة'), att('image', 'مخطط أركان الصلاة', ls[0].id), att('video', 'مقطع توضيحي', ls[2].id), att('file', 'ملفات المادة مضغوطة'));
    }
    await put('courses', id, v); C[c.title] = { id, ...v };
  }
  /* الدورات العامة الثلاث، والسيرة دورة مباشرة بلقاءات */
  for (const c of demoCourses()) {
    const ex = byTitle(c.title);
    if (ex) { C[c.title] = ex; continue; }
    const gid = 'demo-g-' + (c.category === 'حديث' ? 'nawawi' : c.category === 'تجويد' ? 'tajweed' : 'seerah');
    const v = { ...c, attachments: [att('pdf', 'متن الدورة للطباعة'), att('audio', 'تطبيق صوتي')] };
    if (c.category === 'سيرة') Object.assign(v, { online: true, livePlatform: 'zoom', liveSchedule: 'كل أحد وأربعاء — 8 مساءً بتوقيت دمشق', attachments: [att('pdf', 'خريطة أحداث السيرة'), att('image', 'خريطة مكة والمدينة')] });
    await put('courses', gid, v); C[c.title] = { id: gid, ...v };
  }
  const sira = C['مختصر السيرة النبوية'];
  if (sira?.id?.startsWith('demo-')) {
    const at = d0(now) + 20 * 3600e3, wk = 7 * DEMO_DAY;
    await put('courseLive', sira.id, { url: 'https://zoom.us/j/81234567890?pwd=demo', meetingId: '812 3456 7890', passcode: 'bayan', note: 'ادخل باسمك الثلاثي وأغلق الميكروفون حتى يُؤذن لك.', updatedAt: now,
      sessions: [{ id: 'ls1', title: 'اللقاء 1 — المولد والنشأة', at: at - 2 * wk, dur: 60, url: '', rec: DEMO_FILES.video[0] }, { id: 'ls2', title: 'اللقاء 2 — البعثة', at: at - wk, dur: 60, url: '', rec: '' }, { id: 'ls3', title: 'اللقاء 3 — الهجرة', at: now - 10 * 6e4, dur: 60, url: '', rec: '' }, { id: 'ls4', title: 'اللقاء 4 — بناء الدولة', at: at + wk, dur: 60, url: '', rec: '' }] });
  }
  const T1C = ACADEMY_PLAN.filter(p => p[0] === 1).map(p => C[p[1]]).filter(Boolean), T2C = ACADEMY_PLAN.filter(p => p[0] === 2).map(p => C[p[1]]).filter(Boolean);

  /* ---------- الفصول والتقويم ---------- */
  step('الفصول والتقويم الأكاديمي');
  const T = {
    t1: { name: 'الفصل الأول 2025/2026', program: 'academy', startsAt: day(-300), endsAt: day(-170) + DEMO_DAY - 1, examStart: day(-190), examEnd: day(-176) + DEMO_DAY - 1, examLock: true, enrollMode: 'closed', events: [], closedAt: now - 168 * DEMO_DAY, closeSummary: 'رُفّع 2 — قُيّدوا في الفصل الثاني 2025/2026', createdAt: now - 330 * DEMO_DAY },
    t2: { name: 'الفصل الثاني 2025/2026', program: 'academy', startsAt: day(-75), endsAt: day(75) + DEMO_DAY - 1, examStart: day(50), examEnd: day(65) + DEMO_DAY - 1, examLock: true, enrollMode: 'closed', closedAt: 0, createdAt: now - 160 * DEMO_DAY,
      events: [{ id: 'ev1', kind: 'holiday', title: 'عطلة منتصف الفصل', from: day(12), to: day(18) + DEMO_DAY - 1, courseId: '' }, { id: 'ev2', kind: 'deadline', title: 'آخر موعد لتسليم البحث', from: day(30), to: day(30) + DEMO_DAY - 1, courseId: '' }] },
    t3: { name: 'الفصل الأول 2026/2027', program: 'academy', startsAt: day(100), endsAt: day(230) + DEMO_DAY - 1, examStart: day(205), examEnd: day(220) + DEMO_DAY - 1, examLock: true, enrollMode: 'closed', events: [], closedAt: 0, createdAt: now - 20 * DEMO_DAY }
  };
  const fiqh = C['فقه العبادات'], mustalah = C['مصطلح الحديث'], aqida = C['مبادئ العقيدة الإسلامية'];
  if (fiqh) T.t2.events.push({ id: 'ev3', kind: 'exam', title: 'امتحان', from: day(52), to: day(52) + DEMO_DAY - 1, courseId: fiqh.id });
  for (const [k, v] of Object.entries(T)) { await put('terms', 'demo-' + k, { ...v, updatedAt: now }); T[k] = { id: 'demo-' + k, ...v }; }

  /* ---------- طلبات الالتحاق والقيد ---------- */
  step('طلبات الالتحاق والقيد');
  const APPS = { demo: ['academy', 'accepted', 2519001, 'دفعة 2025'], fatima: ['academy', 'accepted', 2519002, 'دفعة 2025'], omar: ['academy', 'accepted', 2619001, 'دفعة 2026'], aisha: ['academy', 'accepted', 2619002, 'دفعة 2026'],
    maryam: ['ijaza', 'accepted', 2629001, 'دفعة 2026'], yusuf: ['academy', 'submitted'], khadija: ['ijaza', 'incomplete'], hasan: ['academy', 'rejected'] };
  const R = {};
  for (const [k, [p, status, no, cohort]] of Object.entries(APPS)) {
    if (!has(k)) continue; const s = U[k], sub = now - (k === 'yusuf' ? 3 : k === 'khadija' ? 9 : ['demo', 'fatima'].includes(k) ? 315 : 95) * DEMO_DAY;
    const a = { uid: s.uid, program: p, track: p === 'ijaza' ? 'quran' : '', userName: s.name, username: s.key, name: s.name, nameEn: s.nameEn, birthDate: s.birth, gender: s.gender, nationality: s.nationality, country: s.country, city: s.city, phone: s.phone, email: '',
      qual: s.qual, qualSpec: s.qual === 'bachelor' ? 'شريعة' : '', qualYear: '2020', qualFrom: s.country, arabic: p === 'ijaza' ? (k === 'khadija' ? 'good' : 'fluent') : '', quranAmt: p === 'ijaza' ? 'خمسة أجزاء' : '', priorIjaza: '', motivation: 'أرغب في طلب العلم الشرعي على منهج منضبط، والانتفاع به في الدعوة والتعليم.', heard: HEARD[k.length % HEARD.length], pledge: true, hasFile: k !== 'yusuf' && p === 'academy', status, submittedAt: sub, updatedAt: sub,
      history: [{ at: sub, status: 'submitted', note: '' }] };
    if (status === 'accepted') Object.assign(a, { studentNo: String(no), cohort, decidedAt: sub + 6 * DEMO_DAY, decisionNote: 'مبارك قبولك، نسأل الله لك التوفيق.', history: [...a.history, { at: sub + 6 * DEMO_DAY, status: 'accepted', note: '' }] });
    if (status === 'incomplete') Object.assign(a, { decidedAt: sub + 2 * DEMO_DAY, decisionNote: 'يرجى توضيح مقدار حفظك من القرآن الكريم بدقة (بالأجزاء)، وإرفاق ما يثبت مستوى العربية إن وجد.', history: [...a.history, { at: sub + 2 * DEMO_DAY, status: 'incomplete', note: 'طلب استكمال' }] });
    if (status === 'rejected') Object.assign(a, { decidedAt: sub + 4 * DEMO_DAY, decisionNote: 'شرط القبول في البرنامج الأكاديمي: الشهادة الثانوية. يسعدنا التحاقك ببرنامج الإجازات أو الدورات العامة.', history: [...a.history, { at: sub + 4 * DEMO_DAY, status: 'rejected', note: '' }] });
    await put('applications', `${s.uid}_${p}`, a);
    if (status !== 'accepted') continue;
    const r = { uid: s.uid, program: p, track: a.track, level: p === 'academy' ? (['demo', 'fatima'].includes(k) ? 2 : 1) : 0, status: 'active', studentNo: String(no), cohort, name: s.name, nameEn: s.nameEn, username: s.key, admittedAt: a.decidedAt, appId: `${s.uid}_${p}`, updatedAt: now };
    await put('records', `${s.uid}_${p}`, r); R[k] = { id: `${s.uid}_${p}`, ...r };
  }

  /* ---------- القيد في الفصول وتسجيل المواد ---------- */
  step('القيد في الفصول وتسجيل المواد');
  const reg = async (k, t, level, courses, by, repeatIds = []) => {
    const s = U[k], ids = courses.map(c => c.id);
    await put('regs', `${s.uid}_${t.id}`, { uid: s.uid, termId: t.id, termName: t.name, program: 'academy', level, cohort: R[k].cohort, name: s.name, studentNo: R[k].studentNo, courseIds: ids, repeatIds, at: t.startsAt - 5 * DEMO_DAY, by });
  };
  const enroll = async (k, c, termId, done = 0, extra = {}) => {
    const s = U[k], ls = c.lessons || [];
    await put('enrollments', `${s.uid}_${c.id}`, { uid: s.uid, courseId: c.id, userName: s.name, courseTitle: c.title, completed: ls.slice(0, done).map(l => l.id), enrolledAt: now - 80 * DEMO_DAY, lastLesson: ls[Math.max(0, done - 1)]?.id || '', lastAt: now - (done ? 3 : 80) * DEMO_DAY, termId, by: 'record', ...extra });
  };
  for (const k of ['demo', 'fatima'].filter(has)) {
    await reg(k, T.t1, 1, T1C, 'accept');
    await reg(k, T.t2, 2, k === 'demo' && mustalah ? [...T2C, mustalah] : T2C, 'promote', k === 'demo' && mustalah ? [mustalah.id] : []);
    for (const c of T1C) await enroll(k, c, k === 'demo' && c === mustalah ? T.t2.id : T.t1.id, (c.lessons || []).length, k === 'demo' && c === mustalah ? { repeat: 2 } : {});
    for (const c of T2C) await enroll(k, c, T.t2.id, k === 'demo' ? 2 : 3);
  }
  for (const k of ['omar', 'aisha'].filter(has)) { await reg(k, T.t2, 1, T1C, 'accept'); for (const c of T1C) await enroll(k, c, T.t2.id, k === 'omar' ? 1 : 3); }
  const quranI = C['القرآن الكريم'];
  if (has('maryam') && quranI) await enroll('maryam', quranI, '', 1, { by: '' });

  /* ---------- الامتحانات الرسمية والتسليمات والدرجات ---------- */
  step('الامتحانات الرسمية والدرجات');
  const BANK = [
    { id: 'q1', type: 'mcq', text: 'ما حكم الطهارة لصحة الصلاة؟', options: ['سنة', 'شرط', 'واجب مستقل', 'مستحب'], pts: 2 },
    { id: 'q2', type: 'mcq', text: 'كم عدد فرائض الوضوء عند الشافعية؟', options: ['أربع', 'خمس', 'ست', 'سبع'], pts: 2 },
    { id: 'q3', type: 'tf', text: 'التيمم يرفع الحدث رفعاً مطلقاً عند الشافعية.', options: ['صح', 'خطأ'], pts: 2 },
    { id: 'q4', type: 'mcq', text: 'ما أول وقت صلاة الظهر؟', options: ['طلوع الشمس', 'زوال الشمس', 'مصير ظل الشيء مثله', 'غروب الشمس'], pts: 2 },
    { id: 'q5', type: 'tf', text: 'النية ركن في الصلاة.', options: ['صح', 'خطأ'], pts: 2 },
    { id: 'q6', type: 'short', text: 'ما اسم الماء الذي تغيّر بطاهر تغيّراً كثيراً؟', pts: 5 },
    { id: 'q7', type: 'essay', text: 'اشرح شروط وجوب الزكاة مع التمثيل.', pts: 5 }
  ];
  const KEYS = { q1: { a: 1 }, q2: { a: 2 }, q3: { a: 1 }, q4: { a: 1 }, q5: { a: 0 }, q6: { acc: ['الماء الطاهر', 'طاهر غير مطهر'] }, q7: { model: 'ملك النصاب، حولان الحول، الملك التام، الإسلام والحرية — مع مثال لكل شرط.' } };
  const mkExam = async (id, c, t, kind, title, o = {}) => {
    const v = { ...DEFAULT_OFFEXAM(kind), title, courseId: c.id, courseTitle: c.title, program: c.program || '', termId: t?.id || '', published: true, createdAt: now - 200 * DEMO_DAY, updatedAt: now, ...o };
    v.nq = paperCount(v, BANK); v.counts = typeCounts(BANK);
    await put('exams', id, v); await put('examPapers', id, { courseId: c.id, questions: BANK, updatedAt: now }); await put('examKeys', id, { answers: KEYS, updatedAt: now });
    return { id, ...v };
  };
  /* answers: إجابات الطالب، essay: درجة المقالي اليدوية (null = بانتظار التصحيح) */
  const sit = async (e, k, answers, essay, at) => {
    const s = U[k], sid = `${e.id}_${s.uid}`, st = { uid: s.uid, userName: s.name, examId: e.id, courseId: e.courseId, kind: e.kind, qids: BANK.map(q => q.id), answers, status: 'submitted', by: 'server' };
    const g = gradeSitting(st, BANK, KEYS, essay == null ? {} : { manual: { q7: essay } });
    await put('grades', sid, { uid: s.uid, userName: s.name, examId: e.id, courseId: e.courseId, kind: e.kind, points: g.points, total: g.total, score: g.score, pending: g.pending, review: g.review, passed: !g.pending && g.score >= (+e.passScore || 60), rows: g.rows, manual: g.manual, notes: g.notes, feedback: essay != null && essay < 3 ? 'راجع شروط الزكاة من الكتاب المقرّر.' : '', gradedAt: at + 3600e3, by: 'admin' });
    await put('sittings', sid, { ...st, startedAt: ts(at), savedAt: ts(at + 40 * 6e4), submittedAt: ts(at + 41 * 6e4) });
    await put('sitPapers', sid, { uid: s.uid, examId: e.id, courseId: e.courseId, at, questions: BANK.map(q => ({ id: q.id, type: q.type, text: q.text, pts: q.pts, ...(q.options ? { options: q.options } : {}) })) });
    return g.score;
  };
  const GOOD = { q1: 1, q2: 2, q3: 1, q4: 1, q5: 0, q6: 'ماء طاهر' }, MID = { q1: 1, q2: 1, q3: 1, q4: 1, q5: 0, q6: 'ماء متغير' }, LOW = { q1: 0, q2: 1, q3: 0, q4: 1, q5: 1, q6: '' };
  const EX = {};
  if (fiqh) {
    EX.fq1 = await mkExam('demo-x-fq1', fiqh, T.t1, 'quiz', 'مذاكرة الطهارة', { opensAt: T.t1.startsAt + 40 * DEMO_DAY, closesAt: T.t1.startsAt + 41 * DEMO_DAY, duration: 30, resultsOut: true });
    EX.ff1 = await mkExam('demo-x-ff1', fiqh, T.t1, 'final', 'الامتحان النهائي', { opensAt: T.t1.examStart + 2 * DEMO_DAY + 9 * 3600e3, closesAt: T.t1.examStart + 2 * DEMO_DAY + 12 * 3600e3, duration: 90, resultsOut: true });
    EX.fq2 = await mkExam('demo-x-fq2', fiqh, T.t2, 'quiz', 'مذاكرة الطهارة', { opensAt: now - 20 * DEMO_DAY, closesAt: now - 19 * DEMO_DAY, duration: 30, resultsOut: true });
    EX.ff2 = await mkExam('demo-x-ff2', fiqh, T.t2, 'final', 'الامتحان النهائي', { opensAt: day(52) + 9 * 3600e3, closesAt: day(52) + 12 * 3600e3, duration: 90 });
  }
  if (mustalah) {
    EX.mf1 = await mkExam('demo-x-mf1', mustalah, T.t1, 'final', 'الامتحان النهائي', { opensAt: T.t1.examStart + 4 * DEMO_DAY + 9 * 3600e3, closesAt: T.t1.examStart + 4 * DEMO_DAY + 12 * 3600e3, duration: 90, resultsOut: true });
    EX.mf2 = await mkExam('demo-x-mf2', mustalah, T.t2, 'final', 'الامتحان النهائي (الفصل الثاني)', { opensAt: day(55) + 9 * 3600e3, closesAt: day(55) + 12 * 3600e3, duration: 90, note: 'لمن يعيد المادة ولطلاب الفصل.' });
  }
  if (aqida) EX.aq2 = await mkExam('demo-x-aq2', aqida, T.t2, 'quiz', 'مذاكرة أركان الإيمان', { opensAt: now - DEMO_DAY, closesAt: now + 5 * DEMO_DAY, duration: 40, note: 'يُسمح بالرجوع إلى المتن المقرّر.' });
  const SC = {};
  if (EX.fq1) { if (has('demo')) SC.demo_fq1 = await sit(EX.fq1, 'demo', MID, 3, EX.fq1.opensAt + 3600e3); if (has('fatima')) SC.fatima_fq1 = await sit(EX.fq1, 'fatima', GOOD, 5, EX.fq1.opensAt + 2 * 3600e3); }
  if (EX.ff1) { if (has('demo')) SC.demo_ff1 = await sit(EX.ff1, 'demo', GOOD, 3, EX.ff1.opensAt + 600e3); if (has('fatima')) SC.fatima_ff1 = await sit(EX.ff1, 'fatima', GOOD, 4.5, EX.ff1.opensAt + 300e3); }
  if (EX.mf1) { if (has('demo')) SC.demo_mf1 = await sit(EX.mf1, 'demo', LOW, 1, EX.mf1.opensAt + 600e3); if (has('fatima')) SC.fatima_mf1 = await sit(EX.mf1, 'fatima', MID, 4, EX.mf1.opensAt + 900e3); }
  if (EX.fq2) { if (has('omar')) SC.omar_fq2 = await sit(EX.fq2, 'omar', MID, 2.5, EX.fq2.opensAt + 3600e3); if (has('aisha')) SC.aisha_fq2 = await sit(EX.fq2, 'aisha', GOOD, null, EX.fq2.opensAt + 1800e3); }
  if (EX.aq2 && has('demo')) SC.demo_aq2 = await sit(EX.aq2, 'demo', GOOD, null, now - 5 * 3600e3);
  for (const c of [fiqh, mustalah, aqida].filter(c => c && c.id.startsWith('demo-'))) await DB.update('courses', c.id, { offExams: Object.values(EX).filter(e => e.courseId === c.id && e.published).length });

  /* ---------- العلامات وكشوف الدرجات ---------- */
  step('العلامات وكشوف الدرجات');
  const mark = async (k, c, t, parts, o = {}) => {
    if (!c || !has(k)) return; const s = U[k], dist = gradeDist(c), r = computeMark(c, parts);
    await put('marks', markId(s.uid, c.id, t?.id), { uid: s.uid, courseId: c.id, termId: t?.id || '', termName: t?.name || '', termStart: +t?.startsAt || 0, program: c.program || '', level: +c.term || 0, order: +c.order || 0,
      name: s.name, studentNo: R[k]?.studentNo || '', courseTitle: c.title, hours: +c.hours || '', dist, pass: coursePass(c), ...parts, src: { quiz: o.qa ? 'auto' : 'manual', final: o.fa ? 'auto' : 'manual' },
      total: r.total, result: r.result, word: r.word, attempt: o.attempt || 1, published: o.pub ?? true, updatedAt: now - (o.ago ?? 160) * DEMO_DAY, by: 'admin' });
  };
  const pct = (v, w) => v == null ? null : Math.round(v * w) / 100;
  const T1MARKS = {
    demo: { 'اللغة العربية (1)': [9, 8, 15, 46], 'اللغة الإنكليزية (1)': [10, 9, 17, 49], 'القرآن الكريم (1)': [10, 10, 18, 53], 'فقه العبادات': [9, 8, pct(SC.demo_fq1, 20), pct(SC.demo_ff1, 60)], 'مصطلح الحديث': [7, 5, 9, pct(SC.demo_mf1, 60)] },
    fatima: { 'اللغة العربية (1)': [10, 10, 19, 56], 'اللغة الإنكليزية (1)': [10, 9, 16, 53], 'القرآن الكريم (1)': [10, 10, 20, 57], 'فقه العبادات': [10, 9, pct(SC.fatima_fq1, 20), pct(SC.fatima_ff1, 60)], 'مصطلح الحديث': [9, 8, 15, pct(SC.fatima_mf1, 60)] }
  };
  for (const [k, m] of Object.entries(T1MARKS)) for (const [title, [a, b, q, f]] of Object.entries(m)) { const c = C[title]; await mark(k, c, T.t1, { att: a, part: b, quiz: q, final: f }, { qa: title === 'فقه العبادات', fa: ['فقه العبادات', 'مصطلح الحديث'].includes(title) }); }
  /* الفصل الجاري: حضور ومشاركة مرصودة، والمذاكرة من الامتحان، والنهائي لم يُعقد بعد — غير معتمدة */
  for (const k of ['demo', 'fatima']) for (const c of T2C) await mark(k, c, T.t2, { att: k === 'demo' ? 8 : 10, part: k === 'demo' ? 7 : 9, quiz: c === aqida && k === 'demo' ? pct(SC.demo_aq2, 20) : null, final: null }, { pub: false, ago: 2, qa: c === aqida });
  if (mustalah) await mark('demo', mustalah, T.t2, { att: 9, part: 8, quiz: 14, final: null }, { pub: false, ago: 2, attempt: 2 });
  for (const k of ['omar', 'aisha']) for (const c of T1C) await mark(k, c, T.t2, { att: k === 'omar' ? 7 : 10, part: k === 'omar' ? 6 : 9, quiz: c === fiqh ? pct(SC[k + '_fq2'], 20) : k === 'omar' ? 12 : 17, final: null }, { pub: false, ago: 2, qa: c === fiqh });
  if (quranI) await mark('maryam', quranI, null, { att: 18, part: 17, quiz: 0, final: 54 }, { ago: 10 });

  /* ---------- الدورات العامة: تسجيلات واختبارات ذاتية وشهادات ---------- */
  step('الدورات العامة والشهادات');
  const nawawi = C['شرح الأربعين النووية'], tajweed = C['مبادئ التجويد للمبتدئين'];
  const gEnroll = async (k, c, done) => { if (!c || !has(k)) return; const s = U[k], ls = c.lessons || []; await put('enrollments', `${s.uid}_${c.id}`, { uid: s.uid, courseId: c.id, userName: s.name, courseTitle: c.title, completed: ls.slice(0, done).map(l => l.id), enrolledAt: now - 40 * DEMO_DAY, lastLesson: ls[Math.max(0, done - 1)]?.id || '', lastAt: now - 6 * DEMO_DAY }); };
  await gEnroll('aisha', nawawi, 99); await gEnroll('hasan', nawawi, 2); await gEnroll('hasan', tajweed, 99); await gEnroll('fatima', tajweed, 99); await gEnroll('demo', sira, 1); await gEnroll('omar', sira, 0);
  const attempt = async (k, c, score, passed, ago) => { if (!c || !has(k)) return; const s = U[k], n = (c.exam?.questions || []).length || 3; await put('attempts', `demo-at-${k}-${c.id}-${ago}`, { uid: s.uid, userName: s.name, courseId: c.id, courseTitle: c.title, score, correct: Math.round(score / 100 * n), total: n, passed, at: now - ago * DEMO_DAY, answers: {} }); };
  await attempt('aisha', nawawi, 100, true, 20); await attempt('hasan', tajweed, 50, false, 15); await attempt('hasan', tajweed, 75, true, 14); await attempt('fatima', tajweed, 100, true, 30);
  const cert = async (code, k, c, score, ago) => { if (!c || !has(k)) return; const s = U[k]; await put('certificates', code, { uid: s.uid, courseId: c.id, name: s.name, nameEn: s.nameEn, courseTitle: c.title, courseTitleEn: c.titleEn || '', instructor: c.instructor || '', instructorEn: c.instructorEn || '', certType: c.certType || '', score, issuedAt: now - ago * DEMO_DAY }); };
  await cert('BYN-DEMO-AISH', 'aisha', nawawi, 100, 20); await cert('BYN-DEMO-HASN', 'hasan', tajweed, 75, 14); await cert('BYN-DEMO-FATM', 'fatima', tajweed, 100, 30);

  /* ---------- الرسائل والأسئلة الشائعة ---------- */
  step('الرسائل والأسئلة الشائعة');
  const MSGS = [['محمد السيد', '+90 5551234567', 'التسجيل في دورة', 'السلام عليكم، أنا مقيم في تركيا، هل يمكنني التسجيل في البرنامج الأكاديمي والدراسة عن بُعد بالكامل؟', 'new', 0.2],
    ['سارة الأحمد', 'sara.ahmad@example.com', 'الشهادات', 'هل الشهادة معتمدة من وزارة الأوقاف؟ وهل تُرسل نسخة ورقية؟', 'new', 1], ['أبو خالد', '+966 555123456', 'استفسار عام', 'متى يبدأ الفصل القادم؟ وما مواعيد اللقاءات المباشرة؟', 'read', 3],
    ['Ahmed K.', '+49 1701234567', 'مشكلة تقنية', 'لا يظهر لي فيديو الدرس الثاني على الجوال.', 'done', 6], ['ليلى', '+963 933445566', 'اقتراح', 'أقترح إضافة ملخصات صوتية لكل درس، جزاكم الله خيراً.', 'read', 9]];
  /* القواعد تقبل إنشاء الرسالة بحالة «جديدة» فقط، ثم يغيّرها المشرف */
  for (const [i, [name, reply, topic, body, status, ago]] of MSGS.entries()) { await put('messages', 'demo-m' + i, { name, reply, topic, body, at: now - ago * DEMO_DAY, uid: '', status: 'new' }); if (status !== 'new') await DB.update('messages', 'demo-m' + i, { status }); }
  if (!(await safeList('faqs')).length) for (const [i, [cat, q, a]] of DEFAULT_FAQS.entries()) await put('faqs', 'demo-f' + i, { cat, q, a, order: i + 1, published: true, createdAt: now });

  /* ---------- الإعدادات (في الوضع التجريبي فقط — لا تُغيَّر إعدادات منصة حقيقية) ---------- */
  if (!S.live) await DB.update('settings', 'main', { phones: [{ label: 'سوريا', number: '+963 944000111', wa: true }, { label: 'تركيا', number: '+90 5320001122', wa: true }, { label: 'السعودية', number: '+966 500001122', wa: false }], email: 'info@bayan.example', social: { youtube: 'https://youtube.com/', telegram: 'https://t.me/' }, terms: '## الاستخدام\nتُستعمل المنصة لأغراض التعلّم فقط.\n\n## الخصوصية\nلا نشارك بياناتك مع أي جهة.' });

  await DB.set('settings', 'demo', { ids: track, auth: [...authUsers], at: now });
  step('تم');
  return { users: Object.keys(U).length, docs: Object.values(track).reduce((a, l) => a + l.length, 0) };
}

/* حذف كل ما أنشأته البيانات التجريبية (وحسابات الدخول التجريبية في Firebase) */
async function removeDemo(progress = () => {}) {
  const d = await safeGet('settings', 'demo'); if (!d) return 0;
  let n = 0;
  const order = ['grades', 'sittings', 'sitPapers', 'examKeys', 'examPapers', 'exams', 'marks', 'certificates', 'attempts', 'enrollments', 'regs', 'records', 'applications', 'courseLive', 'messages', 'faqs', 'terms', 'courses', 'users'];
  const cols = [...order, ...Object.keys(d.ids || {}).filter(c => !order.includes(c))];
  for (const c of cols) for (const id of (d.ids || {})[c] || []) { if (c === 'users' && id === 'demo' && !S.live) { await DB.del('users', id).catch(() => {}); n++; continue; } await DB.del(c, id).catch(() => {}); n++; if (n % 25 === 0) progress(`حُذف ${n}`); }
  if (S.live && (d.auth || []).length) {
    const sec = firebase.apps.find(a => a.name === 'demo-seed') || firebase.initializeApp(FIREBASE_CONFIG, 'demo-seed');
    for (const k of d.auth) { try { const c = await sec.auth().signInWithEmailAndPassword(toEmail(k), DEMO_PASS); await c.user.delete(); } catch (e) { console.warn('تعذّر حذف حساب', k, e.code); } }
    await sec.auth().signOut().catch(() => {});
  }
  /* إعادة حساب عدد الامتحانات في المواد الحقيقية التي استُعملت */
  for (const c of await safeList('courses')) { const n2 = (await safeList('exams', { courseId: c.id })).filter(x => x.published).length; if ((+c.offExams || 0) !== n2) await DB.update('courses', c.id, { offExams: n2 }).catch(() => {}); }
  await DB.del('settings', 'demo');
  return n;
}
