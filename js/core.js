'use strict';
/* بيان — النواة المشتركة: أدوات، أيقونات، طبقة البيانات، المصادقة، نوافذ، توجيه، تشغيل.
   يُحمَّل في index.html و admin.html. كل تطبيق يعرّف APP = { layout, routes, guard, afterLogout }. */
/* ================= أدوات عامة ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const LOC = 'ar-u-ca-gregory-nu-latn';
const fmtDate = t => t ? new Date(t).toLocaleDateString(LOC, { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
const fmtDT = t => t ? new Date(t).toLocaleString(LOC, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
/* ينظّف الرابط: يقبل كود التضمين <iframe>، ويضيف https:// إن نُسي، ويرفض غير http/https */
function normUrl(u) {
  u = String(u || '').trim();
  const fr = u.match(/<iframe[^>]+src\s*=\s*["']([^"']+)["']/i); if (fr) u = fr[1];
  u = u.replace(/&amp;/g, '&');
  if (/^\/\//.test(u)) u = 'https:' + u;
  if (!/^[a-z][\w+.-]*:/i.test(u) && /^[\w-]+(\.[\w-]+)+([/?#]|$)/.test(u)) u = 'https://' + u;
  return /^https?:\/\/[^\s]+$/i.test(u) ? u : '';
}
const safeUrl = normUrl;
const trim = (s, n) => { s = String(s || ''); return s.length > n ? s.slice(0, n).trim() + '…' : s; };
const firstName = n => String(n || '').split(' ')[0];
const go = p => { location.hash = '#' + p; };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const rnd4 = () => Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X');
async function sha(s) {
  try {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('bayan:' + s));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  } catch { let h = 0; for (const c of 'bayan:' + s) h = (h * 31 + c.charCodeAt(0)) | 0; return 'x' + h; }
}

const I = {
  video: '<path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  play: '<polygon points="7 4 19 12 7 20 7 4"/>',
  audio: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
  text: '<line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  quiz: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  up: '<polyline points="18 15 12 9 6 15"/>', down: '<polyline points="6 9 12 15 18 9"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
  sun: '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
  menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  next: '<polyline points="15 18 9 12 15 6"/>', prev: '<polyline points="9 18 15 12 9 6"/>',
  moonc: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/><path d="M19 3l.5 1.5L21 5l-1.5.5L19 7l-.5-1.5L17 5l1.5-.5z"/>',
  pen: '<path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
  heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>',
  mosque: '<path d="M4 21V12a8 8 0 0 1 16 0v9"/><path d="M2 21h20"/><path d="M12 4V1.5"/><path d="M10 21v-4a2 2 0 0 1 4 0v4"/>',
  star: '<rect x="6" y="6" width="12" height="12"/><rect x="6" y="6" width="12" height="12" transform="rotate(45 12 12)"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  print: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  key: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
  ban: '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>',
  mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  whatsapp: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  youtube: '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>',
  instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
  telegram: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
  xsoc: '<path d="M4 4l11.7 16H20L8.3 4z"/><path d="M4 20l6.8-6.8M13.2 10.8L20 4"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>'
};
const ic = (n, s = 20) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || I.book}</svg>`;
const logoMark = (s = 34) => `<svg width="${s}" height="${s}" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#0B3D3A"/><g fill="none" stroke="#C9A45C" stroke-width="2.2"><rect x="11" y="11" width="18" height="18"/><rect x="11" y="11" width="18" height="18" transform="rotate(45 20 20)"/></g><circle cx="20" cy="20" r="2.6" fill="#C9A45C"/></svg>`;

const THEMES = { teal: ['#0B3D3A', '#2A8A82'], brass: ['#7A5A22', '#C49A4E'], ink: ['#1B2433', '#3D4E69'], olive: ['#3F4C22', '#7B8A43'], clay: ['#6E3626', '#B0664A'], plum: ['#43283F', '#7D4E72'] };
const COURSE_ICONS = ['book', 'moonc', 'mosque', 'pen', 'heart', 'star', 'users', 'audio', 'text'];
const LEVELS = ['مبتدئ', 'متوسط', 'متقدم'];
const CATS = ['عقيدة', 'فقه', 'حديث', 'تفسير', 'سيرة', 'تجويد', 'قرآن وعلومه', 'لغة عربية', 'لغة إنجليزية', 'تزكية', 'أصول', 'مقاصد', 'تربية', 'فكر معاصر'];
const TYPE_LBL = { video: 'مرئي', audio: 'صوتي', pdf: 'ملف PDF', text: 'متن ونص' };
const TYPE_IC = { video: 'play', audio: 'audio', pdf: 'file', text: 'text' };
const DEFAULT_EXAM = () => ({ questions: [], passScore: 60, duration: 15, maxAttempts: 3, shuffle: true, reveal: 'mark', requireLessons: true });
/* ماذا يرى الطالب بعد التسليم: none = الدرجة فقط، mark = صح/خطأ لكل سؤال دون كشف الصحيحة، full = الإجابات الصحيحة كاملة، hidden = رسالة حفظ فقط بلا درجة */
const revealMode = ex => ex.reveal === 'hidden' ? 'hidden' : ex.reveal === true || ex.reveal === 'full' ? 'full' : ex.reveal === 'mark' || ex.reveal === undefined ? 'mark' : 'none';
const REVEAL_OPTS = [['none', 'درجته فقط'], ['mark', 'صح أو خطأ لكل سؤال، دون كشف الإجابة الصحيحة'], ['full', 'الإجابات الصحيحة كاملة'], ['hidden', 'لا شيء — رسالة «تم حفظ الاختبار بنجاح» فقط']];
const ABOUT_DEFAULT = "## من نحن\nأكاديمية {name} مؤسسة تعليمية شرعية غير ربحية، تُعنى بتعليم العلوم الإسلامية الوسطية، وتكوين طالبات وطلاب علم راسخين، وفق منهج علمي أصيل يجمع بين الفهم العميق، والتزكية الأخلاقية، والتمكين المعرفي المعاصر.\n\n## رؤيتنا\nأن تكون الأكاديمية مرجعاً متميّزاً في إعداد جيل متوازن من طلاب وطالبات العلم، يجمعون بين التأصيل الشرعي، والفهم المقاصدي، والوعي بالواقع.\n\n## رسالتنا\nنشر العلم الشرعي من مصادره الأصيلة، بأسلوب أكاديمي راقٍ، مع العناية بالتزكية، ومهارات البحث، وخدمة الدين والمجتمع.\n\n## أهدافنا\n1. تأصيل العلم الشرعي (العقيدة، الفقه، أصول الفقه، التفسير، الحديث...).\n2. غرس قيم الأخلاق والتزكية في نفوس المتعلمين.\n3. إعداد طلاب علم قادرين على الفهم والاجتهاد الوسطي.\n4. تفعيل دور المرأة والشباب في خدمة الإسلام بعلم راسخ وفكر ناضج.\n5. تعزيز الوعي الشرعي المعاصر في قضايا الأسرة، والمرأة، والمجتمع.\n\n## الهيئة التأسيسية\nد. ماهر شاكر، د. غالية السيد طلبية، د. أريج حلواني.";
const DEFAULTS = {
  name: 'بيان', nameEn: 'Bayan', tagline: 'أكاديمية للعلوم الشرعية',
  heroText: 'دراسة أكاديمية لسنتين في عشرين مادة شرعية من أمهات الكتب، وبرنامج لإجازات القرآن الكريم والحديث النبوي، وشهادة علمية موثّقة معتمدة من وزارة الأوقاف.',
  about: 'مؤسسة تعليمية شرعية غير ربحية، تُعنى بتعليم العلوم الإسلامية الوسطية وفق منهج علمي أصيل يجمع بين الفهم العميق والتزكية والتمكين المعرفي المعاصر.',
  /* الأكاديمية: نصوص صفحة «البرامج الدراسية» */
  acadIntro: 'مدة الدراسة سنتان من خلال منصة إلكترونية باللغتين العربية والإنكليزية، وتتضمن عشرين مادة موزّعة على أربعة فصول دراسية، في كل فصل خمس مواد.',
  acadAdmission: 'حاصل على شهادة الثانوية على الأقل.',
  ijazaIntro: 'برنامج لمنح الإجازات في القرآن الكريم والحديث النبوي وعلومه. اختر المادة لتعرف ما تتضمنه.',
  ijazaAdmission: 'أن يكون عمر المتقدم فوق عشر سنوات، وأن يكون متقناً للغة العربية.',
  accredit: 'شهادة علمية موثّقة ومعتمدة من وزارة الأوقاف',
  /* القبول: نافذة كل برنامج (نفس صيغة تسجيل الدورة) والدفعة الافتراضية للمقبولين */
  adm: { academy: { enrollMode: 'open' }, ijaza: { enrollMode: 'open' } }, admCohort: '',
  contact: '', allowRegister: true, adminUser: 'admin', adminHash: null,
  certTemplate: 'classic', certLangs: 'both', certDefault: '', /* certDefault = معرّف نوع الشهادة الافتراضي (certTypes) */
  /* صفحات «عن المنصة» و«تواصل معنا» و«الشروط» */
  aboutLong: ABOUT_DEFAULT, email: '', whatsapp: '', social: {}, terms: '', allowMessages: true
};

/* ================= التسجيل والمواعيد =================
   enrollMode: open (مفتوح دائماً، الافتراضي) | window (بين enrollStart و enrollEnd) | closed (مغلق، مع enrollNote اختياري)
   startsAt: بداية الدراسة (الدروس والاختبار مقفلة قبلها). القيم أرقام ms، و0 = غير محدد. */
const ENROLL_MODES = [['open', 'مفتوح دائماً'], ['window', 'خلال فترة محددة'], ['closed', 'مغلق حالياً']];
const toDateInput = t => { if (!t) return ''; const d = new Date(+t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const fromDateInput = (v, endOfDay) => { if (!v) return 0; const [y, m, d] = v.split('-').map(Number); return new Date(y, m - 1, d, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0).getTime(); };
function enrollState(c, now = Date.now()) {
  const m = c.enrollMode || 'open', s = +c.enrollStart || 0, e = +c.enrollEnd || 0;
  if (m === 'closed') return { open: false, state: 'closed', note: c.enrollNote || '' };
  if (m === 'window') {
    if (s && now < s) return { open: false, state: 'soon', opensAt: s, closesAt: e };
    if (e && now > e) return { open: false, state: 'ended', note: c.enrollNote || '' };
    return { open: true, state: 'open', closesAt: e };
  }
  return { open: true, state: 'always' };
}
const enrollLabel = st => ({ always: '', open: st.closesAt ? `التسجيل مفتوح حتى ${fmtDate(st.closesAt)}` : 'التسجيل مفتوح', soon: `يفتح التسجيل ${fmtDate(st.opensAt)}`, ended: 'انتهت فترة التسجيل', closed: 'التسجيل مغلق' }[st.state]);
const courseStarted = (c, now = Date.now()) => !+c.startsAt || now >= +c.startsAt;


/* ================= الأكاديمية: البرامج والخطة الدراسية =================
   لكل دورة: program ('academy' البرنامج الأكاديمي | 'ijaza' برنامج الإجازات | '' دورة عامة)،
   term (1..4 للبرنامج الأكاديمي: السنة = ceil(term/2))، order (رقم المادة في الفصل)، book، author، hours. */
const PROGRAMS = [['academy', 'البرنامج الأكاديمي'], ['ijaza', 'برنامج الإجازات'], ['', 'دورات عامة']];
const programName = k => (PROGRAMS.find(p => p[0] === (k || '')) || PROGRAMS[2])[1];
const YEAR_NAMES = ['', 'السنة الأولى', 'السنة الثانية'];
const TERM_NAMES = ['', 'الفصل الأول', 'الفصل الثاني', 'الفصل الثالث', 'الفصل الرابع'];
const termYear = t => Math.ceil((+t || 0) / 2);
const termLabel = t => +t >= 1 && +t <= 4 ? `${YEAR_NAMES[termYear(t)]} — ${TERM_NAMES[+t]}` : '';
const ACADEMY_PLAN = [
  [1, 'اللغة العربية (1)', 'Arabic Language (1)', 'جامع الدروس العربية', 'مصطفى الغلاييني', 2, 'لغة عربية', 'pen'],
  [1, 'اللغة الإنكليزية (1)', 'English Language (1)', 'English Grammar in Use', 'Raymond Murphy', 2, 'لغة إنجليزية', 'text'],
  [1, 'القرآن الكريم (1)', 'The Holy Quran (1)', 'هداية القاري إلى تجويد كلام الباري', 'عبد الفتاح المرصفي', 2, 'تجويد', 'moonc'],
  [1, 'فقه العبادات', 'Jurisprudence of Worship', 'الفقه المنهجي', 'مصطفى الخن، مصطفى البغا، علي الشربجي', 4, 'فقه', 'mosque'],
  [1, 'مصطلح الحديث', 'Hadith Terminology', 'منهج النقد في علوم الحديث', 'نور الدين عتر', 2, 'حديث', 'book'],
  [2, 'مبادئ العقيدة الإسلامية', 'Principles of Islamic Creed', 'تحفة المريد شرح جوهرة التوحيد', 'إبراهيم الباجوري', 4, 'عقيدة', 'star'],
  [2, 'تاريخ التشريع الإسلامي', 'History of Islamic Legislation', 'تاريخ التشريع الإسلامي', 'مناع القطان', 2, 'فقه', 'book'],
  [2, 'السيرة النبوية والتزكية', 'Prophetic Biography and Purification', 'الرحيق المختوم', 'صفي الرحمن المباركفوري', 4, 'سيرة', 'heart'],
  [2, 'المنهج التربوي ومهارات التواصل', 'Educational Method and Communication Skills', 'تربية الأولاد في الإسلام', 'عبد الله ناصح علوان', 2, 'تربية', 'users'],
  [2, 'مقاصد الشريعة', 'Objectives of Sharia', 'مقاصد الشريعة الإسلامية', 'محمد الطاهر بن عاشور', 2, 'مقاصد', 'star'],
  [3, 'فقه المعاملات والمعاملات المالية المعاصرة', 'Transactions and Contemporary Financial Dealings', 'المعاملات المالية المعاصرة في الفقه الإسلامي', 'د. محمد عثمان شبير', 4, 'فقه', 'mosque'],
  [3, 'أصول الفقه', 'Principles of Jurisprudence', 'أصول الفقه الإسلامي', 'د. وهبة الزحيلي', 4, 'أصول', 'book'],
  [3, 'فقه السيرة', 'Jurisprudence of the Prophetic Biography', 'فقه السيرة النبوية', 'د. محمد سعيد رمضان البوطي', 4, 'سيرة', 'heart'],
  [3, 'المدخل الفقهي', 'Introduction to Islamic Jurisprudence', 'المدخل الفقهي العام', 'مصطفى الزرقا', 2, 'فقه', 'book'],
  [3, 'القرآن الكريم (2)', 'The Holy Quran (2)', 'البرهان في تجويد القرآن', 'محمد الصادق قمحاوي', '', 'تجويد', 'moonc'],
  [4, 'طرائق تدريس التربية الإسلامية', 'Methods of Teaching Islamic Education', 'أصول التربية الإسلامية وأساليبها', 'عبد الرحمن النحلاوي', 2, 'تربية', 'users'],
  [4, 'القرآن الكريم وعلومه (2)', 'Quranic Sciences (2)', 'مناهل العرفان في علوم القرآن', 'محمد عبد العظيم الزرقاني', 2, 'قرآن وعلومه', 'moonc'],
  [4, 'الحديث التحليلي (2)', 'Analytical Hadith (2)', 'جامع العلوم والحكم', 'ابن رجب الحنبلي', 4, 'حديث', 'book'],
  [4, 'التفسير التحليلي (2)', 'Analytical Exegesis (2)', 'التفسير المنير', 'د. وهبة الزحيلي', 4, 'تفسير', 'text'],
  [4, 'قضايا فكرية معاصرة', 'Contemporary Intellectual Issues', 'مذاهب فكرية معاصرة', 'محمد قطب', 4, 'فكر معاصر', 'pen']
];
/* مواد برنامج الإجازات: تُعرض بطاقات في صفحة البرامج، وكل بطاقة تفتح صفحة تشرح المادة (#/ijaza/:key) */
const IJAZA_PLAN = [
  { key: 'quran', title: 'القرآن الكريم', titleEn: 'The Holy Quran', book: 'إجازة ضبطاً وحفظاً', category: 'تجويد', icon: 'moonc',
    description: 'منح إجازة في القرآن الكريم ضبطاً وحفظاً.',
    items: ['الضبط: إتقان تلاوة القرآن الكريم وأحكام تجويده.', 'الحفظ: حفظ القرآن الكريم وتثبيته.'] },
  { key: 'hadith', title: 'الحديث النبوي وعلومه', titleEn: 'Prophetic Hadith and its Sciences', book: 'رياض الصالحين، الصحيحان، معالم السنة النبوية', category: 'حديث', icon: 'book',
    description: 'دراسة الحديث النبوي الشريف وعلومه من كتب السنة المعتمدة.',
    items: ['رياض الصالحين', 'صحيح البخاري', 'صحيح مسلم', 'معالم السنة النبوية', 'وغيرها من كتب السنة النبوية'] }
];
const TERM_THEMES = ['', 'teal', 'brass', 'olive', 'plum'];
/* المواد كدورات (مسودات بلا دروس) — يضيفها المشرف من «الدورات ← استيراد الخطة الدراسية» */
function academyCourses() {
  const base = { level: 'مبتدئ', instructor: 'هيئة التدريس', published: false, lessons: [], exam: DEFAULT_EXAM(), enrollMode: 'open' };
  const now = Date.now(), order = {};
  const a = ACADEMY_PLAN.map(([term, title, titleEn, book, author, hours, category, icon], i) => ({
    ...base, title, titleEn, book, author, hours, category, icon, program: 'academy', term, order: (order[term] = (order[term] || 0) + 1), theme: TERM_THEMES[term],
    summary: `${termLabel(term)} — كتاب «${book}» لـ${author}.`, description: '', createdAt: now - i * 1000
  }));
  const b = IJAZA_PLAN.map(({ key, title, titleEn, book, category, icon, description, items }, i) => ({
    ...base, title, titleEn, book, author: '', hours: '', category, icon, program: 'ijaza', ijazaKey: key, term: 0, order: i + 1, theme: 'clay', summary: book,
    description: description + '\n\n' + items.map(x => '- ' + x).join('\n'), createdAt: now - (30 + i) * 1000
  }));
  return [...a, ...b];
}
/* يرتّب المواد حسب الفصل ثم رقم المادة */
const planSort = (a, b) => (+a.term || 9) - (+b.term || 9) || (+a.order || 99) - (+b.order || 99) || (b.createdAt || 0) - (a.createdAt || 0);
/* ================= القبول والقيد (المرحلة الأولى من النظام الجامعي) =================
   applications/{uid}_{program}: طلب الالتحاق — يكتبه الطالب (APP_KEYS فقط) ويقرّر فيه المشرف.
   appFiles/{uid}_{program}: صورة المؤهل الدراسي (منفصلة لأنها كبيرة).
   records/{uid}_{program}: القيد في البرنامج بعد القبول — studentNo, cohort, level (1..4 للأكاديمي), track (للإجازات), status.
   terms/{id}: الفصول الدراسية الزمنية للبرنامج الأكاديمي، ونافذة تسجيلها enrollMode/enrollStart/enrollEnd (تُقرأ بـ enrollState).
   regs/{uid}_{termId}: تسجيل الطالب في فصل — ينشئ تسجيلات مواد مستواه.
   counters/students: تسلسل الأرقام الجامعية لكل سنة وبرنامج. */
const ADM_PROGS = ['academy', 'ijaza'];
const isAdmProg = p => ADM_PROGS.includes(p || '');
const APP_KEYS = ['uid', 'program', 'track', 'userName', 'username', 'name', 'nameEn', 'birthDate', 'gender', 'nationality', 'country', 'city', 'phone', 'email', 'qual', 'qualSpec', 'qualYear', 'qualFrom', 'arabic', 'quranAmt', 'priorIjaza', 'motivation', 'heard', 'pledge', 'hasFile', 'status', 'submittedAt', 'updatedAt'];
const APP_ST = { submitted: ['بانتظار المراجعة', 'mut'], review: ['قيد المراجعة', 'warn'], incomplete: ['مطلوب استكمال', 'warn'], waitlist: ['قائمة الانتظار', 'mut'], accepted: ['مقبول', 'ok'], rejected: ['غير مقبول', 'no'], withdrawn: ['مسحوب', 'mut'] };
const REC_ST = { active: ['منتظم', 'ok'], deferred: ['مؤجّل', 'mut'], suspended: ['موقوف', 'no'], withdrawn: ['منسحب', 'mut'], completed: ['أنهى المواد', 'ok'] };
const stPill = (map, k) => `<span class="pill ${(map[k] || [])[1] || 'mut'}">${esc((map[k] || [k])[0])}</span>`;
const QUALS = [['below', 'أقل من الثانوية'], ['secondary', 'الثانوية العامة'], ['diploma', 'دبلوم'], ['bachelor', 'بكالوريوس'], ['master', 'ماجستير'], ['phd', 'دكتوراه']];
const ARABIC_LV = [['fluent', 'متقن (لغة أم أو ما يعادلها)'], ['good', 'جيد'], ['fair', 'متوسط']];
const GENDERS = [['m', 'ذكر'], ['f', 'أنثى']];
const HEARD = ['وسائل التواصل الاجتماعي', 'صديق أو قريب', 'مسجد أو مدرسة أو جمعية', 'بحث في الإنترنت', 'أخرى'];
/* العدد مع «مادة» بصيغته العربية */
const nMawad = n => n === 1 ? 'مادة واحدة' : n === 2 ? 'مادتان' : n >= 3 && n <= 10 ? `${n} مواد` : `${n} مادة`;
const optName = (list, k) => (list.find(x => x[0] === k) || [, ''])[1];
const trackName = k => (IJAZA_PLAN.find(x => x.key === k) || {}).title || '';
const ageOf = (birth, now = Date.now()) => { if (!birth) return null; const b = new Date(birth), n = new Date(now); let a = n.getFullYear() - b.getFullYear(); if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--; return a; };
/* نافذة القبول لكل برنامج في الإعدادات: settings.adm[program] = {enrollMode, enrollStart, enrollEnd, enrollNote} */
const admState = p => enrollState((S.settings.adm || {})[p] || {});
const admLabel = st => ({ always: 'القبول مفتوح', open: st.closesAt ? `القبول مفتوح حتى ${fmtDate(st.closesAt)}` : 'القبول مفتوح', soon: `يفتح القبول ${fmtDate(st.opensAt)}`, ended: 'انتهت فترة القبول', closed: 'القبول مغلق حالياً' }[st.state]);
/* الشروط غير المستوفاة في طلب: [شديد (يمنع التقديم)، ملاحظة للمراجِع] */
function admissionIssues(p, a) {
  const hard = [], soft = [], age = ageOf(a.birthDate);
  if (p === 'academy' && a.qual === 'below') hard.push('المؤهل أقل من الثانوية، وشرط القبول: ' + S.settings.acadAdmission);
  if (p === 'ijaza') {
    if (age != null && age <= 10) hard.push('العمر ' + age + ' سنوات، وشرط القبول أن يكون فوق عشر سنوات');
    if (a.arabic && a.arabic !== 'fluent') soft.push('مستوى العربية: ' + optName(ARABIC_LV, a.arabic) + ' — والشرط الإتقان');
  }
  if (p === 'academy' && !a.hasFile) soft.push('لم تُرفع صورة المؤهل');
  return { hard, soft };
}
/* المستوى الحالي للطالب في برنامجه */
const recLevel = r => r.program === 'academy' ? termLabel(r.level) || '—' : trackName(r.track) || programName(r.program);
/* هل يحق لصاحب القيد التسجيل في هذه المادة؟ (نفس منطق القاعدة admitted في firestore.rules) */
const eligibleFor = (c, r) => !!r && r.status === 'active' && r.program === c.program && (c.program === 'academy' ? +c.term === +r.level : (r.track || '') === (c.ijazaKey || ''));
/* مواد مستوى معيّن في البرنامج الأكاديمي (المنشورة فقط) */
const levelCourses = (courses, level) => courses.filter(c => c.program === 'academy' && +c.term === +level && c.published).sort(planSort);
/* known: مجموعة معرّفات تسجيلات محمّلة مسبقاً (للتسجيل الجماعي من الإدارة) بدل قراءة كل تسجيل.
   termId: الفصل الذي تُدرس فيه المادة — تُفتح دروسها ببدايته واختبارها في فترة امتحاناته. */
async function enrollIn(r, c, known, termId) {
  const id = `${r.uid}_${c.id}`;
  if (known ? known.has(id) : await safeGet('enrollments', id)) { if (termId) await DB.update('enrollments', id, { termId }).catch(() => {}); return false; }
  await DB.set('enrollments', id, { uid: r.uid, courseId: c.id, userName: r.name, courseTitle: c.title, completed: [], enrolledAt: Date.now(), termId: termId || '', by: 'record' });
  known?.add(id); return true;
}
/* قيد الطالب في فصل: مستند regs ثم تسجيل مواد مستواه تلقائياً. لا تسجيل ذاتي: by = admin | accept | promote */
async function registerInTerm(r, term, courses, by = 'admin', known) {
  const list = levelCourses(courses, r.level), id = `${r.uid}_${term.id}`;
  const reg = { uid: r.uid, termId: term.id, termName: term.name, program: 'academy', level: +r.level, cohort: r.cohort || '', name: r.name, studentNo: r.studentNo || '', courseIds: list.map(c => c.id), at: Date.now(), by };
  await DB.set('regs', id, reg);
  for (const c of list) await enrollIn(r, c, known, term.id);
  return { id, ...reg };
}

/* ================= التقويم الأكاديمي =================
   terms/{id}: name, startsAt, endsAt (مدة الفصل)، examStart, examEnd (فترة الامتحانات النهائية)،
   examLock (الاختبار النهائي لمواد الفصل يُفتح في فترة الامتحانات فقط)، closedAt (أُنهي الفصل ورُفّع طلابه)،
   events[]: {id, kind, title, from, to?, courseId?} — امتحان مادة بعينها، عطلة، موعد… */
const EVENT_KINDS = [['exam', 'امتحان', 'quiz'], ['holiday', 'عطلة', 'sun'], ['deadline', 'موعد نهائي', 'clock'], ['other', 'حدث', 'info']];
const eventKind = k => EVENT_KINDS.find(x => x[0] === k) || EVENT_KINDS[3];
const TERM_PH = { upcoming: ['لم يبدأ', 'mut'], running: ['جارٍ', 'ok'], exams: ['فترة الامتحانات', 'warn'], ended: ['انتهى — بانتظار الإنهاء', 'warn'], closed: ['منتهٍ', 'mut'] };
function termPhaseKey(t, now = Date.now()) {
  if (t.closedAt) return 'closed';
  if (+t.startsAt && now < +t.startsAt) return 'upcoming';
  if (+t.endsAt && now > +t.endsAt) return 'ended';
  if (+t.examStart && now >= +t.examStart && (!+t.examEnd || now <= +t.examEnd)) return 'exams';
  return 'running';
}
const termPhasePill = t => stPill(TERM_PH, termPhaseKey(t));
const termSort = (a, b) => (+a.startsAt || 0) - (+b.startsAt || 0);
/* الفصول الصالحة لقيد الطلاب الآن: لم تُنهَ ولم تنتهِ مدتها، بالترتيب الزمني */
const openTerms = (terms, now = Date.now()) => terms.filter(t => !t.closedAt && (!+t.endsAt || now <= +t.endsAt)).sort(termSort);
/* الفصل التالي لفصل معيّن (يُرفَّع إليه الطلاب عند إنهائه) */
const nextTermOf = (terms, t) => terms.filter(x => x.id !== t.id && !x.closedAt && (+x.startsAt || 0) > (+t.startsAt || 0)).sort(termSort)[0];
const dateRange = (a, b) => !+a ? '—' : +b && toDateInput(a) !== toDateInput(b) ? `${fmtDate(a)} — ${fmtDate(b)}` : fmtDate(a);
/* مواعيد الفصل مرتّبة زمنياً للعرض: بداية، أحداث، امتحانات، نهاية */
function termEvents(t, courses = []) {
  const cm = Object.fromEntries(courses.map(c => [c.id, c])), out = [];
  if (+t.startsAt) out.push({ kind: 'start', ic: 'play', title: 'بداية الدراسة', from: +t.startsAt });
  for (const e of t.events || []) { const k = eventKind(e.kind); out.push({ ...e, ic: k[2], title: e.title || k[1], course: cm[e.courseId]?.title || '' }); }
  if (+t.examStart) out.push({ kind: 'exams', ic: 'quiz', title: 'الامتحانات النهائية', from: +t.examStart, to: +t.examEnd });
  if (+t.endsAt) out.push({ kind: 'end', ic: 'check', title: 'نهاية الفصل', from: +t.endsAt });
  return out.sort((a, b) => a.from - b.from);
}
/* نافذة الاختبار النهائي لمادة في فصلها: امتحان المادة المحدد في الأحداث، وإلا فترة امتحانات الفصل */
function examWindow(t, courseId) {
  if (!t) return null;
  const e = (t.events || []).find(x => x.kind === 'exam' && x.courseId === courseId);
  if (e) return { from: +e.from, to: +e.to || (+e.from + 86399000), own: true };
  if (+t.examStart) return { from: +t.examStart, to: +t.examEnd || (+t.examStart + 86399000) };
  return null;
}
/* ================= الامتحانات الرسمية =================
   exams/{id}       بيانات الامتحان (عامة): النوع، الموعد، المدة، الوزن، عدد أسئلة الورقة nq، نشر النتائج resultsOut
   examPapers/{id}  بنك الأسئلة بلا إجابات — يقرؤه الطالب المسجّل في موعد الامتحان فقط (القواعد تقارن بوقت السيرفر)
   examKeys/{id}    الإجابات الصحيحة ونماذج الإجابة — المشرف فقط
   sittings/{examId}_{uid}  جلسة الطالب: الأسئلة المسحوبة، إجاباته، وقت البدء والتسليم من السيرفر
   grades/{examId}_{uid}    الدرجة — يكتبها المشرف (أو Cloud Function)، ويراها الطالب بعد نشر النتائج
   examAccess/{examId}_{uid} من يحق له الامتحان الإكمالي */
const EXAM_KINDS = { quiz: ['مذاكرة', 'pen', 'mut'], final: ['امتحان نهائي', 'award', 'ok'], makeup: ['امتحان إكمالي', 'key', 'warn'], oral: ['تقييم شفهي', 'audio', 'ok'] };
const examKindName = k => (EXAM_KINDS[k] || EXAM_KINDS.quiz)[0];
const kindPill = k => `<span class="pill ${(EXAM_KINDS[k] || EXAM_KINDS.quiz)[2]}">${examKindName(k)}</span>`;
const Q_TYPES = { mcq: 'اختيار من متعدد', tf: 'صح أو خطأ', short: 'إجابة قصيرة', essay: 'سؤال مقالي' };
const Q_AUTO = t => t === 'mcq' || t === 'tf';
const OPT_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
/* التقييم الشفهي للإجازات: التقدير يسجّله الشيخ، والدرجة اختيارية (وإلا تُحتسب الدرجة الاسمية للتقدير) */
const ORAL_RATES = [['excellent', 'ممتاز', 95], ['vgood', 'جيد جداً', 85], ['good', 'جيد', 75], ['pass', 'مقبول', 65], ['fail', 'لم يجتز', 0]];
const oralRate = k => ORAL_RATES.find(r => r[0] === k);
const EXAM_GRACE = 90e3; /* مهلة الشبكة بعد انتهاء الوقت — يجب أن تطابق 90 ثانية في قواعد Firestore */
const EXAM_PH = { soon: ['لم يُفتح بعد', 'mut'], open: ['مفتوح الآن', 'ok'], closed: ['انتهى موعده', 'mut'] };
function examPhase(e, now = Date.now()) {
  if (+e.opensAt && now < +e.opensAt) return 'soon';
  if (+e.closesAt && now > +e.closesAt) return 'closed';
  return 'open';
}
const examWhen = e => +e.opensAt ? (+e.closesAt ? `${fmtDT(e.opensAt)} — ${toDateInput(e.opensAt) === toDateInput(e.closesAt) ? fmtTime(e.closesAt) : fmtDT(e.closesAt)}` : `من ${fmtDT(e.opensAt)}`) : +e.closesAt ? `حتى ${fmtDT(e.closesAt)}` : 'مفتوح دون موعد';
const DEFAULT_OFFEXAM = kind => ({ kind, title: examKindName(kind), note: '', opensAt: 0, closesAt: 0, duration: kind === 'oral' ? 0 : kind === 'quiz' ? 30 : 90, passScore: 60, weight: { quiz: 40, final: 60, makeup: 0, oral: 100 }[kind] ?? 0,
  shuffle: true, shuffleOpts: true, drawOn: false, draw: { mcq: 0, tf: 0, short: 0, essay: 0 }, nq: 0, counts: {}, examiner: '', capPass: false, makeupOf: '', published: false, resultsOut: false });
/* وقت السيرفر: Firestore يضع request.time والقواعد تتحقق منه؛ في الوضع التجريبي وقت الجهاز */
const NOW_TS = () => S.live ? firebase.firestore.FieldValue.serverTimestamp() : Date.now();
const tsMs = v => v == null ? 0 : typeof v === 'number' ? v : typeof v.toMillis === 'function' ? v.toMillis() : +v || 0;
const shuffleArr = (a, rnd = Math.random) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
/* مولّد ثابت من نص (لترتيب الخيارات نفسه عند استئناف الجلسة) */
const seeded = s => { let h = 2166136261; for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296; };
const typeCounts = qs => Object.fromEntries(Object.keys(Q_TYPES).map(t => [t, qs.filter(q => q.type === t).length]));
/* عدد أسئلة الورقة: السحب العشوائي بعدد لكل نوع، وإلا كل البنك */
const paperCount = (e, qs) => e.drawOn ? Object.keys(Q_TYPES).reduce((n, t) => n + Math.min(Math.max(0, +(e.draw || {})[t] || 0), qs.filter(q => q.type === t).length), 0) : qs.length;
function drawPaper(e, qs) {
  let out = e.drawOn ? Object.keys(Q_TYPES).flatMap(t => shuffleArr(qs.filter(q => q.type === t)).slice(0, Math.max(0, +(e.draw || {})[t] || 0))) : [...qs];
  if (e.shuffle) out = shuffleArr(out); else { const ids = new Set(out.map(q => q.id)); out = qs.filter(q => ids.has(q.id)); }
  return out;
}
/* تطبيع العربية لمقارنة الإجابات القصيرة: حذف التشكيل والتطويل وتوحيد الهمزات والتاء المربوطة والألف المقصورة */
const normAr = s => String(s ?? '').replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/^ال(?=\S{3,})/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().toLowerCase();
/* تصحيح سؤال واحد: { pts: الدرجة أو null إن احتاج تصحيحاً يدوياً, review: يُعرض على المصحّح } */
function autoMark(q, k, a) {
  const max = +q.pts || 1;
  if (q.type === 'essay') return { pts: a == null || String(a).trim() === '' ? 0 : null, review: a != null && String(a).trim() !== '' };
  if (a == null || a === '') return { pts: 0 };
  if (Q_AUTO(q.type)) return { pts: k && +a === +k.a ? max : 0 };
  const ok = (k?.acc || []).some(x => normAr(x) && normAr(x) === normAr(a));
  return { pts: ok ? max : 0, review: !ok };
}
/* تصحيح جلسة كاملة مع الإبقاء على درجات المصحّح اليدوية (manual) وملاحظاته (notes) */
function gradeSitting(s, qs, keys, prev = {}) {
  const qm = Object.fromEntries(qs.map(q => [q.id, q])), manual = { ...(prev.manual || {}) }, notes = { ...(prev.notes || {}) }, rows = [], review = [];
  let points = 0, total = 0, pending = 0;
  for (const id of s.qids || []) {
    const q = qm[id]; if (!q) continue;
    const max = +q.pts || 1, m = autoMark(q, (keys || {})[id], (s.answers || {})[id]);
    const v = manual[id] != null ? Math.min(max, Math.max(0, +manual[id])) : m.pts;
    total += max; if (v == null) pending++; else points += v;
    if (m.review && manual[id] == null) review.push(id);
    rows.push({ id, type: q.type, max, got: v, note: notes[id] || '' });
  }
  const score = total ? Math.round(points / total * 1000) / 10 : 0;
  return { points, total, score, pending, review, rows, manual, notes };
}
/* آخر لحظة يُقبل فيها التسليم: بدء الطالب + المدة، ولا تتجاوز إغلاق الامتحان */
const sitDeadline = (e, s) => { const st = tsMs(s.startedAt); let d = Infinity; if (+e.duration) d = st + e.duration * 6e4; if (+e.closesAt) d = Math.min(d, +e.closesAt); return d; };
const examSort = (a, b) => (+a.opensAt || 9e15) - (+b.opensAt || 9e15) || ['quiz', 'final', 'makeup', 'oral'].indexOf(a.kind) - ['quiz', 'final', 'makeup', 'oral'].indexOf(b.kind);
/* النتيجة النهائية للمادة: مجموع موزون للمذاكرات والنهائي (أو الإكمالي بدلاً منه) والشفهي */
function courseTotal(exams, gradeOf, pass = 60) {
  const fin = exams.find(e => e.kind === 'final'), mk = exams.find(e => e.kind === 'makeup');
  const val = e => { const g = gradeOf(e); return g && !g.pending ? +g.score || 0 : null; };
  let main = fin ? val(fin) : null, viaMakeup = false;
  if (mk) { const g = gradeOf(mk); if (g && !g.pending) { let v = +g.score || 0; if (mk.capPass) v = Math.min(v, +mk.passScore || pass); if (main == null || v > main) { main = v; viaMakeup = true; } } }
  const parts = exams.filter(e => e.kind === 'quiz' || e.kind === 'oral').map(e => [e, val(e)]);
  if (fin) parts.push([fin, main]);
  const wSum = parts.reduce((a, [e]) => a + (+e.weight || 0), 0);
  if (!parts.length) return null;
  const missing = parts.some(([, v]) => v == null);
  const total = wSum ? parts.reduce((a, [e, v]) => a + (+e.weight || 0) * (v || 0), 0) / wSum : (main ?? parts[0][1] ?? 0);
  const t = Math.round(total * 10) / 10;
  return { total: t, passed: !missing && t >= pass, missing, viaMakeup };
}
/* الرقم الجامعي: سنتان من السنة + 1 أكاديمي / 2 إجازات + تسلسل من 4 أرقام، مثل 2610007 (للمشرف فقط) */
async function nextStudentNo(p) {
  const yy = String(new Date().getFullYear()).slice(2), k = `${yy}_${p}`;
  const cnt = (await safeGet('counters', 'students')) || {}, n = (+cnt[k] || 0) + 1;
  await DB.update('counters', 'students', { [k]: n });
  return `${yy}${p === 'academy' ? 1 : 2}${String(n).padStart(4, '0')}`;
}
/* ضغط صورة إلى JPEG بحجم يناسب مستند Firestore */
async function compressImage(file, maxSide = 1600, limit = 900000) {
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error('ارفع صورة بصيغة JPG أو PNG أو WEBP');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('تعذّرت قراءة الصورة')); i.src = url; });
    let s = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight)), q = .85;
    for (let k = 0; k < 10; k++) {
      const cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * s); cv.height = Math.round(img.naturalHeight * s);
      const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height); x.drawImage(img, 0, 0, cv.width, cv.height);
      const out = cv.toDataURL('image/jpeg', q); if (out.length < limit) return out;
      if (q > .55) q -= .1; else s *= .8;
    }
    throw new Error('الصورة كبيرة جداً — صوّرها بدقة أقل');
  } finally { URL.revokeObjectURL(url); }
}
const openDataUrl = async d => { const b = await (await fetch(d)).blob(); const u = URL.createObjectURL(b); window.open(u, '_blank', 'noopener'); setTimeout(() => URL.revokeObjectURL(u), 60000); };
/* ================= اللقاءات المباشرة (الدورات الأونلاين) =================
   في الدورة (عام للزوّار): online, livePlatform, liveSchedule (نص المواعيد).
   في courseLive/{courseId} (للطلاب المسجّلين والمشرف فقط حسب القواعد):
   url (الرابط الثابت), meetingId, passcode, note, sessions[]: {id, title, at(ms), dur(دقائق), url? (رابط خاص بهذا اللقاء), rec? (رابط التسجيل)} */
