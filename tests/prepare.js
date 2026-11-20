/* يجهّز نسختين من الموقع للاختبار: .tmp/demo (الوضع التجريبي، بلا Firebase) و .tmp/live (Firebase محاكى) */
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), tmp = path.join(__dirname, '.tmp');
fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp);
for (const d of ['demo', 'live']) {
  const out = path.join(tmp, d); fs.mkdirSync(out);
  for (const f of ['index.html', 'cp-7q4x9k.html', '404.html', 'css', 'js']) fs.cpSync(path.join(root, f), path.join(out, f), { recursive: true });
}
const cfg = path.join(tmp, 'demo', 'js', 'config.js');
fs.writeFileSync(cfg, fs.readFileSync(cfg, 'utf8').replace(/^const FIREBASE_CONFIG = \{/m, 'const FIREBASE_CONFIG = null; const FIREBASE_CONFIG_X = {'));
console.log('prepared');
