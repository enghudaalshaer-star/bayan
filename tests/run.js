const { JSDOM, VirtualConsole } = require('jsdom');
const path = require('path'), fs = require('fs');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const http = require('http');
let server, PORT;
function serve() { if (server) return Promise.resolve(); return new Promise(res => { server = http.createServer((q, r) => { const p = path.join(__dirname, '.tmp', 'demo', decodeURIComponent(q.url.split('?')[0].split('#')[0])); fs.readFile(p, (e, b) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': p.endsWith('.js') ? 'text/javascript' : p.endsWith('.css') ? 'text/css' : 'text/html; charset=utf-8' }); r.end(b); }); }).listen(0, () => { PORT = server.address().port; res(); }); }); }
async function open(page, ls = {}) {
  await serve();
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push('jsdomError: ' + (e.detail?.stack || e.message || e)));
  vc.on('error', (...a) => errors.push('console.error: ' + a.map(String).join(' ')));
  const dom = await JSDOM.fromURL(`http://localhost:${PORT}/${page}`, { runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      for (const [k, v] of Object.entries(ls)) w.localStorage.setItem(k, v);
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
      w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
      w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
      w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
      w.structuredClone = globalThis.structuredClone;
      Object.defineProperty(w, 'crypto', { value: globalThis.crypto });
      w.TextEncoder = TextEncoder; w.print = () => {};
      w.HTMLCanvasElement.prototype.getContext = () => null;
      w.addEventListener('error', e => errors.push('onerror: ' + (e.error?.stack || e.message)));
      w.addEventListener('unhandledrejection', e => errors.push('unhandled: ' + (e.reason?.stack || e.reason)));
    } });
  await sleep(1500);
  return { dom, w: dom.window, errors };
}
module.exports = { open, sleep };
if (require.main === module) (async () => {
  const { w, errors } = await open('index.html');
  await sleep(1500);
  const db = JSON.parse(w.localStorage.getItem('bayan_db_v1') || '{}');
  console.log(Object.fromEntries(Object.entries(db).map(([k, v]) => [k, Object.keys(v).length])));
  console.log('app text:', w.document.querySelector('#app').textContent.slice(0, 120).replace(/\s+/g, ' '));
  console.log('errors', errors);
  fs.writeFileSync(path.join(__dirname, '.tmp', 'seed.json'), JSON.stringify(db));
  w.close(); process.exit(0);
})();
