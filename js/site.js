'use strict';
/* بيان — الموقع العام وصفحات الطالب (index.html). يعتمد على core.js */
/* ================= عناصر مرسومة ================= */
function girihArt() {
  const sq = (s, rot, cls, delay) => `<rect class="d" pathLength="1" x="${200 - s}" y="${200 - s}" width="${s * 2}" height="${s * 2}" transform="rotate(${rot} 200 200)" style="animation-delay:${delay}s"/>`;
  let rays = ''; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; rays += `<line class="d" pathLength="1" x1="${200 + Math.cos(a) * 118}" y1="${200 + Math.sin(a) * 118}" x2="${200 + Math.cos(a) * 172}" y2="${200 + Math.sin(a) * 172}" style="animation-delay:${.9 + i * .04}s"/>`; }
  let dots = ''; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; dots += `<circle cx="${200 + Math.cos(a) * 186}" cy="${200 + Math.sin(a) * 186}" r="3.2" fill="#C9A45C" opacity=".8"/>`; }
  return `<svg viewBox="0 0 400 400" role="img" aria-label="نجمة ثمانية من الزخارف الإسلامية"><g class="girih" id="girih">
    <g class="spin" fill="none" stroke="#C9A45C" stroke-width="1.3" opacity=".9">
      <circle class="d" pathLength="1" cx="200" cy="200" r="186" style="animation-delay:.1s"/>
      ${sq(132, 0, '', .2)}${sq(132, 45, '', .35)}${sq(132, 22.5, '', .5)}${sq(132, 67.5, '', .65)}
      ${rays}${dots}
    </g>
    <g class="spin-r" fill="none" stroke="#EFEDE6" stroke-width="1.1" opacity=".55">
      ${sq(86, 0, '', .8)}${sq(86, 45, '', .95)}
      <circle class="d" pathLength="1" cx="200" cy="200" r="104" style="animation-delay:1.1s"/>
    </g>
    <g fill="none" stroke="#C9A45C" stroke-width="2">${sq(56, 22.5, '', 1.2)}${sq(56, 67.5, '', 1.3)}</g>
    <circle cx="200" cy="200" r="50" fill="#0B3D3A"/>
    <text class="core-word" x="200" y="214" text-anchor="middle" font-size="40">${esc(S.settings.name)}</text>
  </g></svg>`;
}
const starMark = (cls = '') => `<svg class="${cls}" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="10" y="10" width="20" height="20"/><rect x="10" y="10" width="20" height="20" transform="rotate(45 20 20)"/><circle cx="20" cy="20" r="3.4" fill="currentColor"/></svg>`;
function courseCard(c, prog) {
  const n = (c.lessons || []).length, hasExam = c.exam?.questions?.length, es = enrollState(c);
  return `<a class="ccard tilt reveal" href="#/course/${c.id}">
    <div class="ccover" style="${themeStyle(c)}"><div class="pat"></div>${ic(c.icon || 'book', 44)}<span class="ccat">${esc(c.category || 'عام')}</span>${prog == null && !isAdmProg(c.program) && es.state !== 'always' ? `<span class="cstate s-${es.state}">${esc(enrollLabel(es))}</span>` : ''}</div>
    <div class="cbody">${c.program === 'academy' && termLabel(c.term) ? `<small class="cterm">${esc(termLabel(c.term))}</small>` : c.program === 'ijaza' ? `<small class="cterm">${esc(programName('ijaza'))}</small>` : ''}<h3>${esc(c.title)}</h3>${c.book ? `<p class="cbook">${ic('book', 14)} ${esc(c.book)}${c.author ? ` — ${esc(c.author)}` : ''}</p>` : `<p>${esc(trim(c.summary, 100))}</p>`}
      <div class="cmeta">${c.online ? `<span class="c-live">${ic('video', 15)} مباشر</span>` : ''}${n || !c.online ? `<span>${ic('play', 15)} ${n} ${n === 1 ? 'درس' : 'دروس'}</span>` : ''}${hasExam ? `<span>${ic('quiz', 15)} اختبار</span>` : ''}${c.hours ? `<span>${ic('clock', 15)} ${esc(c.hours)} ساعات</span>` : c.level ? `<span>${ic('chart', 15)} ${esc(c.level)}</span>` : ''}</div>
      ${prog != null ? `<div class="bar" style="margin-top:8px"><i data-w="${prog}"></i></div><small class="muted">${prog}% مكتمل</small>` : ''}
    </div></a>`;
}
/* mediaEmbed() في core.js */
const PAT_BG = `background-image:url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cg fill='none' stroke='%23fff' stroke-width='1'%3E%3Crect x='14' y='14' width='20' height='20'/%3E%3Crect x='14' y='14' width='20' height='20' transform='rotate(45 24 24)'/%3E%3C/g%3E%3C/svg%3E&quot;)`;
/* رأس صفحة داكن بنفس هوية غلاف الدورة */
const pageHead = (title, lead = '') => `<section class="chero page-head" style="--c1:var(--deep);--c2:#1E6F6A"><div class="pat" style="${PAT_BG}"></div>
  <div class="wrap stagger" style="position:relative"><h1>${esc(title)}</h1>${lead ? `<p class="lead">${esc(lead)}</p>` : ''}</div></section>`;

/* ================= العدّ التنازلي ================= */
const CD_UNITS = [['d', 'يوم', 864e5], ['h', 'ساعة', 36e5], ['m', 'دقيقة', 6e4], ['s', 'ثانية', 1e3]];
const countdownHtml = t => `<div class="cdown" data-until="${t}" role="timer" aria-live="off">${CD_UNITS.map(([k, l]) => `<span><b data-u="${k}">--</b><small>${l}</small></span>`).join('')}</div>`;
function runCountdowns() {
  const els = $$('[data-until]'); if (!els.length) return;
  const tick = () => {
    for (const el of els) {
      let left = Math.max(0, +el.dataset.until - Date.now());
      if (!left) { clearInterval(iv); setTimeout(route, 400); return; } // انتهى العدّ: أعد رسم الصفحة لتظهر الحالة الجديدة
      for (const [k, , ms] of CD_UNITS) { const v = Math.floor(left / ms); left -= v * ms; const b = $(`[data-u="${k}"]`, el); if (b) b.textContent = String(v).padStart(k === 'd' ? 1 : 2, '0'); }
    }
  };
  const iv = setInterval(tick, 1000); tick(); S.cleanups.push(() => clearInterval(iv));
}
/* بوابة: ما يظهر بدل زر التسجيل حين يكون مغلقاً */
function enrollGate(es, compact) {
  const head = es.state === 'soon' ? 'يفتح التسجيل بعد' : es.state === 'ended' ? 'انتهت فترة التسجيل' : 'التسجيل مغلق حالياً';
  const sub = es.state === 'soon' ? `${fmtDate(es.opensAt)}${es.closesAt ? ` — ويستمر حتى ${fmtDate(es.closesAt)}` : ''}` : (es.note || 'تابع الصفحة لمعرفة موعد الدفعة القادمة.');
  return `<div class="gate ${compact ? 'compact' : ''}"><strong>${ic(es.state === 'soon' ? 'calendar' : 'lock', 17)} ${head}</strong>${es.state === 'soon' && !compact ? countdownHtml(es.opensAt) : ''}<small>${esc(sub)}</small></div>`;
}
/* بداية الدراسة: لمواد البرنامج الأكاديمي من فصل الطالب (termId في تسجيله)، ولغيرها من الدورة نفسها */
const enrTerm = async (c, enr) => c.program === 'academy' && enr?.termId ? await safeGet('terms', enr.termId) : null;
const startOf = (c, tm) => tm ? +tm.startsAt || 0 : +c.startsAt || 0;
const hasStarted = (c, tm) => { const s = startOf(c, tm); return !s || Date.now() >= s; };
/* صفحة انتظار قبل بداية الدراسة (للدروس والاختبار) */
function notStartedView(c, at = c.startsAt) {
  return {
    docTitle: c.title,
    html: `<section class="auth"><div class="auth-card reveal" style="text-align:center;width:min(520px,100%)">${ic('calendar', 44)}
      <h1 style="font-size:1.6rem;margin:12px 0 6px">تبدأ الدراسة ${fmtDate(at)}</h1><p class="muted">أنت مسجّل في «${esc(c.title)}». تُفتح الدروس تلقائياً في موعدها.</p>
      ${countdownHtml(at)}<a class="btn btn-primary" href="#/course/${c.id}">العودة إلى الدورة</a></div></section>`,
    mount: runCountdowns
  };
}

/* ================= اللقاءات المباشرة (Zoom / Meet / Teams) ================= */
const meetBadge = (p, sz = 22) => { const [n, col] = MEET_PLATFORMS[p] || MEET_PLATFORMS.other; return `<span class="meet-ic" style="--mc:${col}" title="${esc(n)}">${ic('video', sz)}</span>`; };
const meetVia = p => p && p !== 'other' && MEET_PLATFORMS[p] ? ` عبر ${MEET_PLATFORMS[p][0]}` : '';
/* الرابط المناسب الآن: رابط اللقاء الجاري، وإلا الرابط الثابت، وإلا رابط اللقاء القادم */
const liveNowUrl = (lv, st) => st.live ? sessUrl(lv, st.live) : normUrl(lv.url) || sessUrl(lv, st.next);
const copyChip = (v, lbl) => `<button type="button" class="cred" data-copy="${esc(v)}" title="نسخ">${lbl} <b dir="ltr">${esc(v)}</b>${ic('copy', 14)}</button>`;
function livePanel(c, lv) {
  const st = liveState(lv), url = liveNowUrl(lv, st), mi = meetInfo(url), p = mi?.p || c.livePlatform || 'other';
  const mid = lv.meetingId || mi?.id || '', soon = st.live && st.live.at > Date.now();
  const status = st.live ? `<div class="live-now"><span class="dot" aria-hidden="true"></span><div><strong>${soon ? 'يبدأ اللقاء خلال دقائق — يمكنك الدخول الآن' : 'اللقاء جارٍ الآن'}</strong><small>${esc(st.live.title)} — من ${fmtTime(st.live.at)} إلى ${fmtTime(sessEnd(st.live))}</small></div></div>`
    : st.next ? `<div class="live-next"><small class="muted">اللقاء القادم</small><strong>${esc(st.next.title)}</strong><small>${fmtSess(st.next)}</small>${countdownHtml(st.next.at)}</div>`
    : c.liveSchedule ? `<p class="live-sched">${ic('calendar', 16)} ${esc(c.liveSchedule)}</p>` : '';
  const join = url ? `<a class="btn ${st.live ? 'btn-brass btn-join' : 'btn-primary'}" href="${esc(url)}" target="_blank" rel="noopener">${ic('video', 18)} ${st.live ? 'انضم الآن' : p === 'other' ? 'رابط اللقاء' : `الدخول عبر ${MEET_PLATFORMS[p][0]}`}</a>` : `<p class="hint">سيُضاف رابط اللقاء قريباً.</p>`;
  const rows = st.ss.map((x, i) => { const done = sessEnd(x) <= Date.now(), on = x === st.live; return `<li class="${done ? 'past' : ''} ${on ? 'on' : ''}"><span class="n">${done ? ic('check', 14) : i + 1}</span><div class="t">${esc(x.title)}<small>${fmtSess(x)}${on ? ' — <b>جارٍ الآن</b>' : ''}</small></div>${done && x.rec ? `<a class="sess-rec" href="${esc(x.rec)}" target="_blank" rel="noopener">${ic('play', 14)} التسجيل</a>` : ''}</li>`; }).join('');
  return `<div class="panel live-panel reveal" id="live">
    <div class="live-head">${meetBadge(p)}<div><h2>اللقاءات المباشرة</h2><small class="muted">${p === 'other' ? 'أونلاين' : `عبر ${MEET_PLATFORMS[p][0]}`}${c.liveSchedule && (st.live || st.next) ? ` — ${esc(c.liveSchedule)}` : ''}</small></div></div>
    ${status}
    ${lv.note ? `<p class="live-note">${esc(lv.note)}</p>` : ''}
    ${mid || lv.passcode ? `<div class="creds">${mid ? copyChip(mid, 'رقم الاجتماع') : ''}${lv.passcode ? copyChip(lv.passcode, 'رمز الدخول') : ''}</div>` : ''}
    <div class="hero-cta" style="margin:0">${join}${st.upcoming.length ? `<button type="button" class="btn btn-ghost" data-ics>${ic('calendar', 17)} أضف المواعيد إلى تقويمي</button>` : ''}</div>
    ${rows ? `<details class="sess-all" ${st.ss.length <= 6 ? 'open' : ''}><summary>جدول اللقاءات (${st.ss.length})</summary><ol class="lessons">${rows}</ol></details>` : ''}
  </div>`;
}
/* مختصر للشريط الجانبي في صفحة الدرس */
function liveMini(c, lv) {
  const st = liveState(lv), url = liveNowUrl(lv, st); if (!url && !st.next) return '';
  return `<div class="live-mini ${st.live ? 'on' : ''}">${st.live ? `<strong><span class="dot" aria-hidden="true"></span> اللقاء جارٍ الآن</strong><small>${esc(st.live.title)}</small>` : st.next ? `<strong>${ic('video', 16)} اللقاء القادم</strong><small>${fmtSess(st.next)}</small>` : `<strong>${ic('video', 16)} اللقاءات المباشرة</strong>`}
    ${url ? `<a class="btn btn-sm ${st.live ? 'btn-brass' : 'btn-ghost'} btn-block" href="${esc(url)}" target="_blank" rel="noopener">${st.live ? 'انضم الآن' : 'رابط اللقاء'}</a>` : ''}</div>`;
}
/* ملف تقويم .ics للقاءات القادمة مع تنبيه قبل ربع ساعة */
function liveICS(c, lv) {
  const z = t => new Date(t).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''), e = v => String(v || '').replace(/\\/g, '\\\\').replace(/[;,]/g, m => '\\' + m).replace(/\r?\n/g, '\\n');
  const ev = liveState(lv).upcoming.map(s => {
    const u = sessUrl(lv, s), desc = [u && `رابط الدخول: ${u}`, lv.meetingId && `رقم الاجتماع: ${lv.meetingId}`, lv.passcode && `رمز الدخول: ${lv.passcode}`].filter(Boolean).join('\n');
    return ['BEGIN:VEVENT', `UID:${s.id}-${c.id}@bayan`, `DTSTAMP:${z(Date.now())}`, `DTSTART:${z(s.at)}`, `DTEND:${z(sessEnd(s))}`, `SUMMARY:${e(`${s.title} — ${c.title}`)}`, u && `LOCATION:${e(u)}`, u && `URL:${u}`, desc && `DESCRIPTION:${e(desc)}`, 'BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY', `DESCRIPTION:${e(s.title)}`, 'END:VALARM', 'END:VEVENT'].filter(Boolean).join('\r\n');
  });
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Bayan//Live//AR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${e(c.title)}`, ...ev, 'END:VCALENDAR'].join('\r\n') + '\r\n';
}
/* أزرار النسخ والتقويم، وإعادة رسم الصفحة حين يبدأ لقاء أو ينتهي */
function mountLive(c, lv) {
  if (!lv) return;
  $$('[data-copy]').forEach(b => b.onclick = async () => { try { await navigator.clipboard.writeText(b.dataset.copy); toast('نُسخ', 'ok'); } catch { toast('انسخه يدوياً: ' + b.dataset.copy); } });
  $$('[data-ics]').forEach(b => b.onclick = () => downloadFile(`${trim(c.title, 40).replace(/[\\/:*?"<>|]/g, '')}.ics`, liveICS(c, lv), 'text/calendar;charset=utf-8'));
  $$('[data-golive]').forEach(b => b.onclick = () => $('#live')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }));
  const st = liveState(lv), at = st.live ? sessEnd(st.live) : st.next ? st.next.at - LIVE_EARLY : 0, wait = at - Date.now();
  if (at && wait > 0 && wait < 2 ** 31 - 1) { const t = setTimeout(route, wait + 500); S.cleanups.push(() => clearTimeout(t)); }
}


/* ================= الهيكل ================= */
const adminLink = 'admin.html';
function header(over) {
  const u = S.user, st = S.settings, path = (location.hash.slice(1) || '/');
  const on = p => (p === '/' ? path === '/' : path.startsWith(p)) ? 'on' : '';
  return `<header class="nav ${over ? 'over' : ''}" id="nav"><div class="wrap nav-in">
    <a class="logo" href="#/">${logoMark()}<span>${esc(st.name)}</span></a>
    <nav class="links" id="links" aria-label="القائمة الرئيسية"><a href="#/" class="${on('/')}">الرئيسية</a><a href="#/programs" class="${on('/programs')}">البرامج الدراسية</a><a href="#/apply" class="${on('/apply')}">القبول</a><a href="#/courses" class="${on('/courses')}">الدورات</a><a href="#/about" class="${on('/about')}">عن ${esc(st.name)}</a><a href="#/contact" class="${on('/contact')}">تواصل معنا</a><a href="#/verify" class="${on('/verify')}">التحقق من شهادة</a></nav>
    <div class="nav-actions">
      <button class="icon-btn" data-act="theme" aria-label="تبديل المظهر">${ic(isDark() ? 'sun' : 'moon', 18)}</button>
      ${u ? (u.isAdmin ? `<a class="btn btn-sm btn-primary" href="${adminLink}">لوحة التحكم</a>` : `<a class="btn btn-sm btn-primary" href="#/me">${ic('user', 16)} ${esc(firstName(u.name))}</a>`)
        : `<a class="btn btn-sm btn-ghost" href="#/login">دخول</a>${st.allowRegister ? `<a class="btn btn-sm btn-brass hide-sm" href="#/register">حساب جديد</a>` : ''}`}
      <button class="icon-btn menu-btn" data-act="menu" aria-label="القائمة">${ic('menu', 18)}</button>
    </div></div></header>`;
}
/* روابط التواصل الاجتماعي المعبّأة في الإعدادات */
const socialLinks = (cls = 'soc') => { const so = S.settings.social || {}; return SOCIALS.filter(([k]) => safeUrl(so[k])).map(([k, t]) => `<a class="${cls}" href="${esc(safeUrl(so[k]))}" target="_blank" rel="noopener" aria-label="${t}" title="${t}">${ic(k, 18)}</a>`).join(''); };
function footer() {
  const st = S.settings, wa = waNum(st.whatsapp), soc = socialLinks();
  const legacy = !st.email && !wa && st.contact; // وسيلة التواصل القديمة قبل إضافة البريد والواتساب
  return `<footer class="foot-site"><div class="wrap foot-grid">
    <div class="foot-brand"><div class="logo" style="font-size:1.3rem">${logoMark(30)}<span>${esc(st.name)}</span></div><p>${esc(st.about)}</p>${soc ? `<div class="socs">${soc}</div>` : ''}</div>
    <nav class="foot-col" aria-label="روابط"><h4>المنصة</h4><a href="#/programs">البرامج الدراسية</a><a href="#/calendar">التقويم الأكاديمي</a><a href="#/courses">الدورات</a><a href="#/about">عن ${esc(st.name)}</a><a href="#/verify">التحقق من شهادة</a>${st.terms ? '<a href="#/terms">الشروط والخصوصية</a>' : ''}</nav>
    <div class="foot-col"><h4>تواصل معنا</h4>${wa ? `<a href="${waLink(wa)}" target="_blank" rel="noopener">${ic('whatsapp', 16)} <bdi dir="ltr">+${esc(wa)}</bdi></a>` : ''}${st.email ? `<a href="mailto:${esc(st.email)}">${ic('mail', 16)} <bdi dir="ltr">${esc(st.email)}</bdi></a>` : ''}${legacy ? `<span>${esc(st.contact)}</span>` : ''}<a href="#/contact">${ic('pen', 16)} أرسل رسالة</a></div>
  </div><div class="wrap foot-base"><span>© ${new Date().getFullYear()} ${esc(st.name)} — ${esc(st.tagline)}</span></div></footer>`;
}
function particles(cv) {
  if (reduceMotion || !cv) return;
  const ctx = cv.getContext('2d'), dpr = Math.min(devicePixelRatio || 1, 2); let w, h, raf, ps;
  const size = () => { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); ps = Array.from({ length: Math.max(18, Math.round(w / 26)) }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.7 + .4, v: Math.random() * .32 + .08, a: Math.random() * .5 + .2, p: Math.random() * 6.28 }));
  const tick = () => {
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#D9B873';
    for (const p of ps) { p.y -= p.v; p.p += .018; p.x += Math.sin(p.p) * .22; if (p.y < -6) { p.y = h + 6; p.x = Math.random() * w; } ctx.globalAlpha = p.a * (.55 + .45 * Math.sin(p.p * 2)); ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill(); }
    raf = requestAnimationFrame(tick);
  };
  addEventListener('resize', size); tick();
  S.cleanups.push(() => { cancelAnimationFrame(raf); removeEventListener('resize', size); });
}