const MEET_PLATFORMS = { zoom: ['Zoom', '#2D8CFF'], meet: ['Google Meet', '#00897B'], teams: ['Microsoft Teams', '#5B5FC7'], other: ['رابط اللقاء', '#1E6F6A'] };
const LIVE_EARLY = 15 * 6e4; /* يصبح اللقاء «جارياً» قبل موعده بربع ساعة ليدخل الطلاب مبكراً */
function meetInfo(raw) {
  const url = normUrl(raw); if (!url) return null;
  let u; try { u = new URL(url); } catch { return null; }
  const h = u.hostname.toLowerCase();
  const p = /(^|\.)zoom(gov)?\.(us|com)$/.test(h) ? 'zoom' : h === 'meet.google.com' ? 'meet'
    : /(^|\.)teams\.(microsoft|live)\.com$/.test(h) || /(^|\.)teams\.cloud\.microsoft$/.test(h) ? 'teams' : 'other';
  const out = { url, p, label: MEET_PLATFORMS[p][0], color: MEET_PLATFORMS[p][1] };
  if (p === 'zoom') { const m = u.pathname.match(/\/(?:j|w|s|wc(?:\/join)?)\/(\d{9,11})/); if (m) { const d = m[1]; out.id = d.length === 11 ? `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7)}` : `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`; } out.hasPwd = u.searchParams.has('pwd'); }
  if (p === 'meet') { const m = u.pathname.match(/^\/([a-z]{3}-[a-z]{4}-[a-z]{3})/i); if (m) out.id = m[1]; }
  return out;
}
const sessEnd = s => +s.at + (+s.dur || 60) * 6e4;
const sessUrl = (lv, s) => normUrl(s?.url) || normUrl(lv?.url);
function liveState(lv, now = Date.now()) {
  const ss = [...(lv?.sessions || [])].filter(s => +s.at).sort((a, b) => a.at - b.at);
  const live = ss.find(s => now >= s.at - LIVE_EARLY && now < sessEnd(s));
  const upcoming = ss.filter(s => sessEnd(s) > now);
  return { ss, live, next: upcoming.find(s => s !== live), upcoming, past: ss.filter(s => sessEnd(s) <= now).reverse() };
}
const toDTInput = t => t ? `${toDateInput(t)}T${String(new Date(+t).getHours()).padStart(2, '0')}:${String(new Date(+t).getMinutes()).padStart(2, '0')}` : '';
const fromDTInput = v => { if (!v) return 0; const [d, tm = '0:0'] = v.split('T'), [y, m, dd] = d.split('-').map(Number), [hh, mm] = tm.split(':').map(Number); return new Date(y, m - 1, dd, hh, mm).getTime(); };
const fmtTime = t => new Date(t).toLocaleTimeString(LOC, { hour: '2-digit', minute: '2-digit' });
const fmtSess = s => `${new Date(s.at).toLocaleDateString(LOC, { weekday: 'long', day: 'numeric', month: 'long' })} — ${fmtTime(s.at)}`;

