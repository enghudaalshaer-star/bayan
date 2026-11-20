const { open, sleep } = require('./run.js');
const fs = require('fs');
const db = JSON.parse(fs.readFileSync(__dirname + '/.tmp/seed.json'));
const ids = c => Object.keys(db[c] || {});
const demoUid = Object.entries(db.users).find(([, u]) => u.username === 'demo')[0];
const courses = Object.entries(db.courses).map(([id, c]) => ({ id, ...c }));
const withLessons = courses.find(c => c.published && (c.lessons || []).length && db.enrollments[`${demoUid}_${c.id}`]) || courses.find(c => (c.lessons||[]).length);
const withExam = courses.find(c => (c.exam?.questions || []).length && db.enrollments[`${demoUid}_${c.id}`]) || courses[0];
const exam = Object.entries(db.exams).find(([, e]) => db.enrollments[`${demoUid}_${e.courseId}`]) || Object.entries(db.exams)[0];
const cert = ids('certificates')[0], term = ids('terms')[0], marked = Object.values(db.marks)[0];
const IGN = /fonts\.googleapis|setTransform|getContext|Not implemented: (HTMLCanvas|window\.scrollTo|navigation)|cdnjs/;
async function sweep(page, ls, routes, label) {
  const { w, errors } = await open(page, { bayan_db_v1: JSON.stringify(db), bayan_seeded: '1', bayan_seeded_v2: '1', ...ls });
  await sleep(800); let bad = 0;
  for (const r of routes) {
    errors.length = 0; w.location.hash = r; await sleep(900);
    const app = w.document.querySelector('#app'), txt = (app?.textContent || '').replace(/\s+/g, ' ');
    const errs = errors.filter(e => !IGN.test(e));
    const flag = errs.length || /تعذّر تشغيل|undefined|NaN|\[object Object\]/.test(txt) || txt.length < 40;
    if (flag) { bad++; console.log(`✗ [${label}] ${r}`, errs.slice(0, 3).map(e => e.slice(0, 400)), (txt.match(/.{0,60}(undefined|NaN|\[object Object\]|تعذّر).{0,60}/) || [''])[0], txt.length); }
    else console.log(`✓ [${label}] ${r}`);
  }
  w.close(); return bad;
}
(async () => {
  let bad = 0;
  const pub = ['#/', '#/courses', '#/courses?p=academy', `#/course/${withLessons.id}`, '#/programs', '#/ijaza/quran', '#/ijaza/hadith', '#/calendar', '#/about', '#/contact', '#/terms', '#/faq', '#/verify', `#/cert/${cert}`, `#/cert/${cert}/en`, '#/login', '#/register', '#/apply', '#/nope'];
  bad += await sweep('index.html', {}, pub, 'visitor');
  const st = [...pub.slice(0, 4), `#/learn/${withLessons.id}/${withLessons.lessons[0].id}`, `#/exam/${withExam.id}`, `#/test/${exam[0]}`, '#/me', '#/me#transcript', '#/library', '#/apply/academy', '#/apply/ijaza', '#/apply/academy?edit=1', `#/cert/${cert}`];
  bad += await sweep('index.html', { bayan_session: JSON.stringify({ uid: demoUid }) }, st, 'student');
  const adm = ['#/', '#/courses', `#/course/${withLessons.id}`, `#/course/${withLessons.id}?t=lessons`, `#/course/${withLessons.id}?t=lib`, `#/course/${withLessons.id}?t=offx`, `#/course/${withLessons.id}?t=live`, '#/students', '#/results', '#/results/practice', '#/results/marks',
    `#/exam/${exam[0]}`, `#/exam/${exam[0]}/questions`, `#/exam/${exam[0]}/grading`, `#/marks/${marked.courseId}`, `#/marks/${marked.courseId}/${marked.termId}`, `#/transcript/${demoUid}`, '#/certs', '#/certs/types', '#/certs/courses', '#/certs/settings',
    '#/admissions', '#/admissions/settings', '#/registry', '#/registry/terms', `#/term/${term}`, '#/messages', '#/faq', '#/settings'];
  bad += await sweep('cp-7q4x9k.html', { bayan_admin_session: JSON.stringify({ admin: true }) }, adm, 'admin');
  console.log('BAD', bad); process.exit(bad ? 1 : 0);
})();