/* ================= الموقع العام ================= */
async function viewHome() {
  const st = S.settings;
  const courses = (await safeList('courses')).filter(c => c.published).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const certs = await safeList('certificates');
  const lessons = courses.reduce((a, c) => a + (c.lessons || []).length, 0);
  const allC = await safeList('courses'), acad = planRows(allC), ij = ijazaRows(allC);
  return {
    over: true, docTitle: 'الرئيسية',
    html: `<section class="hero"><canvas id="particles"></canvas><div class="arches" aria-hidden="true"></div>
      <div class="wrap hero-grid">
        <div class="stagger">
          <span class="eyebrow">${esc(st.tagline)}</span>
          <h1 class="hero-title">${esc(st.name)}<span class="sub">علمٌ يُطلب بأناة، ويُبنى على أصول</span></h1>
          <p class="hero-lead">${esc(st.heroText)}</p>
          <div class="hero-cta"><a class="btn btn-brass" href="#/apply">قدّم الآن</a><a class="btn btn-ghost" href="#/programs">البرامج الدراسية</a>${S.user ? `<a class="btn btn-ghost" href="${S.user.isAdmin ? adminLink : '#/me'}">${S.user.isAdmin ? 'لوحة التحكم' : 'متابعة التعلّم'}</a>` : ''}</div>
          <blockquote class="ayah">﴿وَقُل رَّبِّ زِدْنِي عِلْمًا﴾ <cite>طه: ١١٤</cite></blockquote>
        </div>
        <div class="hero-art">${girihArt()}</div>
      </div></section>
      <section class="saying"><div class="wrap"><figure class="saying-card reveal">
        <div class="saying-orn" aria-hidden="true"><i></i>${starMark()}<i></i></div>
        <blockquote>«مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا، سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ»</blockquote>
        <figcaption>رواه مسلم</figcaption>
      </figure></div></section>
      ${programsTeaser(acad, ij)}
      <section class="section"><div class="wrap">
        <div class="stats reveal">
          <div class="stat"><b data-count="${acad.length}">0</b><span>مادة في البرنامج الأكاديمي</span></div><div class="stat"><b data-count="${courses.length}">0</b><span>دورة منشورة</span></div>
          <div class="stat"><b data-count="${lessons}">0</b><span>درس مرئي وصوتي ومكتوب</span></div>
          <div class="stat"><b data-count="${certs.length}">0</b><span>شهادة صادرة</span></div>
        </div>
      </div></section>
      <section class="section" style="padding-top:0"><div class="wrap">
        <div class="sec-head reveal"><div><h2>أحدث الدورات</h2><p>ابدأ بأي دورة، وتابع تقدّمك درساً بعد درس.</p></div><a class="btn btn-ghost" href="#/courses">كل الدورات</a></div>
        ${courses.length ? `<div class="grid-c">${courses.slice(0, 6).map(c => courseCard(c)).join('')}</div>` : `<div class="empty">${ic('book', 36)}<p>لا توجد دورات منشورة بعد.</p></div>`}
      </div></section>
      <section class="section" style="padding-top:0"><div class="wrap">
        <div class="sec-head reveal"><div><h2>كيف تتعلّم في ${esc(st.name)}</h2></div></div>
        <div class="ways reveal">
          <div class="way"><div class="glyph">${ic('play', 24)}</div><h3>دروس مرئية</h3><p>شروح مسجّلة تشاهدها في وقتك وتعيدها متى شئت.</p></div>
          <div class="way"><div class="glyph">${ic('audio', 24)}</div><h3>دروس صوتية</h3><p>استمع للمجالس والتطبيقات وأنت في طريقك.</p></div>
          <div class="way"><div class="glyph">${ic('text', 24)}</div><h3>متون ونصوص</h3><p>المتن مكتوباً بخط واضح، وملفات PDF للمراجعة.</p></div>
          <div class="way"><div class="glyph">${ic('award', 24)}</div><h3>اختبار وشهادة</h3><p>اختبار في نهاية كل دورة، وشهادة برمز تحقق عند النجاح.</p></div>
        </div>
      </div></section>
      <section class="section" style="padding-top:0"><div class="wrap">
        <div class="sec-head reveal"><div><h2>من التسجيل إلى الشهادة</h2></div></div>
        <div class="path reveal">
          <div class="step"><h3>قدّم طلب الالتحاق</h3><p>أنشئ حسابك واملأ طلب البرنامج الذي تريده، وتابع حالته من حسابك.</p></div>
          <div class="step"><h3>القبول والقيد</h3><p>بعد مراجعة الطلب يصدر رقمك الجامعي، وتسجّل في فصلك الدراسي فتُفتح لك مواده.</p></div>
          <div class="step"><h3>ادرس واختبر</h3><p>أتمّ دروس كل مادة واجتز اختبارها، لتصدر شهادتك برمز تحقق.</p></div>
        </div>
      </div></section>
      <section class="section" style="padding-top:0"><div class="wrap">
        <div class="band reveal"><svg class="deco" viewBox="0 0 40 40" fill="none" stroke="#C9A45C" stroke-width=".8"><rect x="8" y="8" width="24" height="24"/><rect x="8" y="8" width="24" height="24" transform="rotate(45 20 20)"/><circle cx="20" cy="20" r="6"/></svg>
          <div><h2>ابدأ طلب العلم اليوم</h2><p>${esc(st.about)}</p></div>
          <a class="btn btn-brass" href="#/programs">اطّلع على الخطة الدراسية</a></div>
      </div></section>`,
    mount() {
      particles($('#particles'));
      const g = $('#girih');
      if (g && !reduceMotion && matchMedia('(hover:hover)').matches) {
        const mv = e => { const x = (e.clientX / innerWidth - .5), y = (e.clientY / innerHeight - .5); g.style.transform = `translate(${x * -14}px,${y * -14}px) rotate(${x * 8}deg)`; };
        addEventListener('pointermove', mv); S.cleanups.push(() => removeEventListener('pointermove', mv));
      }
    }
  };
}

async function viewCourses() {
  const courses = (await safeList('courses')).filter(c => c.published).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const cats = [...new Set(courses.map(c => c.category).filter(Boolean))];
  const progs = PROGRAMS.filter(([k]) => courses.some(c => (c.program || '') === k));
  const startProg = new URLSearchParams(location.hash.split('?')[1] || '').get('p');
  return {
    docTitle: 'الدورات',
    html: `<section class="section" style="padding-top:48px"><div class="wrap">
      <div class="sec-head"><div><h2 style="font-size:clamp(2rem,4.4vw,3rem)">الدورات</h2><p>${courses.length} دورة في ${cats.length || 1} ${cats.length > 2 ? 'علوم' : 'علم'}.</p></div>
        <label class="searchbox">${ic('search', 18)}<span class="sr">بحث</span><input id="q" placeholder="ابحث باسم المادة أو الكتاب أو المؤلف"></label></div>
      ${progs.length > 1 ? `<div class="chips" id="progs" style="margin-bottom:10px"><button class="chip on" data-p="*">كل البرامج</button>${progs.map(([k, t]) => `<button class="chip" data-p="${k}">${t}</button>`).join('')}</div>
      <div class="chips" id="terms" style="margin-bottom:10px" hidden><button class="chip on" data-t="">كل الفصول</button>${[1, 2, 3, 4].map(t => `<button class="chip" data-t="${t}">${termLabel(t)}</button>`).join('')}</div>` : ''}
      <div class="chips" id="cats" style="margin-bottom:26px"><button class="chip on" data-c="">الكل</button>${cats.map(c => `<button class="chip" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>
      <div class="grid-c" id="grid"></div>
    </div></section>`,
    mount() {
      let cat = '', q = '', prog = '*', term = '';
      const draw = () => {
        const list = courses.filter(c => (prog === '*' || (c.program || '') === prog) && (!term || +c.term === +term) && (!cat || c.category === cat) && (!q || [c.title, c.summary, c.category, c.book, c.author].join(' ').includes(q)));
        if (prog === 'academy') list.sort(planSort);
        $('#grid').innerHTML = list.length ? list.map(c => courseCard(c)).join('') : `<div class="empty" style="grid-column:1/-1">${ic('search', 32)}<p>لا توجد دورات مطابقة. جرّب كلمة أخرى أو اختر «الكل».</p></div>`;
        enhance($('#grid'));
      };
      $('#cats').onclick = e => { const b = e.target.closest('.chip'); if (!b) return; $$('.chip', $('#cats')).forEach(x => x.classList.toggle('on', x === b)); cat = b.dataset.c; draw(); };
      $('#q').oninput = e => { q = e.target.value.trim(); draw(); };
      const pick = (box, attr, set) => box && (box.onclick = e => { const b = e.target.closest('.chip'); if (!b) return; $$('.chip', box).forEach(x => x.classList.toggle('on', x === b)); set(b.dataset[attr]); draw(); });
      pick($('#progs'), 'p', v => { prog = v; const tb = $('#terms'); tb.hidden = v !== 'academy'; if (v !== 'academy') { term = ''; $$('.chip', tb).forEach((x, i) => x.classList.toggle('on', !i)); } });
      pick($('#terms'), 't', v => { term = v; });
      if (startProg != null) $(`#progs [data-p="${startProg}"]`)?.click(); else draw();
    }
  };
}

async function viewCourse(id) {
  const c = await safeGet('courses', id);
  if (!c || (!c.published && !S.user?.isAdmin)) return notFound('الدورة غير موجودة أو لم تُنشر بعد.');
  const isStudent = S.user && !S.user.isAdmin;
  const enr = isStudent ? await safeGet('enrollments', `${S.user.uid}_${id}`) : null;
  /* مواد البرنامجين: التسجيل لمن قُبل في البرنامج ومستواه مطابق، بدل نافذة تسجيل الدورة */
  const progC = isAdmProg(c.program), rec = progC && isStudent && !enr ? await safeGet('records', `${S.user.uid}_${c.program}`) : null;
  const tm = await enrTerm(c, enr), xw = tm?.examLock ? examWindow(tm, c.id) : null;
  const lv = c.online && (enr || S.user?.isAdmin) ? (await safeGet('courseLive', id)) || {} : null, lst = lv ? liveState(lv) : null;
  const lessons = c.lessons || [], done = enr?.completed || [];
  const pct = lessons.length ? Math.round(lessons.filter(l => done.includes(l.id)).length / lessons.length * 100) : 0;
  const ex = c.exam || {}, nQ = (ex.questions || []).length;
  /* الامتحانات الرسمية للمادة: يراها الجميع، ويدخلها المسجّل فقط */
  const exams = (await safeList('exams', { courseId: id, published: true })).sort(examSort);
  const xs = !exams.length ? [] : enr ? await myExams(exams, S.user.uid) : exams.map(e => ({ e }));
  const myTot = enr && xs.some(x => x.gr) ? courseTotal(exams, e => xs.find(x => x.e === e)?.gr, +c.gradePass || 60) : null;
  const totalMin = lessons.reduce((a, l) => a + (+l.duration || 0), 0);
  const cont = lessons.find(l => !done.includes(l.id)) || lessons[0];
  /* البرنامج الأكاديمي: لا تسجيل ذاتي — الطالب يُسجَّل في مواد فصله تلقائياً عند قيده. الإجازات: لمن مساره مطابق */
  const es = c.program === 'academy' ? { open: false, state: 'always' } : progC ? { open: eligibleFor(c, rec), state: 'always' } : enrollState(c), started = hasStarted(c, tm), sAt = startOf(c, tm);
  const enrollBtn = es.open ? `<button class="btn btn-brass" data-enroll>سجّل في الدورة</button>` : '';
  const liveBtn = lv ? (lst.live && liveNowUrl(lv, lst) ? `<a class="btn btn-brass btn-join" href="${esc(liveNowUrl(lv, lst))}" target="_blank" rel="noopener">${ic('video', 17)} انضم إلى اللقاء الآن</a>` : `<button class="btn btn-ghost" data-golive>${ic('video', 17)} اللقاءات المباشرة</button>`) : '';
  const cta = S.user?.isAdmin ? `<a class="btn btn-brass" href="${adminLink}#/course/${c.id}">${ic('edit', 17)} تعديل الدورة</a>`
    : enr && c.online && !lessons.length ? liveBtn.replace('btn-ghost', 'btn-brass')
    : enr ? (started ? `<a class="btn btn-brass" href="#/learn/${c.id}/${cont?.id || ''}">${pct ? 'تابع التعلّم' : 'ابدأ الدورة'}</a>` : `<span class="pill-lite">${ic('check', 15)} أنت مسجّل — تبدأ الدراسة ${fmtDate(sAt)}</span>`)
    : enrollBtn;
  const gate = !enr && !S.user?.isAdmin && !es.open;
  const closeNote = !enr && es.open && es.closesAt ? `<p class="enroll-note">${ic('clock', 15)} يُغلق التسجيل ${fmtDate(es.closesAt)}</p>` : '';
  const regRow = c.program === 'academy' ? `<li><span class="n">${ic('shield', 15)}</span><div class="t">التسجيل<small>${tm ? `ضمن قيدك في ${esc(tm.name)}` : 'تلقائي لطلاب البرنامج المقيّدين في فصلها'}</small></div></li>`
    : progC ? `<li><span class="n">${ic('shield', 15)}</span><div class="t">القبول<small>لطلاب ${esc(programName(c.program))} المقبولين</small></div></li>` : es.state === 'always' ? '' : `<li><span class="n">${ic('calendar', 15)}</span><div class="t">التسجيل<small>${esc(enrollLabel(es))}</small></div></li>`;
  return {
    over: true, docTitle: c.title,
    html: `<section class="chero" style="${themeStyle(c)}"><div class="pat" style="${PAT_BG}"></div>
      <div class="wrap stagger" style="position:relative">
        <span class="eyebrow" style="color:#fff;opacity:.85">${c.program ? `${esc(programName(c.program))}${termLabel(c.term) ? ` — ${esc(termLabel(c.term))}` : ''}` : esc(c.category || 'عام')}</span>
        <h1>${esc(c.title)}</h1><p class="lead">${esc(c.summary)}</p>
        <div class="cmeta">${c.online ? `<span>${ic('video', 16)} لقاءات مباشرة${meetVia(c.livePlatform)}</span>` : ''}${lessons.length || !c.online ? `<span>${ic('play', 16)} ${lessons.length} دروس</span>` : ''}${totalMin ? `<span>${ic('clock', 16)} نحو ${totalMin} دقيقة</span>` : ''}${exams.length ? `<span>${ic('quiz', 16)} ${exams.length === 1 ? 'امتحان واحد' : exams.length === 2 ? 'امتحانان' : exams.length + ' امتحانات'}</span>` : nQ ? `<span>${ic('quiz', 16)} اختبار من ${nQ} أسئلة</span>` : ''}${c.level ? `<span>${ic('chart', 16)} ${esc(c.level)}</span>` : ''}${c.instructor ? `<span>${ic('user', 16)} ${esc(c.instructor)}</span>` : ''}</div>
        ${gate ? (progC ? progGate(c, rec) : enrollGate(es)) : `<div class="hero-cta">${cta}${enr && lessons.length ? liveBtn : ''}</div>${closeNote}`}
        ${enr ? `<div style="max-width:420px;margin-top:20px"><div class="bar" style="background:rgba(255,255,255,.2)"><i data-w="${pct}"></i></div><small>${pct}% مكتمل</small></div>` : ''}
      </div></section>
      <div class="wrap cgrid">
        <div style="display:grid;gap:24px;align-content:start">
          ${lv ? livePanel(c, lv) : ''}
          ${xs.length ? `<div class="panel reveal" id="exams"><div class="toolbar" style="margin-bottom:6px"><h2 class="grow" style="margin:0">الامتحانات</h2>${myTot && !myTot.missing ? `<span class="pill ${myTot.passed ? 'ok' : 'no'}">نتيجتك في المادة: ${myTot.total}% — ${myTot.passed ? 'ناجح' : 'لم ينجح'}</span>` : ''}</div>${examRows(xs, !!enr)}${!enr ? `<p class="muted" style="margin-top:10px">${ic('lock', 14)} يدخل الامتحانات الطلاب المسجّلون في المادة.</p>` : ''}</div>` : ''}
          ${c.description ? `<div class="panel reveal"><h2>عن الدورة</h2><p class="prose">${esc(c.description)}</p></div>` : ''}
          <div class="panel reveal"><h2>محتوى الدورة</h2>
            ${lessons.length ? `<ol class="lessons">${lessons.map((l, i) => `<li><span class="n">${done.includes(l.id) ? ic('check', 15) : i + 1}</span><div class="t">${enr ? `<a href="#/learn/${c.id}/${l.id}">${esc(l.title)}</a>` : esc(l.title)}<small>${TYPE_LBL[l.type] || ''}${l.duration ? ` — ${esc(l.duration)} دقيقة` : ''}</small></div>${ic(enr ? TYPE_IC[l.type] : 'lock', 18)}</li>`).join('')}</ol>` : `<p class="muted">${c.online ? 'تُقدَّم هذه الدورة عبر اللقاءات المباشرة.' : 'لم تُضف دروس بعد.'}</p>`}
          </div>
        </div>
        <aside><div class="panel sticky reveal">
          <h3>تفاصيل</h3>
          <ol class="lessons" style="margin-bottom:16px">
            ${c.book ? `<li><span class="n">${ic('book', 15)}</span><div class="t">الكتاب المقرّر<small>${esc(c.book)}${c.author ? ` — ${esc(c.author)}` : ''}</small></div></li>` : ''}${c.hours ? `<li><span class="n">${ic('clock', 15)}</span><div class="t">عدد الساعات<small>${esc(c.hours)} ساعات</small></div></li>` : ''}
            ${regRow}${c.online ? `<li><span class="n">${ic('video', 15)}</span><div class="t">لقاءات مباشرة${meetVia(c.livePlatform)}<small>${esc(c.liveSchedule || (enr ? 'الرابط في قسم اللقاءات' : 'يظهر رابط الدخول بعد التسجيل'))}</small></div></li>` : ''}${sAt ? `<li><span class="n">${ic('play', 15)}</span><div class="t">بداية الدراسة<small>${fmtDate(sAt)}</small></div></li>` : ''}${xw ? `<li><span class="n">${ic('calendar', 15)}</span><div class="t">موعد الامتحان<small>${dateRange(xw.from, xw.to)}</small></div></li>` : ''}${c.durationLabel ? `<li><span class="n">${ic('clock', 15)}</span><div class="t">مدة الدورة<small>${esc(c.durationLabel)}</small></div></li>` : ''}
            <li><span class="n">${ic('play', 15)}</span><div class="t">الدروس<small>${lessons.length}</small></div></li>
            ${exams.length ? `<li><span class="n">${ic('quiz', 15)}</span><div class="t">الامتحانات<small>${[...new Set(exams.map(e => examKindName(e.kind)))].join('، ')} — النجاح في المادة من ${+c.gradePass || 60}%</small></div></li>${nQ ? `<li><span class="n">${ic('pen', 15)}</span><div class="t">اختبار تدريبي<small>${nQ} أسئلة للمراجعة الذاتية</small></div></li>` : ''}`
              : `<li><span class="n">${ic('quiz', 15)}</span><div class="t">الاختبار النهائي<small>${nQ ? `${nQ} أسئلة — النجاح من ${ex.passScore || 60}%` : 'لا يوجد — تصدر الشهادة بإتمام الدروس'}</small></div></li>`}
            <li><span class="n">${ic('award', 15)}</span><div class="t">الشهادة<small>${exams.length ? 'تصدر برمز تحقق بعد اجتياز المادة واعتماد النتائج' : 'تصدر برمز تحقق عند الإتمام'}</small></div></li>
          </ol>${gate ? (progC ? progGate(c, rec, true) : enrollGate(es, true)) : cta.replace('btn-brass', 'btn-primary btn-block')}
        </div></aside>
      </div>`,
    mount() {
      runCountdowns(); mountLive(c, lv);
      $$('[data-enroll]').forEach(b => b.onclick = async () => {
        if (!S.user) { sessionStorage.setItem('bayan_next', `/course/${id}`); toast('سجّل دخولك أولاً للتسجيل في الدورة'); go('/login'); return; }
        if (!progC && !enrollState(c).open) { toast('انتهت فترة التسجيل في هذه الدورة', 'err'); route(); return; }
        b.disabled = true;
        try {
          await DB.set('enrollments', `${S.user.uid}_${id}`, { uid: S.user.uid, courseId: id, userName: S.user.name, courseTitle: c.title, completed: [], enrolledAt: Date.now() });
          toast('تم تسجيلك في الدورة', 'ok');
          if (courseStarted(c)) go(`/learn/${id}/${lessons[0]?.id || ''}`); else route();
        } catch (e) { toast(/permission|insufficient/i.test(e.message) ? (progC ? 'هذه المادة لطلاب البرنامج المقبولين في مستواها' : 'التسجيل في هذه الدورة مغلق حالياً') : 'تعذّر التسجيل: ' + e.message, 'err'); b.disabled = false; }
      });
    }
  };
}