/* ================= التواصل ================= */
const SOCIALS = [['facebook', 'فيسبوك'], ['youtube', 'يوتيوب'], ['telegram', 'تيليجرام'], ['instagram', 'إنستغرام'], ['xsoc', 'إكس']];
const MSG_TOPICS = ['استفسار عام', 'التسجيل في دورة', 'مشكلة تقنية', 'الشهادات', 'اقتراح'];
const waNum = s => String(s || '').replace(/\D/g, '').replace(/^00/, '');
const waLink = (n, text = '') => `https://wa.me/${waNum(n)}${text ? '?text=' + encodeURIComponent(text) : ''}`;
/* نص طويل بسيط: فقرات تفصلها سطور فارغة، والسطر الذي يبدأ بـ «## » عنوان فرعي */
/* السطر الذي يبدأ بـ «- » عنصر قائمة، و«1. » عنصر قائمة مرقّمة، و{name} يُستبدل باسم المنصة */
const richText = t => String(t || '').replace(/\{name\}/g, S.settings.name || '').trim().split(/\n\s*\n/).map(block => {
  let out = '', buf = [], list = null, items = [];
  const flush = () => { if (buf.length) out += `<p>${buf.map(esc).join('<br>')}</p>`; buf = []; };
  const flushL = () => { if (items.length) out += `<${list}>${items.map(x => `<li>${esc(x)}</li>`).join('')}</${list}>`; items = []; list = null; };
  for (const raw of block.split('\n')) {
    const l = raw.trim(), ul = /^[-•]\s+/.test(l), ol = /^\d+[.)]\s+/.test(l);
    if (/^##\s+/.test(l)) { flush(); flushL(); out += `<h2>${esc(l.replace(/^##\s+/, ''))}</h2>`; }
    else if (ul || ol) { flush(); const k = ul ? 'ul' : 'ol'; if (list && list !== k) flushL(); list = k; items.push(l.replace(/^([-•]|\d+[.)])\s+/, '')); }
    else if (l) { flushL(); buf.push(l); }
  }
  flush(); flushL(); return out;
}).join('');

