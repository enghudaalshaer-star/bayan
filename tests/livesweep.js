const { JSDOM, VirtualConsole, ResourceLoader } = require('jsdom');
const fs = require('fs'), path = require('path'), http = require('http');
const install = require('./fakefb.js');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const seed = JSON.parse(fs.readFileSync(__dirname + '/.tmp/seed.json'));
if (process.env.CATALOG) { const lite = c => { const o = { ...c }; if (o.lessons) o.lessons = o.lessons.map(({ content, ...l }) => l); if (o.exam?.questions) o.exam = { ...o.exam, questions: o.exam.questions.map(q => ({ id: q.id })) }; return o; };
  seed.stats = { ...(seed.stats || {}), catalog: { courses: Object.entries(seed.courses).map(([id, c]) => lite({ id, ...c })), faqs: Object.entries(seed.faqs).map(([id, f]) => ({ id, ...f })), updatedAt: 1 } }; }
seed.users.admin1 = { name: 'المشرف', username: 'admin1', createdAt: 1, disabled: false };
const demoUid = Object.entries(seed.users).find(([, u]) => u.username === 'demo')[0];
class L extends ResourceLoader { fetch(url, o) { if (/gstatic|googleapis|cdnjs/.test(url)) return Promise.resolve(Buffer.from('')); return super.fetch(url, o); } }
let PORT; const srv = http.createServer((q, r) => { const p = path.join(__dirname, '.tmp', 'live', decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, b) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : 'text/html; charset=utf-8' }); r.end(b); }); });
const IGN = /setTransform|getContext|Not implemented/;
async function sweep(page, uid, admins, routes, label) {
  const errors = [], vc = new VirtualConsole(); vc.on('jsdomError', e => errors.push(String(e.detail?.stack || e.message))); vc.on('error', (...a) => errors.push(a.map(String).join(' ')));
  let fb;
  const dom = await JSDOM.fromURL(`http://localhost:${PORT}/${page}`, { runScripts: 'dangerously', resources: new L(), pretendToBeVisual: true, virtualConsole: vc, beforeParse(w) {
    w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} }); w.IntersectionObserver = class { observe() {} disconnect() {} unobserve() {} };
    w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {}; w.structuredClone = globalThis.structuredClone; Object.defineProperty(w, 'crypto', { value: globalThis.crypto }); w.print = () => {};
    w.HTMLCanvasElement.prototype.getContext = () => null;
    w.addEventListener('error', e => errors.push('onerror ' + (e.error?.stack || e.message))); w.addEventListener('unhandledrejection', e => errors.push('unhandled ' + (e.reason?.stack || e.reason)));
    fb = install(w, seed, { uid, admins }); } });
  const w = dom.window; await sleep(1500); let bad = 0;
  for (const r of routes) {
    errors.length = 0; const r0 = fb.stats.reads; w.location.hash = r; await sleep(900);
    const txt = (w.document.querySelector('#app')?.textContent || '').replace(/\s+/g, ' '), errs = errors.filter(e => !IGN.test(e));
    const flag = errs.length || /تعذّر تشغيل|undefined|NaN|\[object Object\]/.test(txt) || txt.length < 40;
    if (flag) bad++;
    console.log(`${flag ? '✗' : '✓'} [${label}] ${r.padEnd(34)} reads=${fb.stats.reads - r0}`, flag ? [errs.slice(0, 2).map(e => e.slice(0, 300)), (txt.match(/.{0,50}(undefined|NaN|تعذّر).{0,50}/) || [''])[0]] : '');
  }
  console.log(`  [${label}] reads by collection`, JSON.stringify(fb.stats.byCol), 'agg calls', fb.stats.agg);
  w.close(); return bad;
}
(async () => {
  await new Promise(r => srv.listen(0, () => { PORT = srv.address().port; r(); }));
  const db = seed, cid = 'demo-c-a1-1', les = db.courses[cid].lessons[0].id, ex = Object.keys(db.exams)[0], cert = Object.keys(db.certificates)[0], term = Object.keys(db.terms)[0], mk = Object.values(db.marks)[0];
  let bad = 0;
  const pub = ['#/', '#/courses', `#/course/${cid}`, '#/programs', '#/ijaza/quran', '#/calendar', '#/about', '#/faq', `#/cert/${cert}`, '#/contact', '#/', '#/courses'];
  bad += await sweep('index.html', null, [], pub, 'visitor');
  bad += await sweep('index.html', demoUid, [], ['#/', `#/course/${cid}`, `#/learn/${cid}/${les}`, '#/me', '#/library', `#/test/${ex}`, '#/apply/academy'], 'student');
  bad += await sweep('cp-7q4x9k.html', 'admin1', ['admin1'], ['#/', '#/courses', `#/course/${cid}`, '#/students', '#/results', '#/results/practice', '#/results/marks', `#/marks/${mk.courseId}`, `#/exam/${ex}/grading`, '#/certs', '#/certs/courses', '#/admissions', '#/registry', '#/registry/terms', `#/term/${term}`, '#/messages', '#/settings', '#/', '#/students'], 'admin');
  console.log('BAD', bad); srv.close(); process.exit(bad ? 1 : 0);
})();