async function viewLearn(cid, lid) {
  const c = await safeGet('courses', cid); if (!c) return notFound('الدورة غير موجودة.');
  const enr = await safeGet('enrollments', `${S.user.uid}_${cid}`);
  if (!enr) { go(`/course/${cid}`); return null; }
  const tm = await enrTerm(c, enr); if (!hasStarted(c, tm)) return notStartedView(c, startOf(c, tm));
  const lessons = c.lessons || []; if (!lessons.length) return notFound('لا توجد دروس في هذه الدورة بعد.');
  let done = enr.completed || [];
  const idx = Math.max(0, lessons.findIndex(l => l.id === lid)), l = lessons[idx];
  const pct = Math.round(lessons.filter(x => done.includes(x.id)).length / lessons.length * 100);
  const hasExam = (c.exam?.questions || []).length > 0;
  const isDone = done.includes(l.id), last = idx === lessons.length - 1;
  const lv = c.online ? await safeGet('courseLive', cid) : null;
  return {
    docTitle: l.title,
    html: `<div class="wrap learn">
      <div>
        <a class="muted" href="#/course/${c.id}" style="display:inline-flex;gap:6px;align-items:center;margin-bottom:12px">${ic('prev', 16)} ${esc(c.title)}</a>
        <article class="player">${mediaEmbed(l)}
          <div class="lesson-body">
            <small class="muted">الدرس ${idx + 1} من ${lessons.length} — ${TYPE_LBL[l.type] || ''}</small>
            <h1>${esc(l.title)}</h1>
            ${l.content ? `<div class="${l.type === 'text' ? 'matn' : 'prose'}" style="${l.type === 'text' ? '' : 'margin-top:12px'}">${esc(l.content)}</div>` : ''}
            <div class="lesson-nav">
              ${idx > 0 ? `<a class="btn btn-ghost" href="#/learn/${c.id}/${lessons[idx - 1].id}">${ic('prev', 17)} السابق</a>` : '<span></span>'}
              <button class="btn btn-primary" id="doneBtn">${isDone ? (last ? (hasExam ? 'الانتقال إلى الاختبار' : +c.offExams ? 'العودة إلى المادة' : 'عرض الشهادة') : 'الدرس التالي') : (last ? 'أتممت الدرس — إنهاء الدورة' : 'أتممت الدرس — التالي')} ${ic('next', 17)}</button>
            </div>
          </div></article>
      </div>
      <aside><div class="panel sticky" style="padding:18px">
        ${lv ? liveMini(c, lv) : ''}<h3 style="font-size:1.1rem;margin-bottom:8px">تقدّمك</h3>
        <div class="bar"><i data-w="${pct}" id="pbar"></i></div><small class="muted" id="ptxt">${pct}% مكتمل</small>
        <nav class="side-list" style="margin-top:14px">${lessons.map((x, i) => `<a href="#/learn/${c.id}/${x.id}" class="${x.id === l.id ? 'on' : ''}"><span class="tick ${done.includes(x.id) ? 'done' : ''}" data-tick="${x.id}">${done.includes(x.id) ? ic('check', 14) : i + 1}</span><span style="flex:1;font-size:.94rem">${esc(x.title)}<br><small class="muted">${TYPE_LBL[x.type] || ''}</small></span></a>`).join('')}
        ${hasExam ? `<a href="#/exam/${c.id}"><span class="tick">${ic('quiz', 14)}</span><span style="flex:1;font-size:.94rem">${+c.offExams ? 'اختبار تدريبي' : 'الاختبار النهائي'}</span></a>` : ''}${+c.offExams ? `<a href="#/course/${c.id}"><span class="tick">${ic('award', 14)}</span><span style="flex:1;font-size:.94rem">امتحانات المادة</span></a>` : ''}</nav>
      </div></aside></div>`,
    mount() {
      mountLive(c, lv);
      $('#doneBtn').onclick = async e => {
        const b = e.currentTarget; b.disabled = true;
        try {
          if (!done.includes(l.id)) {
            done = [...done, l.id];
            await DB.update('enrollments', enr.id, { uid: S.user.uid, completed: done, lastLesson: l.id, lastAt: Date.now() });
            const t = $(`[data-tick="${l.id}"]`); if (t) { t.classList.add('done', 'done-pop'); t.innerHTML = ic('check', 14); }
            const p = Math.round(lessons.filter(x => done.includes(x.id)).length / lessons.length * 100);
            $('#pbar').style.width = p + '%'; $('#ptxt').textContent = p + '% مكتمل';
            await new Promise(r => setTimeout(r, 450));
          }
          if (!last) return go(`/learn/${c.id}/${lessons[idx + 1].id}`);
          if (lessons.some(x => !done.includes(x.id))) { toast('بقيت دروس لم تُتمّها بعد'); const n = lessons.find(x => !done.includes(x.id)); return go(`/learn/${c.id}/${n.id}`); }
          if (hasExam) return go(`/exam/${c.id}`);
          if (+c.offExams) { toast('أتممت الدروس — تصدر الشهادة بعد اجتياز امتحانات المادة', 'ok'); return go(`/course/${c.id}`); }
          const code = await issueCert(c, null); toast('أتممت الدورة — صدرت شهادتك', 'ok'); go(`/cert/${code}`);
        } catch (err) { toast('تعذّر الحفظ: ' + err.message, 'err'); b.disabled = false; }
      };
    }
  };
}

async function issueCert(c, score) {
  const ex = await safeList('certificates', { uid: S.user.uid, courseId: c.id });
  if (ex.length) return ex[0].id;
  const code = `BYN-${rnd4()}-${rnd4()}`, prof = await safeGet('users', S.user.uid);
  await DB.set('certificates', code, { uid: S.user.uid, courseId: c.id, name: S.user.name, nameEn: prof?.nameEn || '', courseTitle: c.title, courseTitleEn: c.titleEn || '', instructor: c.instructor || '', instructorEn: c.instructorEn || '', certType: c.certType || '', score: score ?? null, issuedAt: Date.now() });
  return code;
}