/* ================= الحالة ================= */
const S = { user: null, settings: { ...DEFAULTS }, cleanups: [], token: 0, live: !!FIREBASE_CONFIG, scope: 'site' };
let DB, Auth, fdb, fauth;

/* ================= طبقة البيانات: المتصفح ================= */
const Local = {
  k: 'bayan_db_v1',
  load() { try { return JSON.parse(localStorage.getItem(this.k)) || {}; } catch { return {}; } },
  save(d) { try { localStorage.setItem(this.k, JSON.stringify(d)); } catch (e) { toast('تعذّر الحفظ في المتصفح — المساحة ممتلئة', 'err'); throw e; } },
  async get(c, id) { const d = this.load(); return d[c] && d[c][id] ? { id, ...d[c][id] } : null; },
  async list(c, f) {
    const d = this.load(); let a = Object.entries(d[c] || {}).map(([id, v]) => ({ id, ...v }));
    if (f) a = a.filter(x => Object.entries(f).every(([k, v]) => x[k] === v)); return a;
  },
  async set(c, id, v) { const d = this.load(); d[c] = d[c] || {}; const { id: _, ...r } = v; d[c][id] = r; this.save(d); return id; },
  async update(c, id, v) { const d = this.load(); d[c] = d[c] || {}; d[c][id] = { ...(d[c][id] || {}), ...v }; this.save(d); },
  async del(c, id) { const d = this.load(); if (d[c]) delete d[c][id]; this.save(d); }
};
/* ================= طبقة البيانات: Firebase ================= */
const Remote = {
  async get(c, id) { const s = await fdb.collection(c).doc(id).get(); return s.exists ? { id: s.id, ...s.data() } : null; },
  async list(c, f) {
    let q = fdb.collection(c); if (f) for (const [k, v] of Object.entries(f)) q = q.where(k, '==', v);
    const s = await q.get(); return s.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async set(c, id, v) { const { id: _, ...r } = v; await fdb.collection(c).doc(id).set(r); return id; },
  async update(c, id, v) { await fdb.collection(c).doc(id).set(v, { merge: true }); },
  async del(c, id) { await fdb.collection(c).doc(id).delete(); }
};
const safeGet = (c, id) => DB.get(c, id).catch(() => null);
const safeList = (c, f) => DB.list(c, f).catch(() => []);

/* ================= المصادقة: المتصفح =================
   جلستان منفصلتان: bayan_session للطالب (الموقع)، bayan_admin_session للمشرف (admin.html) */
const AuthLocal = {
  canReset: true,
  key() { return S.scope === 'admin' ? 'bayan_admin_session' : 'bayan_session'; },
  sess(v) { const k = this.key(); if (v === undefined) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } } v ? localStorage.setItem(k, JSON.stringify(v)) : localStorage.removeItem(k); },
  async init() {
    const s = this.sess(); if (!s) return null;
    if (S.scope === 'admin') return s.admin ? { uid: 'admin', name: 'المشرف', isAdmin: true } : null;
    const u = await DB.get('users', s.uid); if (!u || u.disabled) { this.sess(null); return null; }
    return { uid: u.id, name: u.name, username: u.username, isAdmin: false };
  },
  async login(user, pass) {
    const us = await DB.list('users', { username: user.toLowerCase() });
    if (!us.length || us[0].passHash !== await sha(pass)) throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    if (us[0].disabled) throw new Error('هذا الحساب موقوف — تواصل مع إدارة المنصة');
    this.sess({ uid: us[0].id }); return { uid: us[0].id, name: us[0].name, username: us[0].username, isAdmin: false };
  },
  async adminLogin(user, pass) {
    const st = S.settings, h = await sha(pass);
    if (user !== (st.adminUser || 'admin') || h !== (st.adminHash || await sha('admin123'))) throw new Error('بيانات دخول المشرف غير صحيحة');
    this.sess({ admin: true }); return { uid: 'admin', name: 'المشرف', isAdmin: true };
  },
  async createUser({ name, nameEn, username, password, phone }, selfLogin) {
    username = username.toLowerCase();
    if (username === (S.settings.adminUser || 'admin') || (await DB.list('users', { username })).length) throw new Error('اسم المستخدم مستخدم من قبل، اختر اسماً آخر');
    const id = genId();
    await DB.set('users', id, { name, nameEn: nameEn || '', username, phone: phone || '', passHash: await sha(password), createdAt: Date.now(), disabled: false });
    if (selfLogin) { this.sess({ uid: id }); return { uid: id, name, username, isAdmin: false }; }
    return id;
  },
  async resetPassword(uid, pass) { await DB.update('users', uid, { passHash: await sha(pass) }); },
  async logout() { this.sess(null); }
};
/* ================= المصادقة: Firebase ================= */
const fbErr = e => ({
  'auth/invalid-credential': 'اسم المستخدم أو كلمة المرور غير صحيحة', 'auth/wrong-password': 'اسم المستخدم أو كلمة المرور غير صحيحة',
  'auth/user-not-found': 'اسم المستخدم أو كلمة المرور غير صحيحة', 'auth/email-already-in-use': 'اسم المستخدم مستخدم من قبل، اختر اسماً آخر',
  'auth/weak-password': 'كلمة المرور قصيرة — 6 أحرف على الأقل', 'auth/too-many-requests': 'محاولات كثيرة — انتظر قليلاً ثم أعد المحاولة',
  'auth/network-request-failed': 'تعذّر الاتصال بالإنترنت', 'auth/invalid-email': 'اسم المستخدم يحتوي أحرفاً غير مسموحة'
}[e.code] || e.message);
const toEmail = u => u.includes('@') ? u.trim() : `${u.trim().toLowerCase()}@${EMAIL_DOMAIN}`;
const AuthFB = {
  canReset: false,
  init() { return new Promise(res => { const un = fauth.onAuthStateChanged(async u => { un(); res(u ? await this.profile(u) : null); }); }); },
  async profile(u) {
    const [p, a] = await Promise.all([safeGet('users', u.uid), fdb.collection('admins').doc(u.uid).get().then(s => s.exists).catch(() => false)]);
    if (!a && p && p.disabled) { await fauth.signOut(); throw new Error('هذا الحساب موقوف — تواصل مع إدارة المنصة'); }
    return { uid: u.uid, name: p?.name || (a ? 'المشرف' : u.email), username: p?.username, isAdmin: a };
  },
  async login(user, pass) {
    try { const c = await fauth.signInWithEmailAndPassword(toEmail(user), pass); return await this.profile(c.user); }
    catch (e) { throw new Error(fbErr(e)); }
  },
  async createUser({ name, nameEn, username, password, phone }, selfLogin) {
    username = username.toLowerCase();
    const prof = { name, nameEn: nameEn || '', username, phone: phone || '', createdAt: Date.now(), disabled: false };
    try {
      if (selfLogin) {
        const c = await fauth.createUserWithEmailAndPassword(toEmail(username), password);
        await DB.set('users', c.user.uid, prof); return { uid: c.user.uid, name, username, isAdmin: false };
      }
      const sec = firebase.apps.find(a => a.name === 'secondary') || firebase.initializeApp(FIREBASE_CONFIG, 'secondary');
      const c = await sec.auth().createUserWithEmailAndPassword(toEmail(username), password);
      await DB.set('users', c.user.uid, prof); await sec.auth().signOut(); return c.user.uid;
    } catch (e) { throw new Error(fbErr(e)); }
  },
  async adminLogin(user, pass) {
    const p = await this.login(user, pass);
    if (!p.isAdmin) { await fauth.signOut(); throw new Error('هذا الحساب ليس حساب مشرف'); }
    return p;
  },
  async resetPassword() { throw new Error('في وضع Firebase تُغيَّر كلمات المرور من لوحة Firebase ← Authentication'); },
  async logout() { await fauth.signOut(); }
};