async function viewExam(cid) {
  const c = await safeGet('courses', cid); const ex = c?.exam;
  if (!c || !ex?.questions?.length) return notFound('لا يوجد اختبار لهذه الدورة.');
  const enr = await safeGet('enrollments', `${S.user.uid}_${cid}`); if (!enr) { go(`/course/${cid}`); return null; }
  const tm = await enrTerm(c, enr); if (!hasStarted(c, tm)) return notStartedView(c, startOf(c, tm));
  /* فترة الامتحانات: إن فعّلت الإدارة القفل في الفصل، يُفتح الاختبار في موعد امتحان المادة أو فترة امتحانات الفصل فقط */
  const xw = tm?.examLock ? examWindow(tm, cid) : null;
  const lessons = c.lessons || [], done = enr.completed || [];
  const lessonsOk = !ex.requireLessons || lessons.every(l => done.includes(l.id));
  const attempts = (await safeList('attempts', { uid: S.user.uid, courseId: cid })).sort((a, b) => b.at - a.at);
  const passedA = attempts.find(a => a.passed), mode = revealMode(ex), hidden = mode === 'hidden';
  /* مادة لها امتحانات رسمية: هذا الاختبار للتدريب فقط ولا يُصدر شهادة */
  const practice = +c.offExams > 0;
  const myCert = hidden ? (await safeList('certificates', { uid: S.user.uid, courseId: cid }))[0] : null;
  const left = +ex.maxAttempts ? +ex.maxAttempts - attempts.length : Infinity;
  return {
    docTitle: 'اختبار: ' + c.title,
    html: `<div class="wrap exam-wrap"><a class="muted" href="#/course/${c.id}" style="display:inline-flex;gap:6px;align-items:center;margin-bottom:12px">${ic('prev', 16)} ${esc(c.title)}</a><div id="exam"></div></div>`,
    mount() {
      const box = $('#exam'); let timer = null; S.cleanups.push(() => clearInterval(timer));
      const qs = ex.shuffle ? [...ex.questions].sort(() => Math.random() - .5) : [...ex.questions];
      const ans = {}; let cur = 0, endAt = 0, submitted = false;
      const start = () => {
        const best = attempts.reduce((m, a) => Math.max(m, a.score), 0);
        let msg = '', can = true;
        if (hidden) { if (attempts.length) msg = `<p class="pill mut" style="margin-bottom:12px">سلّمت هذا الاختبار ${attempts.length === 1 ? 'مرة واحدة' : attempts.length + ' مرات'}</p>`; }
        else if (passedA) { msg = `<p class="pill ok" style="margin-bottom:12px">ناجح بدرجة ${passedA.score}%</p>`; }
        if (!lessonsOk) { can = false; msg += `<p class="form-err">أتمم جميع دروس الدورة أولاً ليُفتح الاختبار.</p>`; }
        else if (left <= 0) { can = false; msg += `<p class="form-err">استنفدت عدد المحاولات المتاحة. تواصل مع الإدارة لإعادة فتح الاختبار.</p>`; }
        else if (xw && Date.now() < xw.from) { can = false; msg += `<p class="form-err">${ic('calendar', 15)} يُفتح الاختبار في موعد الامتحان: ${dateRange(xw.from, xw.to)}</p>`; }
        else if (xw && Date.now() > xw.to) { can = false; msg += `<p class="form-err">انتهى موعد هذا الامتحان (${dateRange(xw.from, xw.to)}). تواصل مع الإدارة.</p>`; }
        else if (xw) msg += `<p class="pill warn" style="margin-bottom:12px">الامتحان متاح حتى ${fmtDT(xw.to)}</p>`;
        box.innerHTML = `<div class="qcard" style="text-align:center">${ic('quiz', 44)}<h2 style="font-family:var(--display);font-size:1.8rem;margin:10px 0 6px">${practice ? 'اختبار تدريبي' : 'الاختبار النهائي'}</h2>${practice ? `<p class="pill mut" style="margin-bottom:8px">للمراجعة الذاتية — لا يدخل في درجة المادة، وامتحاناتها الرسمية في <a href="#/course/${c.id}" style="color:var(--teal)">صفحة المادة</a></p>` : ''}
          <p class="muted">${esc(c.title)}</p>
          <ol class="lessons" style="max-width:380px;margin:20px auto;text-align:start">
            <li><span class="n">${ic('quiz', 15)}</span><div class="t">عدد الأسئلة<small>${qs.length}</small></div></li>
            <li><span class="n">${ic('clock', 15)}</span><div class="t">المدة<small>${+ex.duration ? ex.duration + ' دقيقة' : 'مفتوحة'}</small></div></li>
            <li><span class="n">${ic('award', 15)}</span><div class="t">درجة النجاح<small>${ex.passScore || 60}%</small></div></li>
            <li><span class="n">${ic('key', 15)}</span><div class="t">المحاولات المتبقية<small>${left === Infinity ? 'غير محدودة' : left}${attempts.length && !hidden ? ` — أفضل درجة: ${best}%` : ''}</small></div></li>
          </ol>${msg}
          <div class="hero-cta" style="justify-content:center">${can ? `<button class="btn btn-primary" id="go">${(hidden ? attempts.length : passedA) ? 'إعادة الاختبار' : 'ابدأ الاختبار'}</button>` : ''}${hidden ? (myCert ? `<a class="btn btn-brass" href="#/cert/${myCert.id}">${ic('award', 17)} عرض الشهادة</a>` : '') : passedA && !practice ? `<button class="btn btn-brass" id="cert">${ic('award', 17)} عرض الشهادة</button>` : ''}</div></div>`;
        $('#go') && ($('#go').onclick = begin);
        $('#cert') && ($('#cert').onclick = async () => { const code = await issueCert(c, passedA.score); go(`/cert/${code}`); });
      };
      const begin = () => {
        if (+ex.duration) { endAt = Date.now() + ex.duration * 60000; timer = setInterval(tick, 1000); }
        renderQ();
      };
      const tick = () => {
        const s = Math.max(0, Math.round((endAt - Date.now()) / 1000)), t = $('#timer');
        if (t) { t.lastChild.textContent = ` ${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; t.classList.toggle('low', s <= 60); }
        if (s <= 0) { clearInterval(timer); toast('انتهى الوقت — سُلّمت إجاباتك'); submit(); }
      };
      const renderQ = () => {
        const q = qs[cur], letters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
        box.innerHTML = `<div class="exam-top"><strong>السؤال ${cur + 1} من ${qs.length}</strong>${+ex.duration ? `<span class="timer" id="timer">${ic('clock', 16)}<span> --:--</span></span>` : ''}</div>
          <div class="dots">${qs.map((x, i) => `<button class="${ans[x.id] != null ? 'ans' : ''} ${i === cur ? 'cur' : ''}" data-i="${i}" aria-label="السؤال ${i + 1}">${i + 1}</button>`).join('')}</div>
          <div class="qcard"><h2>${esc(q.text)}</h2><div class="opts">${q.options.map((o, i) => `<button class="opt ${ans[q.id] === i ? 'sel' : ''}" data-o="${i}"><span class="k">${letters[i]}</span><span>${esc(o)}</span></button>`).join('')}</div>
          <div class="lesson-nav">${cur > 0 ? `<button class="btn btn-ghost" id="pv">${ic('prev', 17)} السابق</button>` : '<span></span>'}${cur < qs.length - 1 ? `<button class="btn btn-primary" id="nx">التالي ${ic('next', 17)}</button>` : `<button class="btn btn-brass" id="sb">تسليم الإجابات</button>`}</div></div>`;
        if (endAt) tick();
        $$('.opt', box).forEach(b => b.onclick = () => { ans[q.id] = +b.dataset.o; $$('.opt', box).forEach(x => x.classList.toggle('sel', x === b)); $(`.dots [data-i="${cur}"]`).classList.add('ans'); });
        $$('.dots button', box).forEach(b => b.onclick = () => { cur = +b.dataset.i; renderQ(); });
        $('#pv') && ($('#pv').onclick = () => { cur--; renderQ(); });
        $('#nx') && ($('#nx').onclick = () => { cur++; renderQ(); });
        $('#sb') && ($('#sb').onclick = async () => {
          const miss = qs.filter(x => ans[x.id] == null).length;
          if (miss && !(await confirmBox(`لم تُجب عن ${miss} ${miss === 1 ? 'سؤال' : 'أسئلة'}. هل تريد التسليم الآن؟`, 'تسليم'))) return;
          submit();
        });
      };
      const submit = async () => {
        if (submitted) return; submitted = true; clearInterval(timer);
        const correct = qs.filter(q => ans[q.id] === q.answer).length, score = Math.round(correct / qs.length * 100), passed = score >= (+ex.passScore || 60);
        box.innerHTML = `<div class="loading" style="min-height:300px"><svg class="loader" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${I.star}</svg></div>`;
        const rec = { uid: S.user.uid, userName: S.user.name, courseId: c.id, courseTitle: c.title, score, correct, total: qs.length, passed, at: Date.now(), answers: ans }, aid = genId();
        if (hidden) {
          // وضع «حفظ فقط»: لا درجة ولا تفاصيل، رسالة تأكيد فقط
          const save = async () => {
            box.innerHTML = `<div class="loading" style="min-height:300px"><svg class="loader" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${I.star}</svg></div>`;
            try {
              await DB.set('attempts', aid, rec);
              if (passed && ex.autoCert && !practice) await issueCert(c, null).catch(() => {});
              box.innerHTML = `<div class="qcard result saved"><div class="saved-ic">${ic('check', 46)}</div><h2>تم حفظ الاختبار بنجاح</h2><p class="muted">سُلّمت إجاباتك وحُفظت لدى إدارة الدورة. جزاك الله خيراً.</p>
                <div class="hero-cta" style="justify-content:center"><a class="btn btn-primary" href="#/course/${c.id}">العودة إلى الدورة</a><a class="btn btn-ghost" href="#/me">حسابي</a></div></div>`;
            } catch (e) {
              box.innerHTML = `<div class="qcard result"><div class="saved-ic err">${ic('x', 46)}</div><h2>لم يُحفظ الاختبار</h2><p class="muted">${esc(e.message)}<br>تحقق من الاتصال ثم أعد المحاولة؛ إجاباتك ما زالت محفوظة في هذه الصفحة.</p><div class="hero-cta" style="justify-content:center"><button class="btn btn-primary" id="retry">إعادة الحفظ</button></div></div>`;
              $('#retry').onclick = save;
            }
          };
          return save();
        }
        let code = null;
        try {
          await DB.set('attempts', aid, rec);
          if (passed && !practice) code = await issueCert(c, score);
        } catch (e) { toast('تعذّر حفظ النتيجة: ' + e.message, 'err'); }
        const C = 2 * Math.PI * 54, col = passed ? 'var(--ok)' : 'var(--danger)';
        box.innerHTML = `<div class="qcard result">
          <svg class="ring" width="150" height="150" viewBox="0 0 130 130"><circle cx="65" cy="65" r="54" fill="none" stroke="var(--mist)" stroke-width="10"/><circle id="arc" cx="65" cy="65" r="54" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" transform="rotate(-90 65 65)"/><text x="65" y="74" text-anchor="middle" font-size="28" font-weight="700" fill="currentColor" font-family="Reem Kufi">${score}%</text></svg>
          <h2>${passed ? 'بارك الله فيك، نجحت' : 'لم تبلغ درجة النجاح هذه المرة'}</h2>
          <p class="muted">أجبت إجابة صحيحة عن ${correct} من ${qs.length}. درجة النجاح ${ex.passScore || 60}%.</p>
          <div class="hero-cta" style="justify-content:center">${code ? `<a class="btn btn-brass" href="#/cert/${code}">${ic('award', 17)} عرض شهادتك</a>` : `<a class="btn btn-primary" href="#/learn/${c.id}/${lessons[0]?.id || ''}">مراجعة الدروس</a>`}<a class="btn btn-ghost" href="#/me">حسابي</a></div>
          ${reviewHtml(qs, ans, revealMode(ex))}
        </div>`;
        requestAnimationFrame(() => requestAnimationFrame(() => { const a = $('#arc'); if (a) a.style.strokeDashoffset = C * (1 - score / 100); }));
      };
      start();
    }
  };
}

function reviewHtml(qs, ans, mode) {
  if (mode === 'none') return '';
  const note = mode === 'mark' ? '<p class="muted" style="margin-bottom:4px">تظهر إجابتك في كل سؤال، صحيحة أو خاطئة، دون كشف الإجابة الصحيحة.</p>' : '';
  return `<div class="review">${note}${qs.map((q, i) => {
    const a = ans[q.id], ok = a === q.answer;
    const tag = mode === 'mark' ? `<span class="pill ${a == null ? 'mut' : ok ? 'ok' : 'no'}" style="margin-inline-start:8px">${a == null ? 'لم تُجب' : ok ? 'صحيحة' : 'خاطئة'}</span>` : '';
    const opts = q.options.map((o, j) => {
      const cls = mode === 'full' ? (j === q.answer ? 'right' : a === j ? 'wrong' : '') : (a === j ? (ok ? 'right' : 'wrong') : '');
      const mk = mode === 'full' ? (j === q.answer ? ic('check', 14) : a === j ? ic('x', 14) : '') : (a === j ? ic(ok ? 'check' : 'x', 14) : '');
      return `<div class="opt ${cls}" style="cursor:default"><span class="k">${mk}</span><span>${esc(o)}</span></div>`;
    }).join('');
    return `<div class="ritem" style="display:block"><strong>${i + 1}. ${esc(q.text)}</strong>${tag}<div class="opts" style="margin-top:10px">${opts}</div></div>`;
  }).join('')}</div>`;
}

/* ================= الامتحانات الرسمية (الطالب) =================
   الأسئلة تُقرأ من examPapers في موعد الامتحان فقط، والإجابات الصحيحة ليست عند الطالب أصلاً.
   وقت البدء والتسليم من السيرفر (serverTimestamp) والقواعد ترفض التسليم بعد انتهاء المدة. التصحيح عند الإدارة. */
/* رسائل أخطاء بدء الامتحان: رسائل السيرفر عربية أصلاً (HttpsError)، وغيابه يعني أن الدوال لم تُنشر */
const examErr = err => {
  const code = String(err?.code || '').replace('functions/', ''), msg = String(err?.message || '');
  if (['not-found', 'internal', 'unavailable'].includes(code) && !/[\u0600-\u06FF]/.test(msg)) return 'خدمة الامتحانات على السيرفر غير متاحة الآن — أعد المحاولة بعد قليل أو تواصل مع الإدارة';
  if (/permission|insufficient/i.test(msg)) return 'الامتحان غير متاح لك الآن — تحقق من موعده';
  return msg || 'تعذّر بدء الامتحان';
};
const loaderHtml = (h = 300) => `<div class="loading" style="min-height:${h}px"><svg class="loader" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${I.star}</svg></div>`;
/* حالة الطالب في امتحان لعرضها في القوائم */
function myExamState(e, sit, gr) {
  if (e.kind === 'oral') return gr ? [gr.passed ? `${oralRate(gr.rate)?.[1] || 'اجتاز'}` : 'لم يجتز', gr.passed ? 'ok' : 'no'] : [examPhase(e) === 'soon' ? 'موعده قادم' : 'بانتظار التقييم', 'mut'];
  if (gr) return [`${gr.score}% — ${gr.passed ? 'ناجح' : 'لم ينجح'}`, gr.passed ? 'ok' : 'no'];
  if (sit) { const exp = sit.status === 'started' && sitDeadline(e, sit) < Date.now(); return sit.status === 'submitted' || exp ? ['سُلّم — بانتظار النتيجة', 'warn'] : ['بدأته — لم تسلّمه', 'warn']; }
  return EXAM_PH[examPhase(e)];
}
function examRows(list, linked) {
  return `<ol class="lessons xrows">${list.map(({ e, sit, gr }) => { const [t, cls] = myExamState(e, sit, gr);
    const inner = `<span class="n">${ic(EXAM_KINDS[e.kind]?.[1] || 'quiz', 15)}</span><div class="t">${esc(e.title || examKindName(e.kind))} ${e.title && e.title !== examKindName(e.kind) ? `<span class="muted" style="font-size:.8rem">(${examKindName(e.kind)})</span>` : ''}<small>${e.kind === 'oral' ? (+e.opensAt ? `الموعد: ${dateRange(e.opensAt, e.closesAt)}` : 'يحدّد الشيخ موعده') : `${examWhen(e)}${+e.duration ? ` — ${e.duration} دقيقة` : ''}`}${+e.weight ? ` — ${e.weight}% من الدرجة` : ''}</small></div>${linked ? `<span class="pill ${cls}">${esc(t)}</span>` : ''}`;
    return `<li>${linked ? `<a class="xrow" href="#/test/${e.id}">${inner}</a>` : `<div class="xrow">${inner}</div>`}</li>`; }).join('')}</ol>`;
}
async function myExams(exams, uid) {
  return Promise.all(exams.map(async e => ({ e, sit: e.kind === 'oral' ? null : await safeGet('sittings', `${e.id}_${uid}`), gr: e.resultsOut ? await safeGet('grades', `${e.id}_${uid}`) : null })));
}

async function viewTest(eid) {
  const e = await safeGet('exams', eid);
  if (!e || !e.published) return notFound('الامتحان غير موجود أو لم يُنشر بعد.');
  const c = await safeGet('courses', e.courseId); if (!c) return notFound('المادة غير موجودة.');
  const uid = S.user.uid, sid = `${eid}_${uid}`;
  const [enr, sit0, acc, gr] = await Promise.all([safeGet('enrollments', `${uid}_${e.courseId}`), e.kind === 'oral' ? null : safeGet('sittings', sid), e.kind === 'makeup' ? safeGet('examAccess', sid) : null, e.resultsOut ? safeGet('grades', sid) : null]);
  if (!enr) { toast('هذا الامتحان لطلاب المادة المسجّلين'); go(`/course/${e.courseId}`); return null; }
  const head = `<a class="muted" href="#/course/${c.id}" style="display:inline-flex;gap:6px;align-items:center;margin-bottom:12px">${ic('prev', 16)} ${esc(c.title)}</a>`;
  const facts = (rows) => `<ol class="lessons" style="max-width:420px;margin:20px auto;text-align:start">${rows.filter(Boolean).map(([i, t, v]) => `<li><span class="n">${ic(i, 15)}</span><div class="t">${t}<small>${v}</small></div></li>`).join('')}</ol>`;
  const noteHtml = e.note ? `<div class="xnote">${ic('info', 16)}<p>${esc(e.note)}</p></div>` : '';
  return {
    docTitle: `${examKindName(e.kind)}: ${c.title}`,
    html: `<div class="wrap exam-wrap">${head}<div id="exam">${loaderHtml()}</div></div>`,
    mount() {
      const box = $('#exam'); let sit = sit0, timer = null, saver = null, dirty = false, busy = false, skew = 0;
      S.cleanups.push(() => { clearInterval(timer); clearInterval(saver); removeEventListener('beforeunload', guard); });
      const guard = ev => { if (sit?.status === 'started' && !busy) { ev.preventDefault(); ev.returnValue = ''; } };
      const now = () => Date.now() + skew;
      const card = (icon, title, body, btns = '') => `<div class="qcard" style="text-align:center">${ic(icon, 44)}<h2 style="font-family:var(--display);font-size:1.8rem;margin:10px 0 6px">${title}</h2><p class="muted">${esc(c.title)} — ${kindPill(e.kind)}</p>${body}${btns ? `<div class="hero-cta" style="justify-content:center">${btns}</div>` : ''}</div>`;
      const backBtn = `<a class="btn btn-ghost" href="#/course/${c.id}">العودة إلى المادة</a>`;

      /* ===== التقييم الشفهي: يسجّله الشيخ من لوحة التحكم ===== */
      if (e.kind === 'oral') {
        const r = gr && oralRate(gr.rate);
        box.innerHTML = card('audio', esc(e.title || 'التقييم الشفهي'), facts([
          ['calendar', 'الموعد', +e.opensAt ? dateRange(e.opensAt, e.closesAt) : 'يحدّده الشيخ ويُبلغك به'], e.examiner && ['user', 'المقيِّم', esc(e.examiner)],
          ['info', 'طريقة التقييم', 'عرض وسماع مباشر على الشيخ، ويُسجَّل التقدير في المنصة'], +e.weight && ['chart', 'الوزن', `${e.weight}% من درجة المادة`]]) + noteHtml
          + (gr ? `<div class="oral-res ${gr.passed ? 'ok' : 'no'}"><b>${esc(r?.[1] || '—')}</b>${gr.score != null ? `<span>${gr.score}%</span>` : ''}${gr.portion ? `<small>المقدار: ${esc(gr.portion)}</small>` : ''}${gr.examiner ? `<small>المقيِّم: ${esc(gr.examiner)} — ${fmtDate(gr.heardAt)}</small>` : ''}${gr.notes ? `<p>${esc(gr.notes)}</p>` : ''}</div>`
            : `<p class="pill mut">${e.resultsOut ? 'لم يُسجَّل تقييمك بعد' : 'تُعلن النتيجة بعد اعتمادها'}</p>`), backBtn);
        return;
      }
      /* ===== الإكمالي لمن قرّرته الإدارة فقط ===== */
      if (e.kind === 'makeup' && !acc && !sit) { box.innerHTML = card('key', esc(e.title || 'الامتحان الإكمالي'), `<p class="form-err" style="margin-top:16px">هذا الامتحان لمن تقرّر له الإكمالي في المادة. إن كنت تراه خطأً فتواصل مع الإدارة.</p>`, backBtn); return; }

      /* ===== بعد التسليم: إيصال التسليم والنتيجة إن نُشرت ===== */
      const doneView = (late) => {
        if (gr) {
          const C = 2 * Math.PI * 54, col = gr.passed ? 'var(--ok)' : 'var(--danger)';
          box.innerHTML = `<div class="qcard result"><svg class="ring" width="150" height="150" viewBox="0 0 130 130"><circle cx="65" cy="65" r="54" fill="none" stroke="var(--mist)" stroke-width="10"/><circle id="arc" cx="65" cy="65" r="54" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}" transform="rotate(-90 65 65)"/><text x="65" y="74" text-anchor="middle" font-size="26" font-weight="700" fill="currentColor" font-family="Reem Kufi">${gr.score}%</text></svg>
            <h2>${gr.passed ? 'بارك الله فيك، نجحت' : 'لم تبلغ درجة النجاح'}</h2><p class="muted">${esc(e.title || examKindName(e.kind))} — حصلت على ${gr.points} من ${gr.total}، والنجاح من ${e.passScore || 60}%.</p>
            ${(gr.rows || []).length ? `<div class="review"><div class="mrows">${gr.rows.map((r, i) => `<div class="mrow"><span>السؤال ${i + 1} <small class="muted">${Q_TYPES[r.type] || ''}</small></span><b class="${r.got >= r.max ? 'ok' : r.got ? '' : 'no'}">${r.got ?? '—'} / ${r.max}</b>${r.note ? `<p>${esc(r.note)}</p>` : ''}</div>`).join('')}</div></div>` : ''}
            ${gr.feedback ? `<div class="xnote" style="margin-top:16px">${ic('pen', 16)}<p>${esc(gr.feedback)}</p></div>` : ''}
            <div class="hero-cta" style="justify-content:center">${backBtn}<a class="btn btn-ghost" href="#/me">حسابي</a></div></div>`;
          requestAnimationFrame(() => requestAnimationFrame(() => { const a = $('#arc'); if (a) a.style.strokeDashoffset = C * (1 - Math.min(100, gr.score) / 100); }));
          return;
        }
        const at = tsMs(sit.submittedAt) || tsMs(sit.savedAt);
        box.innerHTML = `<div class="qcard result saved"><div class="saved-ic">${ic('check', 46)}</div><h2>${late ? 'انتهى وقت الامتحان' : 'سُلّمت إجاباتك'}</h2>
          <p class="muted">${late ? `حُفظت آخر إجاباتك تلقائياً${at ? ` (${fmtDT(at)})` : ''} وستُصحَّح كما هي.` : `استلمت الإدارة إجاباتك${at ? ` في ${fmtDT(at)}` : ''}.`}<br>${e.resultsOut ? 'لم تُرصد درجتك بعد.' : 'تُعلن النتيجة هنا بعد التصحيح واعتمادها.'}</p>
          <div class="receipt"><span>رقم الإيصال</span><b dir="ltr">${esc(sid.slice(0, 6).toUpperCase())}-${esc(uid.slice(0, 4).toUpperCase())}</b><small>أجبت عن ${Object.values(sit.answers || {}).filter(v => v != null && v !== '').length} من ${(sit.qids || []).length}</small></div>
          <div class="hero-cta" style="justify-content:center">${backBtn}<a class="btn btn-ghost" href="#/me">حسابي</a></div></div>`;
      };
      if (sit && (sit.status === 'submitted' || sitDeadline(e, sit) + EXAM_GRACE < Date.now())) return doneView(sit.status !== 'submitted');

      /* ===== قبل البدء ===== */
      const ph = examPhase(e);
      const intro = () => {
        let msg = '', can = false;
        if (sit) { can = true; msg = `<p class="pill warn" style="margin-bottom:12px">بدأت هذا الامتحان ولم تسلّمه — أكمل من حيث توقفت قبل انتهاء الوقت</p>`; }
        else if (ph === 'soon') msg = `<p class="muted" style="margin-bottom:6px">يُفتح الامتحان بعد</p><div style="display:flex;justify-content:center;color:var(--teal)">${countdownHtml(e.opensAt)}</div>`;
        else if (ph === 'closed') msg = `<p class="form-err">انتهى موعد هذا الامتحان (${examWhen(e)}). تواصل مع الإدارة إن كان لك عذر.</p>`;
        else if (!e.nq) msg = `<p class="form-err">لم تُجهَّز أسئلة هذا الامتحان بعد.</p>`;
        else can = true;
        const lateStart = can && !sit && +e.closesAt && +e.duration && Date.now() + e.duration * 6e4 > +e.closesAt;
        box.innerHTML = card(EXAM_KINDS[e.kind]?.[1] || 'quiz', esc(e.title || examKindName(e.kind)), facts([
          ['calendar', 'الموعد', examWhen(e)], ['quiz', 'عدد الأسئلة', e.nq || '—'], ['clock', 'المدة', +e.duration ? `${e.duration} دقيقة تبدأ من ضغطك «ابدأ»` : 'حتى نهاية الموعد'],
          ['award', 'درجة النجاح', `${e.passScore || 60}%`], +e.weight && ['chart', 'الوزن', `${e.weight}% من درجة المادة`]]) + noteHtml
          + `<ul class="xrules"><li>${ic('key', 14)} محاولة واحدة فقط، ولا يمكن إعادة الامتحان بعد البدء.</li><li>${ic('clock', 14)} الوقت يُحسب من السيرفر، ولا يتوقف إن أغلقت الصفحة.</li><li>${ic('check', 14)} تُحفظ إجاباتك تلقائياً أثناء الحل، وتُسلَّم عند انتهاء الوقت.</li><li>${ic('pen', 14)} الأسئلة المقالية والقصيرة يصحّحها الأستاذ، وتُعلن النتيجة بعد اعتمادها.</li></ul>`
          + (lateStart ? `<p class="pill warn" style="margin:8px 0">يُغلق الامتحان ${fmtTime(e.closesAt)} — ستحصل على الوقت المتبقي فقط</p>` : '') + msg,
          (can ? `<button class="btn btn-primary" id="go">${sit ? 'متابعة الامتحان' : 'ابدأ الامتحان'}</button>` : '') + backBtn);
        runCountdowns();
        $('#go') && ($('#go').onclick = async ev => { if (!sit && !(await confirmBox('سيبدأ احتساب الوقت الآن، ولا يمكن إعادة الامتحان. هل أنت مستعد؟', 'ابدأ'))) return; ev.target.disabled = true; begin().catch(err => { ev.target.disabled = false; toast(examErr(err), 'err'); if (!$('#go')) intro(); }); });
      };

      /* ===== الحل ===== */
      let qs = [], ans = {}, cur = 0, endAt = 0;
      const begin = async () => {
        box.innerHTML = loaderHtml();
        let bank = [];
        if (!sit && S.live) {
          /* السيرفر (Cloud Function startExam) يتحقق من الصلاحية والموعد، ويسحب أسئلة الطالب، ويكتب ورقته الخاصة sitPapers.
             بنك الأسئلة examPapers لا يصل للطالب إطلاقاً */
          const t0 = Date.now(), r = await (await fbFunctions()).httpsCallable('startExam')({ examId: eid });
          skew = (+r.data?.serverNow || Date.now()) - Math.round((t0 + Date.now()) / 2);
          sit = await DB.get('sittings', sid);
          if (!sit) throw new Error('تعذّر إنشاء جلسة الامتحان — أعد المحاولة');
        } else if (!sit) {
          /* الوضع التجريبي (بلا سيرفر): السحب في المتصفح */
          bank = (await DB.get('examPapers', eid))?.questions || []; if (!bank.length) throw new Error('لم تُجهَّز أسئلة هذا الامتحان بعد');
          const drawn = drawPaper(e, bank), t0 = Date.now();
          await DB.set('sittings', sid, { uid, userName: S.user.name, examId: eid, courseId: e.courseId, kind: e.kind, qids: drawn.map(q => q.id), answers: {}, status: 'started', startedAt: NOW_TS(), savedAt: NOW_TS() });
          sit = await DB.get('sittings', sid); skew = tsMs(sit.startedAt) - Math.round((t0 + Date.now()) / 2);
        } else {
          /* استئناف: مزامنة ساعة الجهاز مع السيرفر (والقواعد ترفض إن انتهى الوقت) */
          const t0 = Date.now();
          try { await DB.update('sittings', sid, { savedAt: NOW_TS() }); } catch (err) { if (/permission|insufficient/i.test(err.message)) { sit = (await safeGet('sittings', sid)) || sit; return doneView(true); } throw err; }
          sit = (await DB.get('sittings', sid)) || sit; skew = tsMs(sit.savedAt) - Math.round((t0 + Date.now()) / 2);
        }
        if (S.live) bank = (await DB.get('sitPapers', sid))?.questions || [];
        else if (!bank.length) bank = (await DB.get('examPapers', eid))?.questions || [];
        const qm = Object.fromEntries(bank.map(q => [q.id, q]));
        qs = (sit.qids || []).map(id => qm[id]).filter(Boolean); ans = { ...(sit.answers || {}) };
        if (!qs.length) throw new Error('تعذّر تحميل أسئلة جلستك — تواصل مع الإدارة');
        endAt = sitDeadline(e, sit);
        addEventListener('beforeunload', guard);
        if (endAt !== Infinity) timer = setInterval(tick, 1000);
        saver = setInterval(() => dirty && save(false), 15000);
        renderQ();
      };
      const save = async (final) => {
        const v = { answers: ans, savedAt: NOW_TS() }; if (final) Object.assign(v, { status: 'submitted', submittedAt: NOW_TS() });
        dirty = false; await DB.update('sittings', sid, v);
      };
      const tick = () => {
        const s = Math.max(0, Math.round((endAt - now()) / 1000)), t = $('#timer');
        if (t) { const h = Math.floor(s / 3600); t.lastChild.textContent = ` ${h ? h + ':' : ''}${String(Math.floor(s % 3600 / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; t.classList.toggle('low', s <= 60); }
        if (s <= 0) { clearInterval(timer); toast('انتهى الوقت — تُسلَّم إجاباتك'); submit(); }
      };
      const answered = q => { const a = ans[q.id]; return a != null && String(a).trim() !== ''; };
      const optOrder = q => q.type === 'mcq' && e.shuffleOpts ? shuffleArr(q.options.map((_, i) => i), seeded(sid + q.id)) : q.options.map((_, i) => i);
      const renderQ = () => {
        const q = qs[cur], a = ans[q.id];
        const body = Q_AUTO(q.type) ? `<div class="opts">${optOrder(q).map((oi, j) => `<button class="opt ${+a === oi && a != null ? 'sel' : ''}" data-o="${oi}"><span class="k">${OPT_LETTERS[j]}</span><span>${esc(q.options[oi])}</span></button>`).join('')}</div>${a != null ? `<button class="btn btn-ghost btn-sm" id="clr" style="margin-top:10px">مسح الإجابة</button>` : ''}`
          : q.type === 'short' ? `<input class="ans-in" id="ain" maxlength="300" autocomplete="off" placeholder="اكتب إجابتك باختصار" value="${esc(a || '')}">`
          : `<textarea class="ans-in" id="ain" rows="10" maxlength="8000" placeholder="اكتب إجابتك هنا">${esc(a || '')}</textarea><small class="muted" id="cc">${String(a || '').trim().split(/\s+/).filter(Boolean).length} كلمة</small>`;
        box.innerHTML = `<div class="exam-top"><strong>السؤال ${cur + 1} من ${qs.length}</strong><span class="muted" id="svd" style="font-size:.85rem"></span>${endAt !== Infinity ? `<span class="timer" id="timer">${ic('clock', 16)}<span> --:--</span></span>` : ''}</div>
          <div class="dots">${qs.map((x, i) => `<button class="${answered(x) ? 'ans' : ''} ${i === cur ? 'cur' : ''}" data-i="${i}" aria-label="السؤال ${i + 1}">${i + 1}</button>`).join('')}</div>
          <div class="qcard"><div class="qmeta">${Q_TYPES[q.type]} — ${+q.pts || 1} ${(+q.pts || 1) === 1 ? 'درجة' : (+q.pts || 1) === 2 ? 'درجتان' : 'درجات'}</div><h2>${esc(q.text)}</h2>${body}
          <div class="lesson-nav">${cur > 0 ? `<button class="btn btn-ghost" id="pv">${ic('prev', 17)} السابق</button>` : '<span></span>'}${cur < qs.length - 1 ? `<button class="btn btn-primary" id="nx">التالي ${ic('next', 17)}</button>` : `<button class="btn btn-brass" id="sb">تسليم الامتحان</button>`}</div></div>`;
        if (endAt !== Infinity) tick();
        const mark = () => { dirty = true; $(`.dots [data-i="${cur}"]`)?.classList.toggle('ans', answered(q)); };
        $$('.opt', box).forEach(b => b.onclick = () => { ans[q.id] = +b.dataset.o; $$('.opt', box).forEach(x => x.classList.toggle('sel', x === b)); mark(); });
        $('#clr') && ($('#clr').onclick = () => { ans[q.id] = null; mark(); renderQ(); });
        const ain = $('#ain'); if (ain) { ain.oninput = () => { ans[q.id] = ain.value; mark(); const cc = $('#cc'); if (cc) cc.textContent = ain.value.trim().split(/\s+/).filter(Boolean).length + ' كلمة'; }; ain.onblur = () => dirty && save(false).catch(() => {}); }
        const goQ = i => { if (dirty) save(false).then(() => { const s = $('#svd'); if (s) s.textContent = 'حُفظ تلقائياً'; }).catch(() => {}); cur = i; renderQ(); };
        $$('.dots button', box).forEach(b => b.onclick = () => goQ(+b.dataset.i));
        $('#pv') && ($('#pv').onclick = () => goQ(cur - 1));
        $('#nx') && ($('#nx').onclick = () => goQ(cur + 1));
        $('#sb') && ($('#sb').onclick = async () => {
          const miss = qs.filter(x => !answered(x)).length;
          if (!(await confirmBox(miss ? `لم تُجب عن ${miss} ${miss === 1 ? 'سؤال' : miss === 2 ? 'سؤالين' : 'أسئلة'}. التسليم نهائي — هل تريد التسليم الآن؟` : 'التسليم نهائي ولا يمكن التعديل بعده. هل تريد تسليم الامتحان؟', 'تسليم'))) return;
          submit();
        });
      };
      const submit = async () => {
        if (busy) return; busy = true; clearInterval(timer); clearInterval(saver);
        box.innerHTML = loaderHtml();
        try { await save(true); sit = { ...sit, status: 'submitted', answers: ans, submittedAt: Date.now() }; removeEventListener('beforeunload', guard); doneView(false); }
        catch (err) {
          if (/permission|insufficient/i.test(err.message)) { removeEventListener('beforeunload', guard); sit = (await safeGet('sittings', sid)) || sit; return doneView(true); }
          busy = false;
          box.innerHTML = `<div class="qcard result"><div class="saved-ic err">${ic('x', 46)}</div><h2>لم يُسلَّم الامتحان بعد</h2><p class="muted">${esc(err.message)}<br>تحقق من الاتصال وأعد المحاولة بسرعة؛ إجاباتك ما زالت في هذه الصفحة.</p><div class="hero-cta" style="justify-content:center"><button class="btn btn-primary" id="retry">إعادة التسليم</button></div></div>`;
          $('#retry').onclick = submit;
        }
      };
      intro();
    }
  };
}

const CDN = {
  h2c: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  pdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  qr: 'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'
};
const once = {}; const need = k => once[k] || (once[k] = loadScript(CDN[k]).catch(e => { delete once[k]; throw e; }));
/* certHtml و CERT_TPLS في core.js (تستعملها لوحة التحكم للمعاينة أيضاً) */
async function certPDF(htmls, file) {
  await Promise.all([need('h2c'), need('pdf')]);
  await document.fonts.ready;
  /* القالب المستورد قد يكون عمودياً (o-portrait) فتُضبط الصفحة واتجاهها لكل شهادة */
  const portrait = h => /\bo-portrait\b/.test(h);
  const pdf = new window.jspdf.jsPDF({ orientation: portrait(htmls[0]) ? 'portrait' : 'landscape', unit: 'mm', format: 'a4' });
  for (let i = 0; i < htmls.length; i++) {
    const host = document.createElement('div'), pt = portrait(htmls[i]), W = pt ? 1000 : 1400;
    host.style.cssText = `position:absolute;top:0;left:0;width:${W}px;z-index:-1;pointer-events:none`;
    host.innerHTML = `<div class="cert-wrap" style="width:${W}px;max-width:none;margin:0">${htmls[i]}</div>`;
    document.body.append(host);
    try {
      await Promise.all($$('img[src]', host).map(im => im.decode().catch(() => {})));
      const canvas = await html2canvas($('.cert', host), { scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false, scrollX: 0, scrollY: -scrollY, windowWidth: 1600 });
      if (i) pdf.addPage('a4', pt ? 'portrait' : 'landscape');
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pt ? 210 : 297, pt ? 297 : 210);
    } finally { host.remove(); }
  }
  pdf.save(file);
}
async function viewCert(code, lang) {
  const ct = await safeGet('certificates', decodeURIComponent(code));
  if (!ct) return notFound('لم نعثر على شهادة بهذا الرمز. تأكد من كتابته كما هو مطبوع على الشهادة.');
  const c = await safeGet('courses', ct.courseId), type = await resolveCertType(ct, c);
  const link = location.origin + location.pathname + '#/cert/' + ct.id, mine = S.user?.uid === ct.uid;
  const langs = certLangList(type); let cur = langs.includes(lang) ? lang : langs[0], qr = '';
  const LBL = { ar: 'الشهادة العربية', en: 'English Certificate' };
  return {
    docTitle: 'شهادة ' + ct.name,
    html: `<div class="wrap cert-page">
      ${mine && !ct.nameEn && langs.includes('en') ? `<form class="cert-note no-print" id="enf">${ic('edit', 18)}<span>اكتب اسمك بالإنجليزية ليظهر في الشهادة الإنجليزية:</span><input name="n" required dir="ltr" placeholder="Abdullah Ahmad"><button class="btn btn-primary btn-sm">حفظ</button></form>` : ''}
      ${langs.length > 1 ? `<div class="cert-tabs no-print" role="tablist">${langs.map(l => `<button role="tab" class="${l === cur ? 'on' : ''}" data-l="${l}" ${l === 'en' ? 'dir="ltr"' : ''}>${LBL[l]}</button>`).join('')}</div>` : ''}
      <div class="cert-wrap reveal" id="certWrap">${certHtml(ct, cur, { c, type })}</div>
      <div class="cert-actions no-print"><button class="btn btn-brass" id="pdf">${ic('download', 17)} تحميل PDF</button>${langs.length > 1 ? `<button class="btn btn-ghost" id="pdfAll">${ic('download', 17)} تحميل الشهادتين</button>` : ''}<button class="btn btn-ghost" onclick="print()">${ic('print', 17)} طباعة</button><button class="btn btn-ghost" id="cp">${ic('link', 17)} نسخ رابط التحقق</button></div>
      <p class="muted no-print" style="text-align:center;margin-top:12px">${mine ? 'هذه شهادتك. شارك رابط التحقق أو امسح الرمز للتأكد منها.' : 'شهادة صادرة من المنصة وموثّقة.'}</p>
    </div>`,
    mount() {
      const fillQr = () => { if (!qr) return; $$('#certWrap .cx-qr img').forEach(im => { im.src = qr; im.hidden = false; }); $$('#certWrap .cx-qr-ph').forEach(x => x.hidden = true); };
      const qrReady = need('qr').then(() => { const q = qrcode(0, 'M'); q.addData(link); q.make(); qr = q.createDataURL(6, 0); fillQr(); }).catch(() => {});
      $$('.cert-tabs button').forEach(b => b.onclick = () => {
        cur = b.dataset.l; $$('.cert-tabs button').forEach(x => x.classList.toggle('on', x === b));
        $('#certWrap').innerHTML = certHtml(ct, cur, { c, qr, type }); fillQr();
        history.replaceState(null, '', '#/cert/' + ct.id + '/' + cur);
      });
      $('#cp').onclick = async () => { try { await navigator.clipboard.writeText(link); toast('نُسخ رابط التحقق', 'ok'); } catch { prompt('انسخ الرابط:', link); } };
      const dl = (btn, list, file) => btn && (btn.onclick = async e => {
        const b = e.currentTarget; b.disabled = true; const t = b.innerHTML; b.innerHTML = 'جارٍ التجهيز…';
        try { await qrReady; await certPDF(list().map(l => certHtml(ct, l, { c, qr, type })), file()); toast('حُمّلت الشهادة', 'ok'); }
        catch (err) { console.error(err); toast('تعذّر إنشاء PDF — استخدم «طباعة» ثم «حفظ بصيغة PDF»', 'err'); }
        b.disabled = false; b.innerHTML = t;
      });
      dl($('#pdf'), () => [cur], () => `certificate-${ct.id}-${cur}.pdf`);
      dl($('#pdfAll'), () => langs, () => `certificate-${ct.id}.pdf`);
      $('#enf') && ($('#enf').onsubmit = async e => {
        e.preventDefault(); const n = new FormData(e.target).get('n').trim(); if (!n) return;
        try { await DB.update('certificates', ct.id, { nameEn: n }); await DB.update('users', S.user.uid, { nameEn: n }).catch(() => {}); toast('حُفظ الاسم', 'ok'); route(); }
        catch (err) { toast(err.message, 'err'); }
      });
    }
  };
}
async function viewVerify() {
  return {
    docTitle: 'التحقق من شهادة',
    html: `<section class="auth"><div class="auth-card reveal"><div class="auth-head">${ic('shield', 44)}<h1>التحقق من شهادة</h1><p>اكتب رمز التحقق المطبوع أسفل الشهادة</p></div>
      <form class="form" id="f"><label>رمز التحقق<input name="c" required placeholder="BYN-XXXX-XXXX" dir="ltr" style="text-align:center;letter-spacing:.08em"></label><button class="btn btn-primary btn-block">تحقّق</button></form></div></section>`,
    mount() { $('#f').onsubmit = e => { e.preventDefault(); go('/cert/' + encodeURIComponent(new FormData(e.target).get('c').trim().toUpperCase())); }; }
  };
}

/* ================= الدخول والتسجيل ================= */
async function viewLogin() {
  if (S.user) { S.user.isAdmin ? location.href = adminLink : go('/me'); return null; }
  const st = S.settings;
  return {
    docTitle: 'تسجيل الدخول',
    html: `<section class="auth"><div class="auth-card reveal"><div class="auth-head">${logoMark(48)}<h1>أهلاً بك في ${esc(st.name)}</h1><p>سجّل دخولك لمتابعة دروسك</p></div>
      <form id="f" class="form"><label>اسم المستخدم<input name="u" required autocomplete="username" dir="ltr"></label>
      <label>كلمة المرور<input name="p" type="password" required autocomplete="current-password" dir="ltr"></label>
      <div class="form-err" id="err"></div><button class="btn btn-primary btn-block">دخول</button></form>
      ${st.allowRegister ? `<p class="auth-alt">ليس لديك حساب؟ <a href="#/register">أنشئ حساباً</a></p>` : ''}
      ${!S.live ? `<div class="demo-note">وضع تجريبي — حساب طالب: <b dir="ltr">demo / 123456</b></div>` : ''}
    </div></section>`,
    mount() {
      $('#f').onsubmit = async e => {
        e.preventDefault(); const fd = new FormData(e.target), b = $('button', e.target); b.disabled = true; $('#err').textContent = '';
        try {
          S.user = await Auth.login(fd.get('u').trim(), fd.get('p'));
          const next = sessionStorage.getItem('bayan_next'); sessionStorage.removeItem('bayan_next');
          if (S.user.isAdmin) { location.href = adminLink; return; }
          toast('أهلاً ' + firstName(S.user.name), 'ok'); go(next || '/me');
        } catch (err) { $('#err').textContent = err.message; b.disabled = false; }
      };
    }
  };
}
async function viewRegister() {
  if (S.user) { go('/me'); return null; }
  if (!S.settings.allowRegister) return notFound('التسجيل مغلق حالياً. تواصل مع إدارة المنصة لإنشاء حسابك.');
  return {
    docTitle: 'حساب جديد',
    html: `<section class="auth"><div class="auth-card reveal"><div class="auth-head">${logoMark(48)}<h1>حساب جديد</h1><p>دقيقة واحدة وتبدأ أول دورة</p></div>
      <form id="f" class="form">
        <label>الاسم الكامل <span class="hint">(يُكتب على الشهادة)</span><input name="name" required minlength="3"></label>
        <label>الاسم بالإنجليزية <span class="hint">(يُكتب على الشهادة، اختياري)</span><input name="nameEn" dir="ltr" placeholder="e.g. Abdullah Ahmad"></label>
        <label>اسم المستخدم <span class="hint">أحرف إنجليزية وأرقام</span><input name="username" required pattern="[A-Za-z0-9_.]{3,20}" dir="ltr" autocomplete="username"></label>
        <label>رقم الجوال <span class="hint">(اختياري)</span><input name="phone" type="tel" dir="ltr"></label>
        <label>كلمة المرور <span class="hint">6 أحرف على الأقل</span><input name="password" type="password" required minlength="6" dir="ltr" autocomplete="new-password"></label>
        <div class="form-err" id="err"></div><button class="btn btn-primary btn-block">إنشاء الحساب</button>
        <p class="hint" style="text-align:center">${(sessionStorage.getItem('bayan_next') || '').startsWith('/apply') ? 'بعد إنشاء الحساب تنتقل مباشرة إلى طلب الالتحاق.' : `<a href="#/programs" style="color:var(--teal)">شروط القبول في البرامج</a>`}</p></form>
      <p class="auth-alt">لديك حساب؟ <a href="#/login">سجّل دخولك</a></p></div></section>`,
    mount() {
      $('#f').onsubmit = async e => {
        e.preventDefault(); const f = e.target; if (!f.checkValidity()) { f.reportValidity(); return; }
        const fd = new FormData(f), b = $('button', f); b.disabled = true; $('#err').textContent = '';
        try {
          S.user = await Auth.createUser({ name: fd.get('name').trim(), nameEn: fd.get('nameEn').trim(), username: fd.get('username').trim(), password: fd.get('password'), phone: fd.get('phone').trim() }, true);
          toast('أُنشئ حسابك — أهلاً بك', 'ok'); go(sessionStorage.getItem('bayan_next') || '/courses'); sessionStorage.removeItem('bayan_next');
        } catch (err) { $('#err').textContent = err.message; b.disabled = false; }
      };
    }
  };
}

/* ================= عن المنصة / تواصل / الشروط ================= */
async function viewAbout() {
  const st = S.settings;
  const [courses, certs] = await Promise.all([safeList('courses'), safeList('certificates')]);
  const pub = courses.filter(c => c.published), cats = [...new Set(pub.map(c => c.category).filter(Boolean))];
  const body = st.aboutLong ? richText(st.aboutLong) : `<p>${esc(st.about)}</p><p>${esc(st.heroText)}</p>`;
  return {
    over: true, docTitle: 'عن ' + st.name,
    html: `${pageHead('عن ' + st.name, st.tagline)}
      <div class="wrap cgrid">
        <article class="panel reveal longtext">${body}</article>
        <aside><div class="panel sticky reveal">
          <h3>${esc(st.name)} بالأرقام</h3>
          <ol class="lessons" style="margin-bottom:16px">
            <li><span class="n">${ic('book', 15)}</span><div class="t">دورات منشورة<small>${pub.length}</small></div></li>
            ${cats.length ? `<li><span class="n">${ic('star', 15)}</span><div class="t">العلوم<small>${cats.map(esc).join('، ')}</small></div></li>` : ''}
            <li><span class="n">${ic('award', 15)}</span><div class="t">شهادات صادرة<small>${certs.length}</small></div></li>
          </ol>
          <div style="display:grid;gap:8px"><a class="btn btn-primary btn-block" href="#/courses">تصفّح الدورات</a><a class="btn btn-ghost btn-block" href="#/contact">تواصل معنا</a></div>
        </div></aside>
      </div>`
  };
}
async function viewContact() {
  const st = S.settings, wa = waNum(st.whatsapp), soc = socialLinks('chan-soc');
  const channels = (wa ? `<a class="chan" href="${waLink(wa, 'السلام عليكم، لدي استفسار عن ' + st.name)}" target="_blank" rel="noopener"><span class="chan-ic">${ic('whatsapp', 22)}</span><span><strong>واتساب</strong><small><bdi dir="ltr">+${esc(wa)}</bdi></small></span></a>` : '')
    + (st.email ? `<a class="chan" href="mailto:${esc(st.email)}"><span class="chan-ic">${ic('mail', 22)}</span><span><strong>البريد الإلكتروني</strong><small><bdi dir="ltr">${esc(st.email)}</bdi></small></span></a>` : '')
    + (!st.email && !wa && st.contact ? `<div class="chan"><span class="chan-ic">${ic('info', 22)}</span><span><strong>للتواصل</strong><small>${esc(st.contact)}</small></span></div>` : '');
  const form = st.allowMessages !== false;
  return {
    over: true, docTitle: 'تواصل معنا',
    html: `${pageHead('تواصل معنا', form ? 'اكتب سؤالك أو ملاحظتك وسيرد عليك فريق المنصة.' : 'يسعدنا تواصلك عبر القنوات التالية.')}
      <div class="wrap cgrid">
        ${form ? `<div class="panel reveal" id="cbox"><h2>أرسل رسالة</h2>
          <form class="form" id="cf" novalidate>
            <div class="row"><label>الاسم<input name="name" required minlength="2" maxlength="80" value="${esc(S.user && !S.user.isAdmin ? S.user.name : '')}"></label>
            <label>جوال أو بريد للرد عليك<input name="reply" required maxlength="120" dir="ltr" placeholder="+9665… أو name@mail.com"></label></div>
            <label>الموضوع<select name="topic">${MSG_TOPICS.map(t => `<option>${t}</option>`).join('')}</select></label>
            <label>رسالتك<textarea name="body" rows="6" required minlength="5" maxlength="3000"></textarea></label>
            <label class="hp" aria-hidden="true">اترك هذا الحقل فارغاً<input name="website" tabindex="-1" autocomplete="off"></label>
            <div class="form-err" id="cerr"></div>
            <div><button class="btn btn-primary">${ic('pen', 17)} إرسال الرسالة</button></div>
          </form></div>` : ''}
        <aside${form ? '' : ' style="grid-column:1/-1;max-width:560px"'}><div class="panel ${form ? 'sticky' : ''} reveal"><h3>قنوات مباشرة</h3>
          ${channels || soc ? `<div class="chans">${channels}</div>${soc ? `<p class="muted" style="margin:16px 0 8px">تابعنا</p><div class="socs">${soc}</div>` : ''}` : '<p class="muted">لم تُضف قنوات تواصل بعد.</p>'}
        </div></aside>
      </div>`,
    mount() {
      const f = $('#cf'); if (!f) return;
      f.onsubmit = async e => {
        e.preventDefault(); if (!f.checkValidity()) { f.reportValidity(); return; }
        const fd = new FormData(f), b = $('button', f), err = $('#cerr'); err.textContent = '';
        const reply = fd.get('reply').trim();
        if (!/@/.test(reply) && waNum(reply).length < 7) { err.textContent = 'اكتب رقم جوال صحيحاً أو بريداً إلكترونياً لنرد عليك.'; return; }
        const last = +localStorage.getItem('bayan_msg_at') || 0;
        if (Date.now() - last < 60000) { err.textContent = 'أرسلت رسالة قبل قليل. انتظر دقيقة ثم أعد الإرسال.'; return; }
        b.disabled = true;
        const done = () => { localStorage.setItem('bayan_msg_at', Date.now()); $('#cbox').innerHTML = `<div class="sent">${ic('check', 40)}<h2>وصلت رسالتك</h2><p class="muted">سنرد عليك على <bdi dir="ltr">${esc(reply)}</bdi> في أقرب وقت بإذن الله.</p><a class="btn btn-ghost" href="#/courses">تصفّح الدورات</a></div>`; };
        if (fd.get('website')) return done(); // حقل فخ للروبوتات
        try {
          await DB.set('messages', genId(), { name: fd.get('name').trim(), reply, topic: fd.get('topic'), body: fd.get('body').trim(), at: Date.now(), uid: S.user && !S.user.isAdmin ? S.user.uid : '', status: 'new' });
          done();
        } catch (ex) { err.textContent = 'تعذّر الإرسال: ' + (/permission|insufficient/i.test(ex.message) ? 'رفض الخادم الرسالة، تحقّق من طولها.' : ex.message); b.disabled = false; }
      };
    }
  };
}

/* ================= البرامج الدراسية والنظام الداخلي ================= */
/* صفوف الخطة: من مواد البرنامج الأكاديمي في الدورات (منشورة أو مسودة)، وإلا الخطة المضمّنة ACADEMY_PLAN */
function planRows(all) {
  const rows = all.filter(c => c.program === 'academy' && +c.term >= 1 && +c.term <= 4).sort(planSort);
  if (rows.length) return rows;
  const n = {};
  return ACADEMY_PLAN.map(([term, title, , book, author, hours]) => ({ term, order: (n[term] = (n[term] || 0) + 1), title, book, author, hours }));
}
/* مواد برنامج الإجازات: من الدورات ذات program 'ijaza'، وإلا IJAZA_PLAN. الرابط: الدورة إن كانت منشورة، وإلا صفحة تعريف المادة */
function ijazaRows(all) {
  const db = all.filter(c => c.program === 'ijaza').sort(planSort);
  const plan = c => IJAZA_PLAN.find(p => p.key === c.ijazaKey || String(c.title || '').includes(p.title)) || {};
  const rows = db.length ? db.map(c => { const p = plan(c); return { ...p, ...c, icon: c.icon || p.icon, book: c.book || p.book, key: c.ijazaKey || c.id, planDesc: p.description ? p.description + '\n\n' + p.items.map(x => '- ' + x).join('\n') : '' }; })
    : IJAZA_PLAN.map(p => ({ ...p, planDesc: p.description + '\n\n' + p.items.map(x => '- ' + x).join('\n') }));
  return rows.map(r => ({ ...r, href: r.id && r.published ? `#/course/${r.id}` : `#/ijaza/${encodeURIComponent(r.key)}` }));
}
const ijazaCard = r => `<a class="isub reveal" href="${r.href}"><span class="glyph">${ic(r.icon || 'book', 24)}</span><div class="grow"><h3>${esc(r.title)}</h3>${r.book ? `<p>${esc(r.book)}</p>` : ''}</div><span class="more">ما هي؟ ${ic('prev', 15)}</span></a>`;
const sumHours = rows => rows.reduce((a, r) => a + (+r.hours || 0), 0);
const lines = t => String(t || '').split('\n').map(x => x.trim()).filter(Boolean);
function programsTeaser(rows, ij) {
  const st = S.settings, hrs = sumHours(rows), terms = new Set(rows.map(r => +r.term)).size;
  return `<section class="section progs-sec"><div class="wrap">
    <div class="sec-head reveal"><div><h2>برنامجان للدراسة</h2><p>${esc(st.accredit)}</p></div><a class="btn btn-ghost" href="#/programs">التفاصيل والخطة الدراسية</a></div>
    <div class="progs reveal">
      <a class="prog prog-main" href="#/programs#p1"><span class="prog-n">البرنامج الأول</span><h3>${esc(programName('academy'))}</h3><p>${esc(st.acadIntro)}</p>
        <div class="pfacts"><span><b>2</b>سنتان</span><span><b>${rows.length}</b>مادة</span><span><b>${terms}</b>فصول</span>${hrs ? `<span><b>${hrs}</b>ساعة أسبوعية</span>` : ''}</div>
        <small class="prog-cond">${ic('check', 15)} القبول: ${esc(st.acadAdmission)}</small></a>
      <div class="prog"><span class="prog-n">البرنامج الثاني</span><h3><a href="#/programs#p2">${esc(programName('ijaza'))}</a></h3>
        <p>${esc(st.ijazaIntro)}</p>
        <div class="isubs mini">${ij.map(r => `<a class="isub" href="${r.href}"><span class="glyph">${ic(r.icon || 'book', 20)}</span><div class="grow"><h3>${esc(r.title)}</h3></div>${ic('prev', 15)}</a>`).join('')}</div>
        <small class="prog-cond">${ic('check', 15)} القبول: ${esc(st.ijazaAdmission)}</small></div>
    </div></div></section>`;
}
async function viewPrograms() {
  const st = S.settings, all = await safeList('courses');
  const rows = planRows(all), hrs = sumHours(rows);
  const ijaza = ijazaRows(all);
  const link = r => r.id && r.published ? `<a href="#/course/${r.id}">${esc(r.title)}</a>` : esc(r.title);
  const term = t => {
    const tr = rows.filter(r => +r.term === t), h = sumHours(tr);
    if (!tr.length) return '';
    return `<div class="term"><div class="term-h"><h4>${TERM_NAMES[t]}</h4>${h ? `<small>${h} ساعة أسبوعياً</small>` : ''}</div>
      <div class="tbl-wrap"><table class="plan"><thead><tr><th>م</th><th>المادة</th><th>الكتاب المقرّر</th><th>المؤلف</th><th>الساعات</th></tr></thead>
      <tbody>${tr.map((r, i) => `<tr><td>${i + 1}</td><td>${link(r)}</td><td class="bk">${esc(r.book || '—')}</td><td>${esc(r.author || '—')}</td><td>${r.hours ? esc(r.hours) : '—'}</td></tr>`).join('')}</tbody></table></div></div>`;
  };
  return {
    over: true, docTitle: 'البرامج الدراسية',
    html: `${pageHead('البرامج الدراسية', st.accredit)}
      <div class="wrap progs-page">
        <section class="panel reveal" id="p1">
          <span class="prog-n">البرنامج الأول</span><h2>${esc(programName('academy'))}</h2>
          <div class="pfacts dark"><span><b>2</b>سنتان</span><span><b>${rows.length}</b>مادة</span><span><b>4</b>فصول دراسية</span>${hrs ? `<span><b>${hrs}</b>ساعة أسبوعية</span>` : ''}<span><b>2</b>لغتان: العربية والإنكليزية</span></div>
          <p class="prose">${esc(st.acadIntro)}</p>
          <p class="cond">${ic('check', 17)} <span><b>شرط القبول:</b> ${esc(st.acadAdmission)}</span></p>${applyCta('academy')}
          <p class="cond">${ic('calendar', 17)} <span>يُقيَّد المقبول في البرنامج وفي دفعة، ويُسجَّل تلقائياً في مواد الفصل الأول، وتُفتح مواد كل فصل بعد إنهاء الفصل الذي قبله. <a href="#/calendar" style="color:var(--teal);font-weight:600">التقويم الأكاديمي</a></span></p>
          ${[1, 2].map(y => `<div class="plan-year"><h3>${YEAR_NAMES[y]}</h3>${term(y * 2 - 1)}${term(y * 2)}</div>`).join('')}
        </section>
        <section class="panel reveal" id="p2">
          <span class="prog-n">البرنامج الثاني</span><h2>${esc(programName('ijaza'))}</h2>
          <p class="prose" style="margin-top:10px">${esc(st.ijazaIntro)}</p>
          <div class="isubs">${ijaza.map(ijazaCard).join('')}</div>
          <p class="cond">${ic('check', 17)} <span><b>شرط القبول:</b> ${esc(st.ijazaAdmission)}</span></p>${applyCta('ijaza')}
        </section>
        <div class="band reveal"><svg class="deco" viewBox="0 0 40 40" fill="none" stroke="#C9A45C" stroke-width=".8"><rect x="8" y="8" width="24" height="24"/><rect x="8" y="8" width="24" height="24" transform="rotate(45 20 20)"/><circle cx="20" cy="20" r="6"/></svg>
          <div><h2>${esc(st.accredit)}</h2><p>قدّم طلب الالتحاق من حسابك، أو راسلنا للاستفسار عن القبول في البرنامجين.</p></div>
          <div class="hero-cta" style="margin:0"><a class="btn btn-ghost" style="color:#fff;border-color:rgba(255,255,255,.35)" href="#/contact">تواصل معنا</a><a class="btn btn-brass" href="#/apply">قدّم الآن</a></div></div>
      </div>`,
    mount() { const h = location.hash.split('#')[2]; if (h) setTimeout(() => document.getElementById(h)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }), 60); }
  };
}
async function viewIjaza(key) {
  const st = S.settings, rows = ijazaRows(await safeList('courses')), r = rows.find(x => String(x.key) === key);
  if (!r) return notFound('المادة غير موجودة.');
  const desc = (r.id && String(r.description || '').trim()) || r.planDesc;
  const others = rows.filter(x => x !== r);
  return {
    over: true, docTitle: r.title,
    html: `${pageHead(r.title, programName('ijaza'))}
      <div class="wrap cgrid">
        <article class="panel reveal longtext">
          ${r.book ? `<p class="ibook">${ic(r.icon || 'book', 20)} ${esc(r.book)}</p>` : ''}
          ${desc ? richText(desc) : `<p>${esc(r.summary || '')}</p>`}
          <p class="cond">${ic('check', 17)} <span><b>شرط القبول:</b> ${esc(st.ijazaAdmission)}</span></p>
        </article>
        <aside><div class="panel sticky reveal">
          <h3>${esc(programName('ijaza'))}</h3>
          ${others.length ? `<div class="isubs mini" style="margin:12px 0 16px">${others.map(x => `<a class="isub" href="${x.href}"><span class="glyph">${ic(x.icon || 'book', 20)}</span><div class="grow"><h3>${esc(x.title)}</h3></div>${ic('prev', 15)}</a>`).join('')}</div>` : ''}
          <div style="display:grid;gap:8px"><a class="btn btn-primary btn-block" href="#/apply/ijaza">قدّم على البرنامج</a><a class="btn btn-ghost btn-block" href="#/contact">تواصل معنا</a><a class="btn btn-ghost btn-block" href="#/programs#p2">${ic('next', 16)} البرامج الدراسية</a></div>
        </div></aside>
      </div>`
  };
}
async function viewTerms() {
  const st = S.settings;
  if (!st.terms) return notFound('لم تُنشر شروط الاستخدام بعد.');
  return { over: true, docTitle: 'الشروط والخصوصية', html: `${pageHead('شروط الاستخدام وسياسة الخصوصية', st.name)}<div class="wrap" style="padding:48px 0 80px"><article class="panel reveal longtext" style="max-width:820px;margin-inline:auto">${richText(st.terms)}</article></div>` };
}

/* ================= التقديم والقبول =================
   #/apply: اختيار البرنامج · #/apply/:program: نموذج الطلب أو حالته (?edit=1 لتعديل طلب مرسَل أو إعادة تقديم طلب مسحوب) */
const goOrRoute = p => location.hash === '#' + p ? route() : go(p);
const admCond = p => p === 'academy' ? S.settings.acadAdmission : S.settings.ijazaAdmission;
/* بوابة القبول المغلق (بدل enrollGate التي تتحدث عن تسجيل الدورة) */
const admGate = as => `<div class="gate compact"><strong>${ic(as.state === 'soon' ? 'calendar' : 'lock', 17)} ${esc(admLabel(as))}</strong><small>${esc(as.state === 'soon' ? (as.closesAt ? `ويستمر حتى ${fmtDate(as.closesAt)}` : 'تابع الصفحة وقدّم حين يفتح.') : as.note || 'تابع الصفحة لمعرفة موعد القبول القادم.')}</small></div>`;
const applyCta = p => { const as = admState(p); return `<div class="apply-cta"><a class="btn btn-brass" href="#/apply/${p}">${as.open ? 'قدّم الآن' : 'تفاصيل القبول'}</a><small>${ic(as.open ? 'check' : 'calendar', 15)} ${esc(admLabel(as))}</small></div>`; };
/* مراحل الطلب: تقديم ← مراجعة ← قرار ← قيد */
function appSteps(a, rec) {
  const s = rec ? 'accepted' : a?.status || '';
  const st = [
    ['تقديم الطلب', s ? 'done' : 'now', a?.submittedAt ? fmtDate(a.submittedAt) : ''],
    ['المراجعة', s === 'accepted' || s === 'rejected' ? 'done' : s && s !== 'withdrawn' ? 'now' : '', s === 'incomplete' ? 'مطلوب استكمال' : s === 'waitlist' ? 'قائمة الانتظار' : ''],
    ['القرار', s === 'accepted' ? 'done' : s === 'rejected' ? 'bad' : '', s === 'rejected' ? 'غير مقبول' : a?.decidedAt && s === 'accepted' ? fmtDate(a.decidedAt) : ''],
    ['القيد في البرنامج', rec ? 'done' : '', rec?.studentNo ? 'الرقم الجامعي ' + rec.studentNo : '']
  ];
  return `<ol class="asteps">${st.map(([t, c, sub], i) => `<li class="${c}"><span class="n">${c === 'done' ? ic('check', 15) : c === 'bad' ? ic('x', 15) : i + 1}</span><div><b>${t}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div></li>`).join('')}</ol>`;
}
function applyAside(p) {
  const as = admState(p);
  return `<aside><div class="panel sticky reveal apply-side"><h3>${esc(programName(p))}</h3>
    <p class="cond" style="margin:0 0 14px">${ic('check', 17)} <span><b>شرط القبول:</b> ${esc(admCond(p))}</span></p>
    <ol class="lessons"><li><span class="n">${ic('calendar', 15)}</span><div class="t">موعد القبول<small>${esc(admLabel(as))}</small></div></li>
    <li><span class="n">${ic('file', 15)}</span><div class="t">بعد الإرسال<small>تراجع الإدارة طلبك، وتتابع حالته من «حسابي».</small></div></li>
    <li><span class="n">${ic('award', 15)}</span><div class="t">عند القبول<small>يصدر رقمك الجامعي، وتُفتح لك مواد ${p === 'academy' ? 'الفصل الأول حين تسجّل فيه' : 'مسارك'}.</small></div></li></ol>
    <a class="btn btn-ghost btn-block" style="margin-top:14px" href="#/programs#${p === 'academy' ? 'p1' : 'p2'}">${ic('next', 16)} تفاصيل البرنامج</a></div></aside>`;
}
async function viewApply(p) {
  const st = S.settings;
  if (!p) return {
    over: true, docTitle: 'القبول والتسجيل',
    html: `${pageHead('القبول والتسجيل', st.accredit)}<div class="wrap" style="padding:40px 0 80px"><div class="progs reveal">
      ${ADM_PROGS.map((k, i) => `<div class="prog ${i ? '' : 'prog-main'}"><span class="prog-n">البرنامج ${i ? 'الثاني' : 'الأول'}</span><h3>${esc(programName(k))}</h3><p>${esc(k === 'academy' ? st.acadIntro : st.ijazaIntro)}</p>
        <small class="prog-cond">${ic('check', 15)} القبول: ${esc(admCond(k))}</small>${applyCta(k)}</div>`).join('')}</div></div>`
  };
  if (!isAdmProg(p)) return notFound('البرنامج غير موجود.');
  const pn = programName(p), as = admState(p);
  if (S.user?.isAdmin) return notFound('التقديم للطلاب — أنت داخل بحساب المشرف. تُراجَع الطلبات من لوحة التحكم ← القبول.');
  if (!S.user) {
    sessionStorage.setItem('bayan_next', `/apply/${p}`);
    return {
      over: true, docTitle: 'التقديم — ' + pn,
      html: `${pageHead('التقديم على ' + pn, st.accredit)}<div class="wrap cgrid"><div class="panel reveal">
        <h2>ابدأ بحسابك</h2><p class="prose">طلب الالتحاق مرتبط بحسابك في ${esc(st.name)}: منه تتابع حالة الطلب، وفيه يصدر رقمك الجامعي وتظهر موادك بعد القبول.</p>
        ${appSteps(null)}${as.open ? '' : admGate(as)}
        <div class="hero-cta">${st.allowRegister ? `<a class="btn btn-primary" href="#/register">أنشئ حساباً وقدّم</a>` : ''}<a class="btn btn-ghost" href="#/login">لدي حساب — سجّل دخولي</a></div></div>
        ${applyAside(p)}</div>`
    };
  }
  const uid = S.user.uid, id = `${uid}_${p}`;
  const [a, rec, me] = await Promise.all([safeGet('applications', id), safeGet('records', id), safeGet('users', uid)]);
  const edit = new URLSearchParams(location.hash.split('?')[1] || '').get('edit') === '1';
  const canForm = !rec && (!a ? as.open : a.status === 'incomplete' || (edit && a.status === 'submitted') || (edit && a.status === 'withdrawn' && as.open));
  if (!a && !rec && !as.open) return {
    over: true, docTitle: 'التقديم — ' + pn,
    html: `${pageHead('التقديم على ' + pn, st.accredit)}<div class="wrap cgrid"><div class="panel reveal" style="display:grid;gap:16px">${admGate(as)}${as.state === 'soon' ? countdownHtml(as.opensAt) : ''}</div>${applyAside(p)}</div>`,
    mount: runCountdowns
  };
  return canForm ? applyForm(p, a, me || {}) : applyStatus(p, a, rec);
}
function applyStatus(p, a, rec) {
  const pn = programName(p), s = rec ? 'accepted' : a.status, id = `${S.user.uid}_${p}`, as = admState(p);
  const note = a?.decisionNote && ['incomplete', 'rejected', 'waitlist', 'accepted', 'review'].includes(a.status) ? a.decisionNote : '';
  const lead = { submitted: 'وصل طلبك، وهو بانتظار المراجعة.', review: 'طلبك قيد المراجعة الآن.', waitlist: 'طلبك في قائمة الانتظار، وسنبلغك عند توفّر مقعد.', rejected: 'نعتذر، لم يُقبل طلبك في هذه الدفعة.', withdrawn: 'سحبت طلبك.', accepted: 'مبارك! قُبلت في البرنامج.' }[s] || '';
  const row = (k, v) => v ? `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>` : '';
  return {
    over: true, docTitle: 'طلب الالتحاق — ' + pn,
    html: `${pageHead(pn, 'طلب الالتحاق')}<div class="wrap cgrid"><div style="display:grid;gap:24px;align-content:start">
      <div class="panel reveal"><div class="toolbar" style="margin-bottom:8px"><h2 class="grow" style="margin:0">حالة الطلب</h2>${stPill(APP_ST, s)}</div>
        <p class="prose">${lead}</p>${appSteps(a, rec)}
        ${note ? `<div class="dnote ${s === 'rejected' ? 'bad' : ''}"><b>${ic('info', 16)} ملاحظة الإدارة</b><p>${esc(note)}</p></div>` : ''}
        ${rec ? `<dl class="facts"><div><dt>الرقم الجامعي</dt><dd dir="ltr">${esc(rec.studentNo || '—')}</dd></div>${rec.cohort ? `<div><dt>الدفعة</dt><dd>${esc(rec.cohort)}</dd></div>` : ''}<div><dt>${p === 'academy' ? 'المستوى' : 'المسار'}</dt><dd>${esc(recLevel(rec))}</dd></div><div><dt>حالة القيد</dt><dd>${stPill(REC_ST, rec.status)}</dd></div></dl>` : ''}
        <div class="hero-cta">${rec ? `<a class="btn btn-primary" href="#/me">${ic('book', 17)} ملفي الأكاديمي وموادي</a>` : ''}
          ${a?.status === 'submitted' ? `<a class="btn btn-primary" href="#/apply/${p}?edit=1">${ic('edit', 16)} تعديل الطلب</a>` : ''}
          ${a?.status === 'withdrawn' && as.open ? `<a class="btn btn-primary" href="#/apply/${p}?edit=1">إعادة التقديم</a>` : ''}
          ${a && ['submitted', 'incomplete'].includes(a.status) && !rec ? `<button class="btn btn-ghost danger-t" id="wd">سحب الطلب</button>` : ''}
          <a class="btn btn-ghost" href="#/contact">${ic('mail', 16)} استفسار عن الطلب</a></div></div>
      ${a ? `<div class="panel reveal"><h2>البيانات المرسلة</h2><dl class="facts">${row('الاسم', a.name)}${row('الاسم بالإنجليزية', a.nameEn)}${row('تاريخ الميلاد', a.birthDate ? fmtDate(new Date(a.birthDate).getTime()) : '')}${row('الجنسية', a.nationality)}${row('الإقامة', [a.country, a.city].filter(Boolean).join(' — '))}${row('الجوال', a.phone)}${row('المؤهل', [optName(QUALS, a.qual), a.qualSpec].filter(Boolean).join(' — '))}${p === 'ijaza' ? row('المسار', trackName(a.track)) + row('العربية', optName(ARABIC_LV, a.arabic)) : ''}${row('صورة المؤهل', a.hasFile ? 'مرفوعة' : '')}${row('أُرسل في', a.submittedAt ? fmtDT(a.submittedAt) : '')}</dl></div>` : ''}
      </div>${applyAside(p)}</div>`,
    mount() {
      $('#wd') && ($('#wd').onclick = async () => {
        if (!(await confirmBox(`سحب طلبك على «${esc(pn)}»؟ يمكنك التقديم من جديد ما دام القبول مفتوحاً.`, 'سحب الطلب'))) return;
        try { await DB.update('applications', id, { status: 'withdrawn', updatedAt: Date.now() }); toast('سُحب الطلب'); route(); } catch (e) { toast(e.message, 'err'); }
      });
    }
  };
}
function applyForm(p, a, me) {
  const st = S.settings, pn = programName(p), id = `${S.user.uid}_${p}`, v = { ...me, ...(a || {}) };
  const opts = (list, sel, ph) => `${ph ? `<option value="">${ph}</option>` : ''}${list.map(([k, t]) => `<option value="${k}" ${sel === k ? 'selected' : ''}>${t}</option>`).join('')}`;
  const yr = new Date().getFullYear(), needFile = p === 'academy' && !v.hasFile;
  return {
    over: true, docTitle: 'التقديم — ' + pn,
    html: `${pageHead('التقديم على ' + pn, st.accredit)}<div class="wrap cgrid"><div style="display:grid;gap:20px;align-content:start">
      ${a?.status === 'incomplete' ? `<div class="dnote reveal"><b>${ic('info', 16)} طلبت الإدارة استكمال طلبك</b><p>${esc(a.decisionNote || 'راجع بياناتك وأكمل الناقص ثم أعد الإرسال.')}</p></div>` : ''}
      <form class="form panel reveal" id="af" novalidate>
        <fieldset class="fset"><legend>${ic('user', 17)} البيانات الشخصية</legend>
          <label>الاسم الكامل <span class="hint">كما في وثائقك الرسمية، ويُكتب على الشهادة</span><input name="name" required minlength="6" maxlength="80" value="${esc(v.name)}"></label>
          <label>الاسم بالإنجليزية <span class="hint">${p === 'academy' ? 'للشهادة الإنجليزية' : 'اختياري، للشهادة الإنجليزية'}</span><input name="nameEn" dir="ltr" maxlength="80" ${p === 'academy' ? 'required' : ''} value="${esc(v.nameEn)}" placeholder="e.g. Abdullah Ahmad Ali"></label>
          <div class="row"><label>تاريخ الميلاد<input type="date" name="birthDate" required max="${toDateInput(Date.now())}" value="${esc(v.birthDate)}"></label><label>الجنس<select name="gender" required>${opts(GENDERS, v.gender, 'اختر')}</select></label></div>
          <div class="row"><label>الجنسية<input name="nationality" required maxlength="40" value="${esc(v.nationality)}"></label><label>بلد الإقامة<input name="country" required maxlength="40" value="${esc(v.country)}"></label></div>
          <label>المدينة <span class="hint">اختياري</span><input name="city" maxlength="40" value="${esc(v.city)}"></label>
        </fieldset>
        <fieldset class="fset"><legend>${ic('whatsapp', 17)} التواصل</legend>
          <div class="row"><label>رقم الجوال <span class="hint">ويفضّل أن يكون عليه واتساب</span><input name="phone" type="tel" dir="ltr" required minlength="7" maxlength="20" value="${esc(v.phone)}"></label><label>البريد الإلكتروني <span class="hint">اختياري</span><input name="email" type="email" dir="ltr" maxlength="80" value="${esc(v.email)}"></label></div>
        </fieldset>
        <fieldset class="fset"><legend>${ic('award', 17)} المؤهل الدراسي</legend>
          <div class="row"><label>أعلى مؤهل حصلت عليه<select name="qual" required>${opts(QUALS, v.qual, 'اختر')}</select></label><label>التخصص أو الفرع <span class="hint">مثل: علمي، أدبي، شريعة</span><input name="qualSpec" maxlength="60" value="${esc(v.qualSpec)}"></label></div>
          <div class="row"><label>سنة الحصول عليه<input name="qualYear" type="number" min="1950" max="${yr}" value="${esc(v.qualYear)}"></label><label>الجهة المانحة <span class="hint">المدرسة أو الجامعة</span><input name="qualFrom" maxlength="80" value="${esc(v.qualFrom)}"></label></div>
          <div class="upl"><label class="upl-box" for="qf"><span class="upl-prev" id="qprev">${v.hasFile ? ic('check', 22) : ic('upload', 22)}</span><span><b id="qlbl">${v.hasFile ? 'صورة المؤهل مرفوعة — اضغط لاستبدالها' : 'صورة شهادة المؤهل'}</b><small>${p === 'academy' ? 'مطلوبة' : 'اختيارية'} — صورة واضحة JPG أو PNG من الهاتف تكفي</small></span></label><input type="file" id="qf" accept="image/*" hidden></div>
        </fieldset>
        ${p === 'ijaza' ? `<fieldset class="fset"><legend>${ic('book', 17)} مسار الإجازة</legend>
          <div class="tracks">${IJAZA_PLAN.map(t => `<label class="track"><input type="radio" name="track" value="${t.key}" required ${v.track === t.key ? 'checked' : ''}><span>${ic(t.icon, 22)}<b>${esc(t.title)}</b><small>${esc(t.book)}</small></span></label>`).join('')}</div>
          <div class="row"><label>مستوى اللغة العربية<select name="arabic" required>${opts(ARABIC_LV, v.arabic, 'اختر')}</select></label><label>مقدار ما تحفظه من القرآن <span class="hint">مثل: 5 أجزاء</span><input name="quranAmt" maxlength="60" value="${esc(v.quranAmt)}"></label></div>
          <label>إجازات أو سند سابق <span class="hint">اختياري — اذكر الشيخ والرواية أو الكتاب</span><input name="priorIjaza" maxlength="160" value="${esc(v.priorIjaza)}"></label>
        </fieldset>` : ''}
        <fieldset class="fset"><legend>${ic('pen', 17)} عن رغبتك</legend>
          <label>لماذا ترغب في الالتحاق بهذا البرنامج؟<textarea name="motivation" required minlength="20" maxlength="1500" rows="4">${esc(v.motivation)}</textarea></label>
          <label>كيف عرفت ${esc(st.name)}؟ <span class="hint">اختياري</span><select name="heard"><option value="">—</option>${HEARD.map(h => `<option ${v.heard === h ? 'selected' : ''}>${h}</option>`).join('')}</select></label>
        </fieldset>
        <div class="issues" id="iss" hidden></div>
        <label class="check"><input type="checkbox" name="pledge" required ${v.pledge ? 'checked' : ''}> أقرّ بصحة البيانات، وألتزم بنظام الدراسة في ${esc(st.name)}${st.terms ? ` و<a href="#/terms" target="_blank" style="color:var(--teal)">الشروط</a>` : ''}.</label>
        <div class="form-err" id="err"></div>
        <div class="hero-cta" style="margin:0"><button class="btn btn-primary">${a?.status === 'incomplete' ? 'إرسال الاستكمال' : a ? 'حفظ وإرسال الطلب' : 'إرسال الطلب'}</button>${a ? `<a class="btn btn-ghost" href="#/apply/${p}">إلغاء</a>` : ''}</div>
      </form></div>${applyAside(p)}</div>`,
    mount() {
      const f = $('#af'); let file = null;
      const vals = () => { const fd = new FormData(f); return Object.fromEntries(['name', 'nameEn', 'birthDate', 'gender', 'nationality', 'country', 'city', 'phone', 'email', 'qual', 'qualSpec', 'qualYear', 'qualFrom', 'track', 'arabic', 'quranAmt', 'priorIjaza', 'motivation', 'heard'].map(k => [k, String(fd.get(k) ?? '').trim()])); };
      const check = () => {
        const x = admissionIssues(p, { ...vals(), hasFile: true }), box = $('#iss');
        box.hidden = !x.hard.length && !x.soft.length;
        box.innerHTML = x.hard.map(t => `<p class="bad">${ic('ban', 16)} ${esc(t)}</p>`).join('') + x.soft.map(t => `<p>${ic('info', 16)} ${esc(t)}</p>`).join('');
        return x;
      };
      f.oninput = check; f.onchange = check; check();
      $('#qf').onchange = async e => {
        const fl = e.target.files[0]; if (!fl) return; $('#qlbl').textContent = 'جارٍ تجهيز الصورة…';
        try { file = await compressImage(fl); $('#qprev').innerHTML = `<img src="${file}" alt="">`; $('#qlbl').textContent = fl.name; }
        catch (err) { file = null; $('#qlbl').textContent = err.message; toast(err.message, 'err'); }
      };
      f.onsubmit = async e => {
        e.preventDefault(); $('#err').textContent = '';
        if (!f.checkValidity()) { f.reportValidity(); return; }
        const d = vals(), x = check();
        if (x.hard.length) { $('#err').textContent = 'لا يمكن إرسال الطلب: ' + x.hard[0]; return; }
        if (needFile && !file) { $('#err').textContent = 'ارفع صورة شهادة المؤهل الدراسي.'; return; }
        const b = $('button', f); b.disabled = true;
        try {
          const now = Date.now();
          if (file) await DB.set('appFiles', id, { uid: S.user.uid, program: p, data: file, name: 'qualification.jpg', at: now });
          const data = { ...d, uid: S.user.uid, program: p, track: p === 'ijaza' ? d.track : '', userName: d.name, username: S.user.username || '', pledge: true, hasFile: !!(file || v.hasFile), status: 'submitted', updatedAt: now, submittedAt: a?.status === 'submitted' ? a.submittedAt || now : now };
          if (p !== 'ijaza') for (const k of ['arabic', 'quranAmt', 'priorIjaza']) data[k] = '';
          if (a) await DB.update('applications', id, data); else await DB.set('applications', id, data);
          DB.update('users', S.user.uid, { name: d.name, nameEn: d.nameEn, phone: d.phone }).then(() => { S.user.name = d.name; }).catch(() => {});
          toast(a?.status === 'incomplete' ? 'أُرسل الاستكمال' : 'أُرسل طلبك — تابع حالته من هنا', 'ok'); goOrRoute(`/apply/${p}`);
        } catch (err) { $('#err').textContent = /permission|insufficient/i.test(err.message) ? 'تعذّر الإرسال: القبول مغلق أو الطلب لا يقبل التعديل الآن.' : err.message; b.disabled = false; }
      };
    }
  };
}
/* بوابة مواد البرنامجين لمن لم يُسجَّل فيها: القبول، حالة القيد، أو قفل الفصول التالية */
function progGate(c, rec, compact) {
  const pn = programName(c.program); let head, sub, btn = '', icon = 'lock';
  if (!rec) { head = `هذه المادة لطلاب ${pn}`; sub = c.program === 'academy' ? 'تُفتح بعد قبولك وقيدك في فصلها، فتُسجَّل فيها تلقائياً.' : 'تُفتح بعد قبولك في البرنامج.'; btn = `<a class="btn btn-sm btn-brass" href="#/apply/${c.program}">قدّم على البرنامج</a>`; }
  else if (rec.status === 'completed') { head = 'أنهيت مواد البرنامج'; sub = 'هذه المادة ليست ضمن فصولك.'; icon = 'award'; }
  else if (rec.status !== 'active') { head = 'قيدك في البرنامج غير منتظم'; sub = `حالة القيد: ${(REC_ST[rec.status] || [rec.status])[0]}. تواصل مع الإدارة.`; }
  else if (c.program === 'academy') {
    btn = `<a class="btn btn-sm btn-brass" href="#/me">ملفي الأكاديمي</a>`;
    if (+c.term > +rec.level) { head = `مقفلة — من ${termLabel(c.term) || 'فصل لاحق'}`; sub = `أنت الآن في ${termLabel(rec.level)}. تُفتح مواد كل فصل بعد إنهاء الفصل الذي قبله، فتُسجَّل فيها تلقائياً.`; }
    else if (+c.term < +rec.level) { head = `من ${termLabel(c.term)}`; sub = 'مادة من فصل سابق لم تُسجَّل فيها — تواصل مع الإدارة إن كانت مطلوبة منك.'; icon = 'info'; }
    else { head = 'من مواد فصلك الحالي'; sub = 'تُسجَّل فيها تلقائياً مع قيدك في الفصل الدراسي. إن لم تظهر في موادك فتواصل مع الإدارة.'; icon = 'calendar'; }
  }
  else { head = 'هذه المادة من مسار آخر'; sub = `مسارك في البرنامج: ${trackName(rec.track) || '—'}.`; }
  return `<div class="gate ${compact ? 'compact' : ''}"><strong>${ic(icon, 17)} ${esc(head)}</strong><small>${esc(sub)}</small>${btn}</div>`;
}
/* الخطة الدراسية للطالب: فصول منجزة، الفصل الحالي، وفصول مقفلة حتى إنهاء ما قبلها */
function studyPlan(r, regs, courses, enrIds) {
  const st = r.status === 'completed' ? 5 : +r.level || 1;
  return `<div class="splan">${[1, 2, 3, 4].map(l => {
    const cs = courses.filter(c => c.program === 'academy' && +c.term === l && c.published).sort(planSort), g = regs.filter(x => +x.level === l).sort((x, y) => y.at - x.at)[0];
    const k = l < st ? 'done' : l === st ? 'cur' : 'lock';
    const tag = k === 'done' ? `${ic('check', 14)} منجز${g ? ' — ' + esc(g.termName) : ''}` : k === 'cur' ? (g ? `${ic('calendar', 14)} ${esc(g.termName)}` : `${ic('clock', 14)} بانتظار القيد في فصل`) : `${ic('lock', 14)} يُفتح بعد إنهاء ${TERM_NAMES[l - 1]}`;
    return `<details class="sp-step ${k}" ${k === 'cur' ? 'open' : ''}><summary><span class="sp-n">${l}</span><span class="grow"><b>${esc(termLabel(l))}</b><small>${tag}</small></span><small class="muted">${cs.length ? nMawad(cs.length) : ''}</small></summary>
      ${cs.length ? `<div class="sp-courses">${cs.map(c => { const on = enrIds.has(c.id); return on ? `<a class="reg-row" href="#/course/${c.id}">${ic(c.icon || 'book', 15)}<span class="grow"><b>${esc(c.title)}</b></span>${ic('prev', 14)}</a>` : `<div class="reg-row off">${ic(k === 'lock' ? 'lock' : c.icon || 'book', 15)}<span class="grow">${esc(c.title)}</span></div>`; }).join('')}</div>` : '<p class="muted" style="margin:8px 0 0">لم تُنشر مواد هذا الفصل بعد.</p>'}
    </details>`;
  }).join('')}</div>`;
}
/* بطاقة الفصل الجاري أو القادم للطالب: مدته وفترة امتحاناته وأقرب مواعيده */
function termCard(t, courses, mine) {
  const now = Date.now(), ev = termEvents(t, courses).filter(e => (e.to || e.from) >= now - 86400000 && (e.kind !== 'exam' || !e.courseId || mine.has(e.courseId))).slice(0, 4);
  return `<div class="term-cta"><div class="grow"><b>${ic('calendar', 16)} ${esc(t.name)} ${termPhasePill(t)}</b><small>${dateRange(t.startsAt, t.endsAt)}${+t.examStart ? ` · الامتحانات: ${dateRange(t.examStart, t.examEnd)}` : ''}</small>
    ${ev.length ? `<div class="mini-cal">${ev.map(e => `<span>${ic(e.ic, 13)} ${esc(e.course ? e.course : e.title)} — ${dateRange(e.from, e.to)}</span>`).join('')}</div>` : ''}</div>
    <a class="btn btn-ghost btn-sm" style="color:#fff;border-color:rgba(255,255,255,.35)" href="#/calendar">التقويم الأكاديمي</a></div>`;
}
/* الملف الأكاديمي في «حسابي»: القيد والدفعة والخطة الدراسية وحالة الطلبات */
function acadSection(apps, recs, regs, terms, courses, enr) {
  const st = S.settings, enrIds = new Set(enr.map(e => e.courseId));
  if (!apps.length && !recs.length) return `<div class="acad-invite reveal">${ic('award', 28)}<div class="grow"><h3>انضم إلى أحد برنامجي ${esc(st.name)}</h3><p class="muted">${esc(st.accredit)}</p></div><a class="btn btn-brass" href="#/apply">قدّم الآن</a></div>`;
  const recCard = r => {
    const my = regs.filter(g => g.program === r.program);
    const cur = r.program === 'academy' ? my.map(g => terms.find(t => t.id === g.termId)).filter(t => t && !t.closedAt).sort(termSort)[0] : null;
    const ijc = r.program === 'ijaza' ? courses.filter(c => eligibleFor(c, r) && c.published) : [];
    return `<div class="acad reveal ${r.program === 'academy' ? 'wide' : ''}"><div class="acad-h"><div class="grow"><span class="prog-n">${esc(programName(r.program))}</span><h3>${esc(r.status === 'completed' ? 'أنهى مواد البرنامج' : recLevel(r))}</h3></div>${stPill(REC_ST, r.status)}</div>
      <dl class="facts"><div><dt>الرقم الجامعي</dt><dd dir="ltr">${esc(r.studentNo || '—')}</dd></div><div><dt>الدفعة</dt><dd>${esc(r.cohort || '—')}</dd></div><div><dt>تاريخ القبول</dt><dd>${fmtDate(r.admittedAt)}</dd></div></dl>
      ${cur ? termCard(cur, courses, enrIds) : r.program === 'academy' && r.status === 'active' ? `<p class="muted" style="margin:14px 0 0">${ic('clock', 15)} تُقيَّد في فصلك الدراسي من الإدارة، فتُسجَّل في مواده تلقائياً وتظهر هنا.</p>` : ''}
      ${r.program === 'academy' ? `<h4 class="sp-h">خطتي الدراسية</h4>${studyPlan(r, my, courses, enrIds)}` : ''}
      ${ijc.length ? `<div class="regs"><h4>موادي في البرنامج</h4>${ijc.map(c => `<a class="reg-row" href="#/course/${c.id}">${ic(c.icon || 'book', 15)}<span class="grow"><b>${esc(c.title)}</b></span>${ic('prev', 14)}</a>`).join('')}</div>` : ''}
    </div>`;
  };
  const pending = apps.filter(a => !recs.some(r => r.program === a.program));
  return `<div class="acads">${recs.map(recCard).join('')}${pending.map(a => `<a class="acad acad-app reveal" href="#/apply/${a.program}"><div class="acad-h"><div class="grow"><span class="prog-n">طلب الالتحاق</span><h3>${esc(programName(a.program))}</h3></div>${stPill(APP_ST, a.status)}</div><small class="muted">${a.status === 'incomplete' ? 'طلبت الإدارة استكمال طلبك — اضغط للاستكمال.' : `أُرسل في ${fmtDate(a.submittedAt)} — اضغط لمتابعة حالته.`}</small></a>`).join('')}</div>`;
}