async function loadSettings() { const s = await safeGet('settings', 'main'); S.settings = { ...DEFAULTS, ...(s || {}) }; return S.settings; }

/* ================= بيانات تجريبية ================= */
function demoCourses() {
  const L = (title, type, extra = {}) => ({ id: genId(), title, type, url: '', content: '', duration: '', ...extra });
  return [
    {
      title: 'شرح الأربعين النووية', category: 'حديث', level: 'مبتدئ', theme: 'teal', icon: 'book', instructor: 'فريق بيان',
      summary: 'وقفات مع أحاديث جوامع الكلم التي جمعها الإمام النووي، حديثاً حديثاً.',
      description: 'جمع الإمام النووي رحمه الله اثنين وأربعين حديثاً عليها مدار الدين.\nفي هذه الدورة نقرأ متن كل حديث، ونشرح ألفاظه، ونستخرج فوائده العملية.\n\nمناسبة للمبتدئين ولمن يريد مراجعة منظمة.',
      lessons: [
        L('مقدمة: منزلة الأربعين النووية', 'text', { content: 'الأربعون النووية من أشهر كتب الحديث المختصرة، اختار فيها الإمام يحيى بن شرف النووي أحاديث جامعة يدور عليها فقه الدين وآدابه.\n\nمنهج الدورة: نقرأ المتن، ثم نبيّن معاني الكلمات، ثم نذكر الفوائد.', duration: '8' }),
        L('الحديث الأول: إنما الأعمال بالنيات', 'text', { content: 'عن أمير المؤمنين أبي حفص عمر بن الخطاب رضي الله عنه قال: سمعت رسول الله ﷺ يقول:\n«إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى، فَمَنْ كَانَتْ هِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ فَهِجْرَتُهُ إِلَى اللَّهِ وَرَسُولِهِ، وَمَنْ كَانَتْ هِجْرَتُهُ لِدُنْيَا يُصِيبُهَا أَوِ امْرَأَةٍ يَنْكِحُهَا فَهِجْرَتُهُ إِلَى مَا هَاجَرَ إِلَيْهِ»\nرواه البخاري ومسلم.', duration: '12' }),
        L('شرح الحديث الأول (مرئي)', 'video', { duration: '25' })
      ],
      exam: { ...DEFAULT_EXAM(), questions: [
        { id: genId(), type: 'mcq', text: 'من راوي حديث «إنما الأعمال بالنيات»؟', options: ['أبو هريرة', 'عمر بن الخطاب', 'عبد الله بن عباس', 'أنس بن مالك'], answer: 1 },
        { id: genId(), type: 'mcq', text: 'ما الموضوع الذي يدور عليه الحديث الأول؟', options: ['الصلاة', 'النية', 'الزكاة', 'بر الوالدين'], answer: 1 },
        { id: genId(), type: 'tf', text: 'الحديث الأول متفق عليه، رواه البخاري ومسلم.', options: ['صح', 'خطأ'], answer: 0 }
      ] }
    },
    {
      title: 'مبادئ التجويد للمبتدئين', category: 'تجويد', level: 'مبتدئ', theme: 'brass', icon: 'moonc', instructor: 'فريق بيان',
      summary: 'تعرّف على علم التجويد وأحكام النون الساكنة والتنوين مع تطبيقات صوتية.',
      description: 'دورة تأسيسية في تلاوة القرآن الكريم.\nنبدأ بتعريف علم التجويد وحكمه، ثم ننتقل إلى أحكام النون الساكنة والتنوين، مع تطبيق صوتي بعد كل درس.',
      lessons: [
        L('تعريف علم التجويد', 'text', { content: 'التجويد لغةً: التحسين.\nواصطلاحاً: إعطاء كل حرف حقه ومستحقه من المخارج والصفات.', duration: '10' }),
        L('تطبيق صوتي: الاستعاذة والبسملة', 'audio', { duration: '9' }),
        L('أحكام النون الساكنة والتنوين — مدخل', 'text', { content: 'للنون الساكنة والتنوين أربعة أحكام:\nالإظهار، والإدغام، والإقلاب، والإخفاء.\n\nحروف الإظهار الحلقي ستة: الهمزة والهاء والعين والحاء والغين والخاء.\nوحروف الإدغام ستة يجمعها قولك: «يرملون».', duration: '15' })
      ],
      exam: { ...DEFAULT_EXAM(), questions: [
        { id: genId(), type: 'mcq', text: 'ما معنى التجويد لغةً؟', options: ['الحفظ', 'التحسين', 'الترتيل', 'القراءة'], answer: 1 },
        { id: genId(), type: 'mcq', text: 'كم عدد أحكام النون الساكنة والتنوين؟', options: ['ثلاثة', 'أربعة', 'خمسة', 'ستة'], answer: 1 },
        { id: genId(), type: 'tf', text: 'حروف الإدغام يجمعها قولك «يرملون».', options: ['صح', 'خطأ'], answer: 0 },
        { id: genId(), type: 'tf', text: 'حروف الإظهار الحلقي أربعة أحرف.', options: ['صح', 'خطأ'], answer: 1 }
      ] }
    },
    {
      title: 'مختصر السيرة النبوية', category: 'سيرة', level: 'مبتدئ', theme: 'clay', icon: 'mosque', instructor: 'فريق بيان',
      summary: 'رحلة مختصرة في حياة النبي ﷺ من المولد إلى البعثة.',
      description: 'نتتبع أهم محطات السيرة النبوية في دروس قصيرة، مع ملخص مكتوب لكل درس وملف للمراجعة.',
      lessons: [
        L('المولد والنشأة', 'text', { content: 'وُلد النبي ﷺ بمكة عام الفيل، ونشأ يتيماً؛ إذ توفي أبوه عبد الله قبل ولادته.\nاسترضع في بني سعد عند حليمة السعدية.', duration: '10' }),
        L('ملف المراجعة الأول', 'pdf', { duration: '' }),
        L('البعثة ونزول الوحي', 'text', { content: 'كان النبي ﷺ يتعبّد في غار حراء، وفيه نزل عليه الوحي بأول آيات سورة العلق: ﴿اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ﴾.', duration: '12' })
      ],
      exam: { ...DEFAULT_EXAM(), questions: [
        { id: genId(), type: 'mcq', text: 'في أي عام وُلد النبي ﷺ؟', options: ['عام الحزن', 'عام الفيل', 'عام الفتح', 'عام الوفود'], answer: 1 },
        { id: genId(), type: 'mcq', text: 'أين نزل الوحي أول مرة؟', options: ['غار ثور', 'المسجد الحرام', 'غار حراء', 'جبل أحد'], answer: 2 },
        { id: genId(), type: 'mcq', text: 'من التي استُرضع عندها النبي ﷺ في بني سعد؟', options: ['حليمة السعدية', 'أم أيمن', 'ثويبة', 'فاطمة بنت أسد'], answer: 0 }
      ] }
    }
  ].map((c, i) => ({ ...c, published: true, createdAt: Date.now() - i * 1000 }));
}
async function seedCourses() { for (const c of demoCourses()) await DB.set('courses', genId(), c); }
async function ensureLocalSeed() {
  if (localStorage.getItem('bayan_seeded')) return;
  await seedCourses();
  for (const c of academyCourses()) await DB.set('courses', genId(), c);
  await DB.set('users', 'demo', { name: 'عبد الله أحمد', username: 'demo', phone: '', passHash: await sha('123456'), createdAt: Date.now(), disabled: false });
  localStorage.setItem('bayan_seeded', '1');
}