/* ================= التقويم الأكاديمي (عام) ================= */
async function viewCalendar() {
  const [terms, courses] = await Promise.all([safeList('terms'), safeList('courses')]);
  const list = terms.filter(t => (t.program || 'academy') === 'academy').sort(termSort), now = Date.now();
  const cur = list.find(t => !t.closedAt && (!+t.endsAt || now <= +t.endsAt));
  const card = t => { const ev = termEvents(t, courses.filter(c => c.published)), k = termPhaseKey(t);
    return `<section class="panel reveal cal-term ${t === cur ? 'now' : ''} ${k === 'closed' ? 'past' : ''}" id="t-${t.id}"><div class="acad-h"><div class="grow"><span class="prog-n">${t === cur ? 'الفصل الحالي' : k === 'upcoming' ? 'فصل قادم' : 'فصل سابق'}</span><h2>${esc(t.name)}</h2></div>${termPhasePill(t)}</div>
      <dl class="facts"><div><dt>بداية الدراسة</dt><dd>${fmtDate(t.startsAt)}</dd></div><div><dt>نهاية الفصل</dt><dd>${fmtDate(t.endsAt)}</dd></div><div><dt>الامتحانات النهائية</dt><dd>${+t.examStart ? dateRange(t.examStart, t.examEnd) : 'تُعلن لاحقاً'}</dd></div></dl>
      ${ev.length ? `<div class="cal-list" style="margin-top:16px">${ev.map(e => `<div class="cal-ev k-${e.kind} ${(e.to || e.from) < now ? 'gone' : ''}">${ic(e.ic, 16)}<span class="grow"><b>${esc(e.kind === 'exam' && e.course ? 'امتحان ' + e.course : e.title)}</b>${e.kind === 'exam' && e.course && e.title && e.title !== 'امتحان' ? `<small>${esc(e.title)}</small>` : ''}</span><small>${dateRange(e.from, e.to)}</small></div>`).join('')}</div>` : ''}</section>`; };
  return {
    over: true, docTitle: 'التقويم الأكاديمي',
    html: `${pageHead('التقويم الأكاديمي', programName('academy'))}<div class="wrap progs-page" style="max-width:860px">
      ${list.length ? list.map(card).join('') : `<div class="empty">${ic('calendar', 36)}<p>لم يُعلن التقويم الأكاديمي بعد.</p></div>`}</div>`,
    mount() { cur && setTimeout(() => document.getElementById('t-' + cur.id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }), 80); }
  };
}

/* ================= حساب الطالب ================= */
async function viewMe() {
  const [enr, certs, courses, att, apps, recs, regs, terms] = await Promise.all([safeList('enrollments', { uid: S.user.uid }), safeList('certificates', { uid: S.user.uid }), safeList('courses'), safeList('attempts', { uid: S.user.uid }),
    safeList('applications', { uid: S.user.uid }), safeList('records', { uid: S.user.uid }), safeList('regs', { uid: S.user.uid }), safeList('terms')]);
  const cm = Object.fromEntries(courses.map(c => [c.id, c]));
  const mine = enr.map(e => { const c = cm[e.courseId]; if (!c) return null; const ls = c.lessons || []; return { c, pct: ls.length ? Math.round(ls.filter(l => (e.completed || []).includes(l.id)).length / ls.length * 100) : 0, at: e.lastAt || e.enrolledAt }; }).filter(Boolean).sort((a, b) => b.at - a.at);
  const h = new Date().getHours();
  /* امتحاناتي: القادمة والمفتوحة والمسلّمة بانتظار النتيجة والنتائج المعلنة حديثاً */
  const offC = mine.filter(m => +m.c.offExams).map(m => m.c);
  const exl = (await Promise.all(offC.map(c => safeList('exams', { courseId: c.id, published: true })))).flat().filter(e => examPhase(e) !== 'closed' || Date.now() - (+e.closesAt || 0) < 60 * 864e5);
  const mx = exl.length ? await myExams(exl.sort(examSort), S.user.uid) : [];
  const exByC = offC.map(c => ({ c, l: mx.filter(x => x.e.courseId === c.id) })).filter(g => g.l.length);
  /* لقاءاتي المباشرة: الجاري الآن أولاً، ثم أقرب لقاء لكل دورة */
  const onl = mine.filter(m => m.c.online), lvs = await Promise.all(onl.map(m => safeGet('courseLive', m.c.id)));
  const lives = onl.map((m, i) => { const lv = lvs[i] || {}, st = liveState(lv), url = liveNowUrl(lv, st); return { c: m.c, s: st.live || st.next, on: !!st.live, url, p: meetInfo(url)?.p || m.c.livePlatform || 'other' }; })
    .filter(x => x.s || x.url).sort((a, b) => (b.on - a.on) || ((a.s?.at || Infinity) - (b.s?.at || Infinity)));
  return {
    docTitle: 'حسابي',
    html: `<div class="wrap"><div class="me-head reveal"><p class="muted">${h < 12 ? 'صباح الخير' : 'مساء الخير'}</p><h1>${esc(S.user.name)}</h1>
      <div class="hero-cta" style="margin-top:14px"><a class="btn btn-primary" href="#/courses">${ic('plus', 17)} دورة جديدة</a><button class="btn btn-ghost" data-act="logout">${ic('logout', 17)} تسجيل الخروج</button></div></div>
      <h2 style="margin-bottom:18px">ملفي الأكاديمي</h2>${acadSection(apps, recs, regs, terms.filter(t => (t.program || 'academy') === 'academy'), courses, enr)}
      <div class="stats reveal" style="margin:40px 0"><div class="stat"><b data-count="${mine.length}">0</b><span>دورة مسجّلة</span></div><div class="stat"><b data-count="${mine.filter(m => m.pct === 100).length}">0</b><span>دورة مكتملة الدروس</span></div><div class="stat"><b data-count="${certs.length}">0</b><span>شهادة</span></div><div class="stat"><b data-count="${att.length}">0</b><span>محاولة اختبار</span></div></div>
      ${lives.length ? `<h2 style="margin-bottom:18px">لقاءاتي المباشرة</h2><div class="live-list reveal" style="margin-bottom:40px">${lives.map(x => `<div class="chan live-row ${x.on ? 'on' : ''}">${meetBadge(x.p)}<span class="grow"><a href="#/course/${x.c.id}"><strong>${esc(x.c.title)}</strong></a><small>${x.on ? `<b class="live-tag"><span class="dot" aria-hidden="true"></span> جارٍ الآن</b> ${esc(x.s.title)}` : x.s ? `${fmtSess(x.s)} — ${esc(x.s.title)}` : esc(x.c.liveSchedule || 'رابط ثابت للقاءات')}</small></span>${x.url ? `<a class="btn btn-sm ${x.on ? 'btn-brass' : 'btn-ghost'}" href="${esc(x.url)}" target="_blank" rel="noopener">${ic('video', 15)} ${x.on ? 'انضم الآن' : 'الرابط'}</a>` : ''}</div>`).join('')}</div>` : ''}
      ${exByC.length ? `<h2 style="margin-bottom:18px">امتحاناتي</h2><div class="xgroups reveal" style="margin-bottom:40px">${exByC.map(g => `<div class="panel"><a href="#/course/${g.c.id}"><h3 style="font-size:1.1rem;margin-bottom:4px">${esc(g.c.title)}</h3></a>${examRows(g.l, true)}</div>`).join('')}</div>` : ''}
      <h2 style="margin-bottom:18px">دوراتي</h2>
      ${mine.length ? `<div class="grid-c">${mine.map(m => courseCard(m.c, m.pct)).join('')}</div>` : `<div class="empty">${ic('book', 36)}<p style="margin-bottom:14px">لم تسجّل في أي دورة بعد.</p><a class="btn btn-primary" href="#/courses">تصفّح الدورات</a></div>`}
      <h2 style="margin:46px 0 18px">شهاداتي</h2>
      ${certs.length ? `<div style="display:grid;gap:10px;margin-bottom:70px">${certs.map(ct => `<a class="cert-row reveal" href="#/cert/${ct.id}">${ic('award', 28)}<div style="flex:1"><strong>${esc(ct.courseTitle)}</strong><br><small class="muted">${fmtDate(ct.issuedAt)}${ct.score != null ? ` — ${ct.score}%` : ''}</small></div><small dir="ltr" class="muted">${esc(ct.id)}</small></a>`).join('')}</div>` : `<div class="empty" style="margin-bottom:70px">${ic('award', 36)}<p>تظهر شهاداتك هنا عند إتمام الدورات واجتياز اختباراتها.</p></div>`}
    </div>`,
  };
}