/* ================= واجهة: تنبيهات ونوافذ ================= */
function toast(msg, type = '') {
  const t = document.createElement('div'); t.className = 'toast ' + type; t.textContent = msg; $('#toasts').append(t);
  setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3200);
}
function modal(title, body, { onSubmit, submitText = 'حفظ', wide, onOpen, noFoot } = {}) {
  const bg = document.createElement('div'); bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true"><div class="modal-head"><h3>${title}</h3><button class="icon-btn sm" data-close aria-label="إغلاق">${ic('x', 18)}</button></div><form class="form" novalidate>${body}<div class="form-err" data-err></div>${noFoot ? '' : `<div class="modal-foot"><button class="btn btn-primary" type="submit">${submitText}</button><button class="btn btn-ghost" type="button" data-close>إلغاء</button></div>`}</form></div>`;
  document.body.append(bg);
  const close = () => { bg.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  bg.addEventListener('click', e => { if (e.target === bg || e.target.closest('[data-close]')) close(); });
  const form = $('form', bg);
  form.onsubmit = async e => {
    e.preventDefault(); if (!onSubmit) return close();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const btn = $('[type=submit]', form); btn.disabled = true; $('[data-err]', form).textContent = '';
    try { const r = await onSubmit(new FormData(form), form); if (r !== false) close(); }
    catch (err) { $('[data-err]', form).textContent = err.message; }
    finally { btn.disabled = false; }
  };
  onOpen?.(form);
  setTimeout(() => $('input,select,textarea', form)?.focus(), 50);
  return close;
}
function confirmBox(msg, okText = 'تأكيد') {
  return new Promise(res => {
    let done = false;
    const close = modal('تأكيد', `<p>${msg}</p>`, { submitText: okText, onSubmit: () => { done = true; res(true); } });
    const obs = new MutationObserver(() => { if (!document.contains($('.modal-bg'))) { obs.disconnect(); if (!done) res(false); } });
    obs.observe(document.body, { childList: true });
  });
}
function downloadFile(name, content, type = 'text/csv;charset=utf-8') {
  const b = new Blob([content], { type }); const a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const toCSV = rows => '\ufeff' + rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');

const themeStyle = c => { const t = THEMES[c.theme] || THEMES.teal; return `--c1:${t[0]};--c2:${t[1]}`; };

/* ================= الهيكل والتأثيرات ================= */
const isDark = () => document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
function applyTheme() { const t = localStorage.getItem('bayan_theme'); if (t) document.documentElement.dataset.theme = t; }
function paint(v) {
  S.cleanups.forEach(f => { try { f(); } catch { } }); S.cleanups = []; $$('.modal-bg').forEach(m => m.remove());
  $('#app').innerHTML = APP.layout(v);
  document.title = (v.docTitle ? v.docTitle + ' — ' : '') + S.settings.name + (S.scope === 'admin' ? ' — الإدارة' : '');
  if (!v.keepScroll) window.scrollTo({ top: 0, behavior: 'instant' });
  onScroll(); v.mount?.(); enhance();
}
function enhance(root = document) {
  if (!S.io) S.io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; const el = e.target; el.classList.add('in'); S.io.unobserve(el);
    $$('[data-count]', el).concat(el.matches('[data-count]') ? [el] : []).forEach(countUp);
    $$('[data-w]', el).forEach(b => b.style.width = b.dataset.w + '%');
  }), { threshold: .12 });
  $$('.reveal:not(.in)', root).forEach((el, i) => { el.style.transitionDelay = (i % 4) * 80 + 'ms'; S.io.observe(el); });
  $$('[data-w]', root).forEach(b => { if (!b.closest('.reveal')) requestAnimationFrame(() => b.style.width = b.dataset.w + '%'); });
  $$('[data-count]', root).forEach(el => { if (!el.closest('.reveal')) countUp(el); });
  if (matchMedia('(hover:hover)').matches && !reduceMotion) $$('.tilt', root).forEach(el => {
    el.onpointermove = e => { const r = el.getBoundingClientRect(); el.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * -7 + 'deg'); el.style.setProperty('--rx', ((e.clientY - r.top) / r.height - .5) * 7 + 'deg'); };
    el.onpointerleave = () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); };
  });
}
function countUp(el) {
  if (el.dataset.done) return; el.dataset.done = 1; const to = +el.dataset.count;
  if (reduceMotion || !to) { el.textContent = to; return; }
  const t0 = performance.now(), d = 1400;
  const f = t => { const p = Math.min(1, (t - t0) / d); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}
function onScroll() { const n = $('#nav'); if (n) n.classList.toggle('scrolled', scrollY > 30); }
/* ================= التوجيه ================= */
function notFound(msg = 'الصفحة غير موجودة.') {
  return { docTitle: 'غير موجود', html: `<section class="auth"><div class="empty" style="max-width:520px">${ic('star', 40)}<p style="margin-bottom:16px">${esc(msg)}</p><a class="btn btn-primary" href="#/">العودة للرئيسية</a></div></section>` };
}
async function route() {
  const path = (location.hash.slice(1) || '/').split('?')[0];
  for (const [re, fn, guard] of APP.routes) {
    const m = path.match(re); if (!m) continue;
    if (guard && APP.guard(guard, path)) return; // الحارس يتولى التحويل
    const token = ++S.token;
    try { const v = await fn(...m.slice(1).map(x => x === undefined ? undefined : decodeURIComponent(x))); if (token !== S.token || !v) return; paint(v); }
    catch (e) {
      console.error(e); if (token !== S.token) return;
      const perm = /permission|insufficient/i.test(e.message);
      paint({ html: `<section class="auth"><div class="empty" style="max-width:560px">${ic('x', 36)}<p><strong>تعذّر تحميل الصفحة.</strong></p><p class="muted" style="margin:8px 0 16px">${perm ? 'رفضت قاعدة البيانات الطلب. تأكد من نشر قواعد Firestore ومن وجود حسابك في مجموعة admins.' : esc(e.message)}</p><button class="btn btn-primary" onclick="location.reload()">إعادة المحاولة</button></div></section>` });
    }
    return;
  }
  paint(notFound());
}
document.addEventListener('click', async e => {
  const a = e.target.closest('[data-act]'); if (!a) return;
  const act = a.dataset.act;
  if (act === 'theme') { const t = isDark() ? 'light' : 'dark'; document.documentElement.dataset.theme = t; localStorage.setItem('bayan_theme', t); $$('[data-act="theme"]').forEach(b => { const s = b.querySelector('svg'); if (s) s.outerHTML = ic(t === 'dark' ? 'sun' : 'moon', b.classList.contains('side-link') ? 19 : 18); }); }
  if (act === 'menu') $('#links')?.classList.toggle('open');
  if (act === 'side') $('#side')?.classList.toggle('open');
  if (act === 'logout') { await Auth.logout(); S.user = null; toast('خرجت من حسابك'); APP.afterLogout(); }
});
addEventListener('hashchange', () => { $('#links')?.classList.remove('open'); $('#side')?.classList.remove('open'); route(); });
addEventListener('scroll', onScroll, { passive: true });

function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('تعذّر تحميل ' + src)); document.head.append(s); }); }
const FB_BASE = 'https://www.gstatic.com/firebasejs/10.12.2/';
/* Cloud Functions تُحمَّل عند الحاجة فقط (بدء امتحان رسمي) */
async function fbFunctions() {
  if (!firebase.functions) await loadScript(FB_BASE + 'firebase-functions-compat.js');
  return firebase.app().functions(typeof FUNCTIONS_REGION === 'string' && FUNCTIONS_REGION ? FUNCTIONS_REGION : 'us-central1');
}
async function boot() {
  applyTheme();
  try {
    if (FIREBASE_CONFIG) {
      const base = FB_BASE;
      await loadScript(base + 'firebase-app-compat.js');
      await Promise.all([loadScript(base + 'firebase-auth-compat.js'), loadScript(base + 'firebase-firestore-compat.js')]);
      firebase.initializeApp(FIREBASE_CONFIG); fdb = firebase.firestore(); fauth = firebase.auth();
      DB = Remote; Auth = AuthFB;
    } else { DB = Local; Auth = AuthLocal; await ensureLocalSeed(); }
    await loadSettings();
    try { S.user = await Auth.init(); } catch (e) { S.user = null; toast(e.message, 'err'); }
    route();
  } catch (e) {
    console.error(e);
    $('#app').innerHTML = `<section class="auth"><div class="empty" style="max-width:560px"><p><strong>تعذّر تشغيل المنصة.</strong></p><p class="muted" style="margin:8px 0 16px">${esc(e.message)}<br>تحقق من اتصال الإنترنت ومن إعدادات Firebase في js/config.js.</p><button class="btn btn-primary" onclick="location.reload()">إعادة المحاولة</button></div></section>`;
  }
}