/* ================= تعريف التطبيق ================= */
const APP = {
  layout: v => v.layout === 'bare' ? v.html : header(v.over) + `<main>${v.html}</main>` + footer(),
  routes: [
    [/^\/?$/, viewHome], [/^\/courses(?:\?.*)?$/, viewCourses], [/^\/programs(?:#.*)?$/, viewPrograms], [/^\/ijaza\/([^/]+)$/, viewIjaza], [/^\/course\/([^/]+)$/, viewCourse],
    [/^\/learn\/([^/]+)(?:\/([^/]*))?$/, viewLearn, 'student'], [/^\/exam\/([^/]+)$/, viewExam, 'student'], [/^\/test\/([^/]+)$/, viewTest, 'student'],
    [/^\/apply(?:\/([^/]+))?$/, viewApply], [/^\/login$/, viewLogin], [/^\/register$/, viewRegister], [/^\/me$/, viewMe, 'student'],
    [/^\/cert\/([^/]+)(?:\/(ar|en))?$/, viewCert], [/^\/verify$/, viewVerify],
    [/^\/calendar$/, viewCalendar], [/^\/about$/, viewAbout], [/^\/contact$/, viewContact], [/^\/terms$/, viewTerms]
  ],
  guard(g, path) {
    if (g !== 'student' || (S.user && !S.user.isAdmin)) return false;
    if (S.user?.isAdmin) { toast('هذه صفحة للطلاب — أنت داخل بحساب المشرف'); go('/'); return true; }
    sessionStorage.setItem('bayan_next', path); toast('سجّل دخولك للمتابعة'); go('/login'); return true;
  },
  afterLogout() { go('/'); }
};
boot();