/* ================= الوسائط: التعرّف على الرابط وتضمينه ================= */
/* mediaInfo يرجع { kind, label, cls, src, open } أو null للرابط غير الصالح. kind = iframe | audio | video | link */
function ytTime(t) {
  if (!t) return 0; if (/^\d+$/.test(t)) return +t;
  const m = String(t).match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/); return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0;
}
function mediaInfo(raw, type) {
  const url = normUrl(raw); if (!url) return null;
  let U; try { U = new URL(url); } catch { return null; }
  const h = U.hostname.toLowerCase().replace(/^(www|m|music|mobile)\./, ''), p = U.pathname, q = U.searchParams;
  const F = (label, src, cls = 'video', open = url) => ({ kind: 'iframe', label, src, cls, open });
  // يوتيوب: watch?v= · youtu.be · shorts · live · embed · قوائم التشغيل · وقت البدء
  if (h === 'youtu.be' || h === 'youtube.com' || h === 'youtube-nocookie.com') {
    const id = h === 'youtu.be' ? p.split('/')[1] : q.get('v') || (p.match(/^\/(?:embed|shorts|live|v|e)\/([\w-]{11})/) || [])[1];
    const st = ytTime(q.get('t') || q.get('start')), list = q.get('list');
    if (id && /^[\w-]{11}$/.test(id)) return F('يوتيوب', `https://www.youtube.com/embed/${id}?rel=0&playsinline=1${st ? '&start=' + st : ''}`, 'video', `https://www.youtube.com/watch?v=${id}${st ? '&t=' + st + 's' : ''}`);
    if (list) return F('يوتيوب', `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(list)}`, 'video', `https://www.youtube.com/playlist?list=${encodeURIComponent(list)}`);
  }
  // Vimeo (العام والمخفي vimeo.com/ID/HASH)
  if (h === 'vimeo.com') { const m = p.match(/^\/(?:video\/)?(\d+)(?:\/([\da-f]+))?/); if (m) return F('Vimeo', `https://player.vimeo.com/video/${m[1]}${m[2] ? '?h=' + m[2] : ''}`); }
  if (h === 'player.vimeo.com') return F('Vimeo', url);
  // SoundCloud
  if (h === 'w.soundcloud.com') return F('ساوند كلاود', url, 'audio');
  if (/(^|\.)soundcloud\.com$/.test(h) || h === 'snd.sc') return F('ساوند كلاود', `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%231E6F6A&visual=false&show_comments=false`, 'audio');
  // Google Drive: ملف · مجلد · open?id · uc?id
  if (h === 'drive.google.com' || h === 'docs.google.com' && /^\/(file|uc|open)/.test(p)) {
    const fo = p.match(/\/folders\/([\w-]+)/);
    if (fo) return F('Google Drive', `https://drive.google.com/embeddedfolderview?id=${fo[1]}#list`, 'doc');
    const id = (p.match(/\/file\/d\/([\w-]+)/) || [])[1] || q.get('id');
    if (id) return F('Google Drive', `https://drive.google.com/file/d/${id}/preview`, type === 'pdf' || type === 'text' ? 'doc' : 'video', `https://drive.google.com/file/d/${id}/view`);
  }
  // مستندات وعروض وجداول ونماذج Google
  if (h === 'docs.google.com') {
    const m = p.match(/^\/(document|spreadsheets|presentation|forms)\/d\/(e\/)?([\w-]+)/);
    if (m) {
      const [, k, pub, id] = m, base = `https://docs.google.com/${k}/d/${pub || ''}${id}`;
      const src = k === 'forms' ? `${base}/viewform?embedded=true` : pub ? (k === 'presentation' ? `${base}/embed` : k === 'spreadsheets' ? `${base}/pubhtml?widget=true` : `${base}/pub?embedded=true`) : `${base}/preview`;
      return F('Google Docs', src, 'doc');
    }
  }
  // أرشيف الإنترنت
  if (h === 'archive.org') { const m = p.match(/^\/(?:details|embed)\/([^/?#]+)/); if (m) return F('Archive.org', `https://archive.org/embed/${m[1]}`, type === 'audio' ? 'audio' : 'video'); }
  // Dropbox: يتحول إلى رابط مباشر
  let direct = url;
  if (h === 'dropbox.com') { U.searchParams.delete('dl'); U.searchParams.set('raw', '1'); direct = U.toString(); }
  const ext = (p.match(/\.([a-z0-9]{2,4})$/i) || [])[1]?.toLowerCase();
  if (['mp3', 'm4a', 'ogg', 'oga', 'wav', 'aac', 'opus', 'flac'].includes(ext)) return { kind: 'audio', label: 'ملف صوتي', src: direct, open: url };
  if (['mp4', 'webm', 'm4v', 'ogv', 'mov'].includes(ext)) return { kind: 'video', label: 'ملف فيديو', src: direct, open: url };
  if (ext === 'pdf') return F('ملف PDF', direct, 'doc', url);
  return { kind: 'link', label: 'موقع خارجي', src: url, open: url };
}
function mediaEmbed(l) {
  const raw = String(l.url || '').trim(), m = mediaInfo(raw, l.type);
  if (!m) return l.type === 'text' && !raw ? '' : `<div class="media-empty">${ic(TYPE_IC[l.type] || 'link', 36)}<p style="margin-top:10px">${raw ? 'رابط هذا الدرس غير صالح.' : 'لم يُضَف رابط لهذا الدرس بعد.'}</p>${S.user?.isAdmin || S.scope === 'admin' ? '<p class="hint">عدّله من لوحة التحكم ← الدورات ← الدروس.</p>' : ''}</div>`;
  if (m.kind === 'link') return `<div class="media-empty">${ic('link', 34)}<p style="margin:10px 0">هذه المادة على موقع خارجي.</p><a class="btn btn-primary" href="${esc(m.open)}" target="_blank" rel="noopener">فتح المادة</a></div>`;
  const body = m.kind === 'audio' ? `<div class="audio-native">${ic('audio', 40)}<audio controls preload="metadata" src="${esc(m.src)}"></audio></div>`
    : m.kind === 'video' ? `<div class="frame video"><video controls playsinline preload="metadata" src="${esc(m.src)}"></video></div>`
    : `<div class="frame ${m.cls}"><iframe src="${esc(m.src)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin" title="${esc(l.title || m.label)}"></iframe></div>`;
  const local = location.protocol === 'file:' && m.kind === 'iframe' ? '<span>المقاطع المضمّنة لا تعمل عند فتح الملف من جهازك مباشرة، وتعمل بعد الرفع على Netlify.</span>' : '<span>لا تظهر المادة؟</span>';
  return body + `<div class="media-src">${local}<a href="${esc(m.open)}" target="_blank" rel="noopener">${ic('link', 14)} افتحها في ${esc(m.label)}</a></div>`;
}

/* ================= الشهادة: القوالب والرسم ================= */
const CERT_TPLS = {
  classic: { name: 'كلاسيكي', desc: 'إطار تركوازي بزخرفة هندسية وورقة عاجية' },
  royal: { name: 'ملكي', desc: 'أبيض بإطار عريض وزوايا ذهبية' },
  modern: { name: 'حديث', desc: 'شريط جانبي ملوّن وتصميم هادئ' },
  parchment: { name: 'رَقّ عتيق', desc: 'ورق قديم بأقواس وحبر بنّي' }
};
const CERT_LANGS = { both: 'العربية والإنجليزية (شهادتان منفصلتان)', ar: 'العربية فقط', en: 'الإنجليزية فقط' };
/* لغات الشهادة: من نوع الشهادة إن حدّدها، وإلا من الإعداد العام */
const certLangList = type => ({ ar: ['ar'], en: ['en'] })[type?.langs || S.settings.certLangs] || ['ar', 'en'];
const fmtDateEn = t => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtHijri = t => { try { return new Date(t).toLocaleDateString('ar-SA-u-ca-islamic-umalqura-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; } };
const CERT_SAMPLE = () => ({ id: 'BYN-DEMO-2026', name: 'عبد الله بن أحمد', nameEn: 'Abdullah Ahmad', courseTitle: 'شرح الأربعين النووية', courseTitleEn: 'Commentary on al-Nawawi’s Forty Hadith', instructor: 'الشيخ محمد الحسن', instructorEn: 'Sheikh Muhammad Al-Hasan', score: 92, issuedAt: Date.now() });
/* certHtml(الشهادة، 'ar'|'en'، { tpl, qr: dataURL، c: الدورة لاستكمال الأسماء الإنجليزية }) — شهادة كاملة بلغة واحدة */
function certHtml(ct, lang = 'ar', o = {}) {
  const st = S.settings, c = o.c || {}, ar = lang !== 'en';
  const T = o.type; if (T?.design === 'image') return certImageHtml(ct, lang, o);
  const tpl = [o.tpl, T?.tpl, st.certTemplate].find(k => CERT_TPLS[k]) || 'classic';
  const tt = k => String(T?.[k] || '').trim();
  const name = ar ? ct.name : ct.nameEn || ct.name;
  const course = ar ? ct.courseTitle : ct.courseTitleEn || c.titleEn || ct.courseTitle;
  const inst = ar ? ct.instructor : ct.instructorEn || c.instructorEn || '';
  const brand = ar ? st.name : st.nameEn || 'Bayan';
  const L = ar ? { t: tt('titleAr') || 'شهادة إتمام', a: 'يُشهد بأنّ', b: tt('lineAr') || 'قد أتمّ بحمد الله وتوفيقه دورة', s: `بنسبة ${ct.score}%`, d: 'تاريخ الإصدار', i: 'المحاضر', v: 'رمز التحقق' }
    : { t: tt('titleEn') || 'Certificate of Completion', a: 'This is to certify that', b: tt('lineEn') || 'has successfully completed the course', s: `with a score of ${ct.score}%`, d: 'Date of issue', i: 'Instructor', v: 'Verification code' };
  const medal = `<svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="47" stroke="#B88E45" stroke-width="1.4"/><circle cx="50" cy="50" r="42" stroke="#B88E45" stroke-width=".8" stroke-dasharray="2 2.4"/><circle cx="50" cy="50" r="37" fill="#0B3D3A"/><g stroke="#D9B873" stroke-width="1.6"><rect x="34" y="34" width="32" height="32"/><rect x="34" y="34" width="32" height="32" transform="rotate(45 50 50)"/></g><circle cx="50" cy="50" r="5" fill="#D9B873"/></svg>`;
  const star = `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1"><rect x="20" y="20" width="60" height="60"/><rect x="20" y="20" width="60" height="60" transform="rotate(45 50 50)"/><rect x="32" y="32" width="36" height="36" transform="rotate(22.5 50 50)"/><rect x="32" y="32" width="36" height="36" transform="rotate(67.5 50 50)"/><circle cx="50" cy="50" r="46"/></svg>`;
  const corner = `<svg viewBox="0 0 60 60" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 58V2h56"/><path d="M8 50V8h42"/><rect x="15" y="15" width="14" height="14"/><rect x="15" y="15" width="14" height="14" transform="rotate(45 22 22)"/></svg>`;
  return `<div class="cert t-${tpl} l-${ar ? 'ar' : 'en'}" dir="${ar ? 'rtl' : 'ltr'}" lang="${ar ? 'ar' : 'en'}">
    <div class="cx-band" aria-hidden="true"><div class="cx-band-star">${star}</div></div>
    <div class="cx-paper">
      <div class="cx-arch" aria-hidden="true"></div><div class="cx-wm" aria-hidden="true">${star}</div>
      ${['tl', 'tr', 'bl', 'br'].map(k => `<span class="cx-c ${k}" aria-hidden="true">${corner}</span>`).join('')}
      <div class="cx-head"><div class="cx-medal">${medal}</div><div class="cx-brand">${esc(brand)}</div></div>
      <div class="cx-body">
        <div class="cx-title">${L.t}</div>
        <div class="cx-lbl">${L.a}</div>
        <div class="cx-name">${esc(name)}</div>
        <div class="cx-lbl">${L.b}</div>
        <div class="cx-course">${esc(course)}</div>
        ${ct.score != null ? `<div class="cx-lbl cx-score">${L.s}</div>` : ''}
      </div>
      <div class="cx-foot">
        <div class="cx-f"><span>${L.d}</span><b>${ar ? fmtDate(ct.issuedAt) : fmtDateEn(ct.issuedAt)}</b>${ar ? `<small>${esc(fmtHijri(ct.issuedAt))}</small>` : ''}</div>
        <div class="cx-qr"><img alt="" ${o.qr ? `src="${o.qr}"` : 'hidden'}><i class="cx-qr-ph"${o.qr ? ' hidden' : ''}></i><small dir="ltr">${esc(ct.id)}</small></div>
        <div class="cx-f end">${inst ? `<span>${L.i}</span><b>${esc(inst)}</b>` : `<span>${L.v}</span><b dir="ltr">${esc(ct.id)}</b>`}</div>
      </div>
    </div>
  </div>`;
}

/* ================= أنواع الشهادات =================
   certTypes/{id}: name, langs(''=حسب الإعداد العام|both|ar|en), design(tpl|image), tpl, titleAr, titleEn, lineAr, lineEn,
     o(landscape|portrait), hasEn, layout{حقل: {x,y,size,w,font,color,bold,show}}, v (رقم نسخة التصميم), createdAt, updatedAt
   certAssets/{id}_ar و {id}_en: { data: صورة JPEG بصيغة dataURL بمقاس A4، o } — منفصلة لأن الصور كبيرة
   الدورة تختار نوعها بـ certType، وإلا يُستعمل settings.certDefault، وإلا القالب الجاهز القديم */
const CERT_FIELDS = {
  name: { lbl: 'اسم الطالب', x: 50, y: 45, size: 4.4, w: 80, font: 'ruqaa', color: '#0B3D3A', bold: 0 },
  course: { lbl: 'اسم الدورة', x: 50, y: 58, size: 2.6, w: 75, font: 'kufi', color: '#1D2A28', bold: 0 },
  score: { lbl: 'الدرجة', x: 50, y: 66, size: 1.6, w: 60, font: 'plex', color: '#4C5B58', bold: 0 },
  date: { lbl: 'تاريخ الإصدار', x: 22, y: 83, size: 1.5, w: 30, font: 'plex', color: '#1D2A28', bold: 1 },
  hijri: { lbl: 'التاريخ الهجري', x: 22, y: 88, size: 1.15, w: 30, font: 'plex', color: '#6A7774', bold: 0 },
  instructor: { lbl: 'المحاضر', x: 78, y: 84, size: 1.5, w: 30, font: 'plex', color: '#1D2A28', bold: 1 },
  brand: { lbl: 'اسم المنصة', x: 50, y: 12, size: 2, w: 60, font: 'kufi', color: '#0B3D3A', bold: 0, show: 0 },
  qr: { lbl: 'رمز QR', x: 50, y: 83, size: 7, w: 0, font: '', color: '', bold: 0 },
  code: { lbl: 'رمز التحقق', x: 50, y: 92.5, size: 1.05, w: 40, font: 'plex', color: '#1D2A28', bold: 1 }
};
const CERT_FONTS = { ruqaa: ['رقعة', "'Aref Ruqaa',serif"], naskh: ['نسخ', "'Amiri',serif"], kufi: ['كوفي', "'Reem Kufi',sans-serif"], plex: ['عادي', "'IBM Plex Sans Arabic',sans-serif"], serif: ['إنجليزي كلاسيكي', "'Cormorant Garamond',Georgia,serif"] };
/* الرقعة والنسخ لا تناسبان الحروف اللاتينية، فتُستبدلان بخط إنجليزي كلاسيكي في الشهادة الإنجليزية */
const certFont = (k, ar) => (!ar && (k === 'ruqaa' || k === 'naskh') ? CERT_FONTS.serif : CERT_FONTS[k] || CERT_FONTS.plex)[1];
const certLayout = lay => Object.fromEntries(Object.entries(CERT_FIELDS).map(([k, d]) => [k, { show: d.show ?? 1, ...d, ...((lay || {})[k] || {}) }]));
const numIn = (v, a, b, d) => { v = +v; return Number.isFinite(v) ? Math.min(b, Math.max(a, v)) : d; };
const hexIn = (v, d) => /^#[0-9a-f]{6}$/i.test(v || '') ? v : d;
/* شهادة على تصميم مستورد: صورة خلفية + حقول بمواضع نسبية (%) ومقاسات cqw */
function certImageHtml(ct, lang, o = {}) {
  const T = o.type, st = S.settings, c = o.c || {}, ar = lang !== 'en', lay = certLayout(T.layout);
  const bg = (ar ? T.bgAr : T.bgEn) || T.bgAr || T.bgEn || '';
  const val = {
    name: ar ? ct.name : ct.nameEn || ct.name,
    course: ar ? ct.courseTitle : ct.courseTitleEn || c.titleEn || ct.courseTitle,
    score: ct.score != null ? (ar ? `بنسبة ${ct.score}%` : `with a score of ${ct.score}%`) : '',
    date: ar ? fmtDate(ct.issuedAt) : fmtDateEn(ct.issuedAt),
    hijri: ar ? fmtHijri(ct.issuedAt) : '',
    instructor: ar ? ct.instructor : ct.instructorEn || c.instructorEn || '',
    brand: ar ? st.name : st.nameEn || st.name,
    code: ct.id
  };
  const fields = Object.keys(CERT_FIELDS).map(k => {
    const L = lay[k]; if (!L.show) return '';
    const pos = `left:${numIn(L.x, 0, 100, 50)}%;top:${numIn(L.y, 0, 100, 50)}%`;
    if (k === 'qr') return `<div class="cf cf-qr cx-qr" data-f="qr" style="${pos};width:${numIn(L.size, 2, 30, 7)}cqw"><img alt="" ${o.qr ? `src="${o.qr}"` : 'hidden'}><i class="cx-qr-ph"${o.qr ? ' hidden' : ''}></i></div>`;
    if (!val[k]) return '';
    return `<div class="cf" data-f="${k}" ${k === 'code' ? 'dir="ltr"' : ''} style="${pos};font-size:${numIn(L.size, .5, 12, 2)}cqw;max-width:${numIn(L.w, 5, 100, 80)}%;color:${hexIn(L.color, '#1D2A28')};font-family:${certFont(L.font, ar)};font-weight:${L.bold ? 700 : 400}">${esc(val[k])}</div>`;
  }).join('');
  return `<div class="cert t-image o-${T.o === 'portrait' ? 'portrait' : 'landscape'} l-${ar ? 'ar' : 'en'}" dir="${ar ? 'rtl' : 'ltr'}" lang="${ar ? 'ar' : 'en'}">
    ${bg ? `<img class="cx-bg" src="${bg}" alt="">` : `<div class="cx-bg cx-bg-empty"><span>ارفع تصميم الشهادة</span></div>`}${fields}</div>`;
}
const certAssetCache = {};
async function loadCertType(id) {
  if (!id) return null;
  const t = await safeGet('certTypes', id); if (!t) return null;
  if (t.design === 'image') {
    const get = async l => { const k = `${id}_${l}`, ck = k + ':' + (t.v || 0); if (!(ck in certAssetCache)) certAssetCache[ck] = (await safeGet('certAssets', k))?.data || ''; return certAssetCache[ck]; };
    [t.bgAr, t.bgEn] = await Promise.all([get('ar'), t.hasEn ? get('en') : '']);
  }
  return t;
}
/* نوع الشهادة الفعلي: نوع الدورة الحالي ← النوع المحفوظ على الشهادة ← الافتراضي ← القالب الجاهز */
async function resolveCertType(ct, c) {
  for (const id of [...new Set([c?.certType, ct?.certType, S.settings.certDefault])]) { const t = await loadCertType(id); if (t) return t; }
  return { id: '', name: 'الافتراضية', design: 'tpl', tpl: S.settings.certTemplate || 'classic', langs: '' };
}
