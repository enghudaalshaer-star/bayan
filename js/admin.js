'use strict';
/* بيان — لوحة التحكم (admin.html). منفصلة عن الموقع بجلسة دخول مستقلة. يعتمد على core.js */
S.scope = 'admin';
function adminShell(active, title, html, actions = '') {
  const items = [['', 'لوحة المؤشرات', 'chart'], ['courses', 'الدورات', 'book'], ['admissions', 'القبول', 'file'], ['registry', 'القيد والفصول', 'calendar'], ['students', 'الطلاب', 'users'], ['results', 'نتائج الاختبارات', 'quiz'], ['certs', 'الشهادات', 'award'], ['messages', 'الرسائل', 'inbox'], ['settings', 'الإعدادات', 'settings']];
  return `<div class="admin"><aside class="side" id="side">
    <a class="logo" href="#/">${logoMark()}<span>${esc(S.settings.name)}</span><em>إدارة</em></a>
    <nav>${items.map(([k, t, i]) => `<a class="side-link ${active === k ? 'on' : ''}" href="#/${k}">${ic(i, 19)} ${t}${k === 'messages' ? `<span class="side-badge" id="unread" ${S.unread ? '' : 'hidden'}>${S.unread || ''}</span>` : k === 'admissions' ? `<span class="side-badge" id="newapps" ${S.newApps ? '' : 'hidden'}>${S.newApps || ''}</span>` : ''}</a>`).join('')}</nav>
    <div class="side-foot"><a class="side-link" href="index.html" target="_blank">${ic('home', 19)} عرض الموقع</a><button class="side-link" data-act="theme">${ic(isDark() ? 'sun' : 'moon', 19)} تبديل المظهر</button><button class="side-link" data-act="logout">${ic('logout', 19)} تسجيل الخروج</button></div>
  </aside><main class="admin-main">
    <div class="admin-top"><button class="icon-btn menu-btn" data-act="side" aria-label="القائمة">${ic('menu', 18)}</button><h1>${title}</h1>${actions}<span class="mode-badge ${S.live ? 'live' : ''}">${S.live ? 'متصل بـ Firebase' : 'وضع تجريبي'}</span></div>
    ${html}</main></div>`;
}
/* ================= لوحة التحكم ================= */
async function loadAll() {
  const [users, courses, enrollments, attempts, certificates, records, applications] = await Promise.all(['users', 'courses', 'enrollments', 'attempts', 'certificates', 'records', 'applications'].map(c => safeList(c)));
  return { users, courses, enrollments, attempts, certificates, records, applications };
}
async function adminDash() {
  const d = await loadAll();
  const avg = d.attempts.length ? Math.round(d.attempts.reduce((a, x) => a + x.score, 0) / d.attempts.length) : 0;
  const passRate = d.attempts.length ? Math.round(d.attempts.filter(a => a.passed).length / d.attempts.length * 100) : 0;
  const per = d.courses.map(c => ({ t: c.title, n: d.enrollments.filter(e => e.courseId === c.id).length })).sort((a, b) => b.n - a.n).slice(0, 8);
  const mx = Math.max(1, ...per.map(p => p.n));
  const recent = [...d.attempts].sort((a, b) => b.at - a.at).slice(0, 7);
  const newSt = [...d.users].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 6);
  const kpi = (i, n, t, suf = '') => `<div class="kpi">${ic(i, 22)}<b><span data-count="${n}">0</span>${suf}</b><span>${t}</span></div>`;
  return {
    active: '', title: 'لوحة المؤشرات',
    html: `<div class="kpis">${kpi('file', d.applications.filter(a => ['submitted', 'review'].includes(a.status)).length, 'طلب التحاق بانتظار القرار')}${kpi('shield', d.records.filter(r => r.status === 'active').length, 'طالب منتظم في البرامج')}${kpi('users', d.users.length, 'حساب طالب')}${kpi('book', d.courses.filter(c => c.published).length, `دورة منشورة من ${d.courses.length}`)}${kpi('play', d.enrollments.length, 'تسجيل في الدورات')}${kpi('award', d.certificates.length, 'شهادة صادرة')}${kpi('chart', avg, 'متوسط درجات الاختبارات', '%')}${kpi('check', passRate, 'نسبة النجاح', '%')}</div>
      <div class="cols">
        <div class="panel"><h3>التسجيل حسب الدورة</h3>${per.length ? `<div class="hbars">${per.map(p => `<div class="hbar"><span class="t" title="${esc(p.t)}">${esc(p.t)}</span><div class="track"><i data-w="${Math.round(p.n / mx * 100)}"></i></div><b>${p.n}</b></div>`).join('')}</div>` : '<p class="muted">لا توجد دورات بعد.</p>'}</div>
        <div class="panel"><h3>أحدث الطلاب</h3>${newSt.length ? `<div class="rowlist">${newSt.map(u => `<div class="ritem"><span class="n tick">${ic('user', 14)}</span><div class="grow"><strong>${esc(u.name)}</strong><br><small dir="ltr">${esc(u.username)}</small></div><small>${fmtDate(u.createdAt)}</small></div>`).join('')}</div>` : '<p class="muted">لا يوجد طلاب بعد.</p>'}</div>
      </div>
      <div class="panel" style="margin-top:20px"><h3>أحدث محاولات الاختبار</h3>${recent.length ? `<div class="tbl-wrap"><table><thead><tr><th>الطالب</th><th>الدورة</th><th>الدرجة</th><th>النتيجة</th><th>الوقت</th></tr></thead><tbody>${recent.map(a => `<tr><td>${esc(a.userName)}</td><td>${esc(a.courseTitle)}</td><td>${a.score}%</td><td><span class="pill ${a.passed ? 'ok' : 'no'}">${a.passed ? 'ناجح' : 'لم ينجح'}</span></td><td>${fmtDT(a.at)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">لم يُجرِ أحد اختباراً بعد.</p>'}</div>`
  };
}

async function adminCourses() {
  const [courses, enr] = await Promise.all([DB.list('courses'), DB.list('enrollments')]);
  const pr = c => ({ academy: 0, ijaza: 1 })[c.program] ?? 2;
  courses.sort((a, b) => pr(a) - pr(b) || (pr(a) < 2 ? planSort(a, b) : (b.createdAt || 0) - (a.createdAt || 0)));
  const missing = academyCourses().filter(p => !courses.some(c => c.title.trim() === p.title || (p.program === 'ijaza' && c.program === 'ijaza' && (c.ijazaKey === p.ijazaKey || c.title.includes(p.title)))));
  return {
    active: 'courses', title: 'الدورات', actions: `${missing.length ? `<button class="btn btn-ghost btn-sm" id="impPlan" title="إنشاء مواد البرنامجين كمسودات">${ic('download', 16)} استيراد الخطة الدراسية (${missing.length})</button>` : ''}<button class="btn btn-primary btn-sm" id="newC">${ic('plus', 16)} دورة جديدة</button>`,
    html: courses.length ? `<div class="tbl-wrap"><table><thead><tr><th>الدورة</th><th>البرنامج</th><th>التصنيف</th><th>الدروس</th><th>الأسئلة</th><th>المسجّلون</th><th>التسجيل</th><th>الحالة</th><th></th></tr></thead><tbody>
      ${courses.map(c => `<tr><td><a href="#/course/${c.id}" style="display:flex;align-items:center;gap:10px"><span style="width:34px;height:34px;border-radius:10px;display:grid;place-items:center;color:#fff;background:linear-gradient(135deg,${(THEMES[c.theme] || THEMES.teal).join(',')})">${ic(c.icon || 'book', 17)}</span><strong>${esc(c.title)}</strong>${c.online ? `<span class="pill ok" title="دورة أونلاين بلقاءات مباشرة" style="display:inline-flex;gap:4px;align-items:center">${ic('video', 13)} مباشر</span>` : ''}</a></td><td>${c.program ? `${esc(programName(c.program))}${termLabel(c.term) ? `<br><small class="muted">${esc(termLabel(c.term))}</small>` : ''}` : '<span class="muted">عامة</span>'}</td><td>${esc(c.category || '—')}</td><td>${(c.lessons || []).length}</td><td>${(c.exam?.questions || []).length}</td><td>${enr.filter(e => e.courseId === c.id).length}</td>
        <td>${(() => { const es = enrollState(c); return `<span class="pill ${es.open ? 'ok' : es.state === 'soon' ? 'mut' : 'no'}" title="${esc(enrollLabel(es) || 'مفتوح دائماً')}">${es.state === 'always' ? 'مفتوح' : es.state === 'open' ? 'مفتوح مؤقتاً' : es.state === 'soon' ? 'قريباً' : 'مغلق'}</span>`; })()}</td>
        <td><button class="pill ${c.published ? 'ok' : 'mut'}" style="border:0;cursor:pointer" data-pub="${c.id}" title="تبديل حالة النشر">${c.published ? 'منشورة' : 'مسودة'}</button></td>
        <td><div class="acts"><a class="icon-btn sm" href="index.html#/course/${c.id}" target="_blank" title="عرض">${ic('eye', 16)}</a><a class="icon-btn sm" href="#/course/${c.id}" title="تعديل">${ic('edit', 16)}</a><button class="icon-btn sm danger" data-del="${c.id}" title="حذف">${ic('trash', 16)}</button></div></td></tr>`).join('')}
      </tbody></table></div>` : `<div class="empty">${ic('book', 36)}<p>لا توجد دورات بعد. أنشئ أول دورة، أو أضف بيانات تجريبية من الإعدادات.</p></div>`,
    mount() {
      $('#newC').onclick = () => modal('دورة جديدة', `<label>عنوان الدورة<input name="title" required></label><label>التصنيف<input name="category" list="cats" required><datalist id="cats">${CATS.map(c => `<option value="${c}">`).join('')}</datalist></label>`, {
        submitText: 'إنشاء ومتابعة', onSubmit: async fd => { const id = genId(); await DB.set('courses', id, { title: fd.get('title').trim(), category: fd.get('category').trim(), level: 'مبتدئ', theme: 'teal', icon: 'book', summary: '', description: '', instructor: '', published: false, lessons: [], exam: DEFAULT_EXAM(), createdAt: Date.now() }); go('/course/' + id); }
      });
      $('#impPlan') && ($('#impPlan').onclick = async () => {
        if (!(await confirmBox(`ستُنشأ ${missing.length} مادة من الخطة الدراسية (البرنامج الأكاديمي وبرنامج الإجازات) كمسودات، مع الكتاب المقرّر والمؤلف وعدد الساعات. المواد الموجودة بنفس الاسم لن تتكرر. أضف الدروس والاختبار لكل مادة ثم انشرها.`, 'استيراد'))) return;
        try { for (const c of missing) await DB.set('courses', genId(), c); toast(`أُضيفت ${missing.length} مادة كمسودات`, 'ok'); route(); } catch (err) { toast(err.message, 'err'); }
      });
      $('.admin-main').onclick = async e => {
        const p = e.target.closest('[data-pub]'), d = e.target.closest('[data-del]');
        if (p) { const c = courses.find(x => x.id === p.dataset.pub); c.published = !c.published; await DB.update('courses', c.id, { published: c.published }); p.className = 'pill ' + (c.published ? 'ok' : 'mut'); p.textContent = c.published ? 'منشورة' : 'مسودة'; toast(c.published ? 'نُشرت الدورة' : 'أصبحت الدورة مسودة', 'ok'); }
        if (d) { const c = courses.find(x => x.id === d.dataset.del); if (await confirmBox(`حذف دورة «${esc(c.title)}» نهائياً؟ لن تُحذف شهادات الطلاب الصادرة.`, 'حذف')) { await DB.del('courses', c.id); await DB.del('courseLive', c.id).catch(() => {}); toast('حُذفت الدورة'); route(); } }
      };
    }
  };
}

async function adminCourse(id) {
  const [c, ctypes, lv0] = await Promise.all([DB.get('courses', id), safeList('certTypes'), safeGet('courseLive', id)]);
  if (!c) return { active: 'courses', title: 'غير موجودة', html: '<div class="empty">الدورة غير موجودة.</div>' };
  c.lessons = c.lessons || []; c.exam = { ...DEFAULT_EXAM(), ...(c.exam || {}) };
  const lv = { url: '', meetingId: '', passcode: '', note: '', sessions: [], ...(lv0 || {}) }; delete lv.id;
  const saveLive = async () => { lv.updatedAt = Date.now(); await DB.set('courseLive', c.id, lv); };
  const save = async () => { c.updatedAt = Date.now(); await DB.set('courses', c.id, c); };
  return {
    active: 'courses', title: esc(c.title),
    actions: `<a class="btn btn-ghost btn-sm" href="#/courses">${ic('prev', 16)} الدورات</a><a class="btn btn-ghost btn-sm" href="index.html#/course/${c.id}" target="_blank">${ic('eye', 16)} معاينة</a>`,
    html: `<div class="tabs" role="tablist"><button class="tab on" data-t="info">بيانات الدورة</button><button class="tab" data-t="lessons">الدروس <span class="pill mut" id="lc">${c.lessons.length}</span></button><button class="tab" data-t="exam">الاختبار <span class="pill mut" id="qc">${c.exam.questions.length}</span></button><button class="tab" data-t="live">${ic('video', 15)} اللقاءات المباشرة <span class="pill ${c.online ? 'ok' : 'mut'}" id="lvc">${c.online ? (lv.sessions || []).length : 'معطّلة'}</span></button></div>
      <div id="pane"></div>`,
    mount() {
      const pane = $('#pane'); let tab = 'info';
      $$('.tab').forEach(t => t.onclick = () => { tab = t.dataset.t; $$('.tab').forEach(x => x.classList.toggle('on', x === t)); draw(); });
      const counts = () => { $('#lc').textContent = c.lessons.length; $('#qc').textContent = c.exam.questions.length; };
      const draw = () => { ({ info, lessons, exam, live })[tab](); };
      const liveCount = () => { const p = $('#lvc'); p.className = 'pill ' + (c.online ? 'ok' : 'mut'); p.textContent = c.online ? lv.sessions.length : 'معطّلة'; };
      const info = () => {
        pane.innerHTML = `<form class="form panel" id="fi" style="max-width:820px">
          <label>عنوان الدورة<input name="title" required value="${esc(c.title)}"></label>
          <label>العنوان بالإنجليزية <span class="hint">يظهر في الشهادة</span><input name="titleEn" dir="ltr" value="${esc(c.titleEn)}"></label>
          <label>وصف مختصر <span class="hint">يظهر على بطاقة الدورة</span><input name="summary" maxlength="160" value="${esc(c.summary)}"></label>
          <label>عن الدورة<textarea name="description" rows="5">${esc(c.description)}</textarea></label>
          <div class="row"><label>التصنيف<input name="category" list="cats2" value="${esc(c.category)}"><datalist id="cats2">${CATS.map(x => `<option value="${x}">`).join('')}</datalist></label>
          <label>المستوى<select name="level">${LEVELS.map(l => `<option ${c.level === l ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
          <div class="row"><label>المحاضر<input name="instructor" value="${esc(c.instructor)}"></label><label>اسم المحاضر بالإنجليزية <span class="hint">للشهادة الإنجليزية</span><input name="instructorEn" dir="ltr" value="${esc(c.instructorEn)}"></label></div>
          <label>لون الغلاف<div class="swatches">${Object.entries(THEMES).map(([k, v]) => `<label><input type="radio" name="theme" value="${k}" ${c.theme === k ? 'checked' : ''}><span style="background:linear-gradient(135deg,${v.join(',')})"></span></label>`).join('')}</div></label>
          <label>رمز الغلاف<div class="swatches">${COURSE_ICONS.map(k => `<label><input type="radio" name="icon" value="${k}" ${c.icon === k ? 'checked' : ''}><span style="background:var(--surface-2)">${ic(k, 22)}</span></label>`).join('')}</div></label>
          <fieldset class="fset"><legend>${ic('book', 17)} البرنامج الدراسي</legend>
            <p class="hint">يحدّد مكان المادة في صفحة «البرامج الدراسية». اختر «دورة عامة» للدورات خارج البرنامجين.</p>
            <div class="row"><label>البرنامج<select name="program" id="pg">${PROGRAMS.map(([k, t]) => `<option value="${k}" ${(c.program || '') === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
            <label data-pg="ijaza">مسار الإجازة <span class="hint">يُسجَّل فيها المقبولون في هذا المسار</span><select name="ijazaKey">${IJAZA_PLAN.map(t => `<option value="${t.key}" ${c.ijazaKey === t.key ? 'selected' : ''}>${esc(t.title)}</option>`).join('')}</select></label>
            <label data-pg="academy">الفصل الدراسي<select name="term">${[1, 2, 3, 4].map(t => `<option value="${t}" ${+c.term === t ? 'selected' : ''}>${termLabel(t)}</option>`).join('')}</select></label></div>
            <div class="row" data-pg="academy ijaza"><label>الكتاب المقرّر<input name="book" value="${esc(c.book)}"></label><label>المؤلف<input name="author" value="${esc(c.author)}"></label></div>
            <div class="row" data-pg="academy ijaza"><label>عدد الساعات <span class="hint">أسبوعياً، فارغ = غير محدد</span><input name="hours" type="number" min="0" max="40" value="${esc(c.hours)}"></label><label>ترتيب المادة <span class="hint">رقمها داخل الفصل</span><input name="order" type="number" min="1" max="99" value="${esc(c.order)}"></label></div>
          </fieldset>
          <fieldset class="fset"><legend>${ic('calendar', 17)} التسجيل والمواعيد</legend>
            <p class="hint">اتركه «مفتوح دائماً» للدورات الذاتية. اختر «فترة محددة» لدورة بدفعات لها موعد تسجيل.</p>
            <p class="hint" data-pg="academy ijaza">${ic('info', 14)} مواد البرنامجين لا تتبع هذا الإعداد: يُسجَّل فيها الطلاب المقبولون فقط، عبر <a href="#/registry/terms" style="color:var(--teal)">الفصول الدراسية</a> أو عند القبول.</p>
            <div class="row"><label>التسجيل<select name="enrollMode" id="em">${ENROLL_MODES.map(([k, t]) => `<option value="${k}" ${(c.enrollMode || 'open') === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
            <label>مدة الدورة <span class="hint">نص حر، مثل: 3 أشهر تشمل الاختبارات</span><input name="durationLabel" maxlength="60" value="${esc(c.durationLabel)}"></label></div>
            <div class="row" data-m="window"><label>يفتح التسجيل في <span class="hint">فارغ = من الآن</span><input type="date" name="enrollStart" value="${toDateInput(c.enrollStart)}"></label><label>يُغلق التسجيل في <span class="hint">فارغ = بلا نهاية</span><input type="date" name="enrollEnd" value="${toDateInput(c.enrollEnd)}"></label></div>
            <label data-m="closed window">ملاحظة تظهر حين يكون التسجيل مغلقاً <span class="hint">مثل: يبدأ التسجيل للدفعة القادمة في رمضان</span><input name="enrollNote" maxlength="120" value="${esc(c.enrollNote)}"></label>
            <label>تبدأ الدراسة في <span class="hint">اختياري — تبقى الدروس والاختبار مقفلة للطلاب حتى هذا اليوم</span><input type="date" name="startsAt" value="${toDateInput(c.startsAt)}" style="max-width:260px"></label>
          </fieldset>
          <fieldset class="fset"><legend>${ic('award', 17)} شهادة الدورة</legend>
            <label>نوع الشهادة <span class="hint">أنشئ أنواعاً جديدة أو ارفع تصميمك من <a href="#/certs/types" style="color:var(--teal)">الشهادات ← أنواع الشهادات</a></span><select name="certType"><option value="">الافتراضية${ctypes.find(x => x.id === S.settings.certDefault) ? ` (${esc(ctypes.find(x => x.id === S.settings.certDefault).name)})` : ''}</option>${ctypes.map(x => `<option value="${x.id}" ${c.certType === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label>
          </fieldset>
          <label class="check"><input type="checkbox" name="published" ${c.published ? 'checked' : ''}> منشورة ويراها الزوّار</label>
          <div><button class="btn btn-primary">حفظ البيانات</button></div></form>`;
        const em = $('#em'), modeVis = () => $$('[data-m]', pane).forEach(el => el.hidden = !el.dataset.m.split(' ').includes(em.value));
        em.onchange = modeVis; modeVis();
        const pg = $('#pg'), pgVis = () => $$('[data-pg]', pane).forEach(el => el.hidden = !el.dataset.pg.split(' ').includes(pg.value));
        pg.onchange = pgVis; pgVis();
        $('#fi').onsubmit = async e => {
          e.preventDefault(); const fd = new FormData(e.target);
          const sched = { enrollMode: fd.get('enrollMode') || 'open', enrollStart: fromDateInput(fd.get('enrollStart')), enrollEnd: fromDateInput(fd.get('enrollEnd'), true), enrollNote: fd.get('enrollNote').trim(), startsAt: fromDateInput(fd.get('startsAt')), durationLabel: fd.get('durationLabel').trim() };
          if (sched.enrollMode !== 'window') { sched.enrollStart = 0; sched.enrollEnd = 0; }
          if (sched.enrollStart && sched.enrollEnd && sched.enrollEnd < sched.enrollStart) { toast('تاريخ إغلاق التسجيل قبل تاريخ فتحه', 'err'); return; }
          Object.assign(c, sched);
          const prg = fd.get('program') || '';
          Object.assign(c, { program: prg, term: prg === 'academy' ? +fd.get('term') || 1 : 0, ijazaKey: prg === 'ijaza' ? fd.get('ijazaKey') || '' : '', book: prg ? fd.get('book').trim() : '', author: prg ? fd.get('author').trim() : '', hours: prg && fd.get('hours') !== '' ? +fd.get('hours') : '', order: prg && fd.get('order') ? +fd.get('order') : '' });
          Object.assign(c, { title: fd.get('title').trim(), titleEn: fd.get('titleEn').trim(), summary: fd.get('summary').trim(), description: fd.get('description'), category: fd.get('category').trim(), level: fd.get('level'), instructor: fd.get('instructor').trim(), instructorEn: fd.get('instructorEn').trim(), theme: fd.get('theme') || 'teal', icon: fd.get('icon') || 'book', certType: fd.get('certType') || '', published: !!fd.get('published') });
          try { await save(); $('.admin-top h1').textContent = c.title; toast('حُفظت بيانات الدورة', 'ok'); } catch (err) { toast(err.message, 'err'); }
        };
      };
      /* ===== تبويب اللقاءات المباشرة: رابط Zoom / Meet / Teams + جدول اللقاءات ===== */
      const WD = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const sessForm = (x = {}) => `<label>عنوان اللقاء<input name="title" required maxlength="100" value="${esc(x.title)}" placeholder="مثال: اللقاء الأول — مقدمة الكتاب"></label>
        <div class="row"><label>الموعد <span class="hint">بتوقيت جهازك، ويظهر لكل طالب بتوقيته</span><input type="datetime-local" name="at" required value="${toDTInput(x.at)}"></label><label>المدة بالدقائق<input type="number" name="dur" min="5" max="600" value="${esc(x.dur || 60)}"></label></div>
        <label>رابط خاص بهذا اللقاء <span class="hint">اختياري — اتركه فارغاً ليُستعمل الرابط الثابت للدورة</span><input name="url" dir="ltr" placeholder="https://" value="${esc(x.url)}"></label>
        <label>رابط تسجيل اللقاء <span class="hint">اختياري — بعد انتهائه، ضع رابط التسجيل (يوتيوب، درايف…) ليشاهده من فاته</span><input name="rec" dir="ltr" placeholder="https://" value="${esc(x.rec)}"></label>`;
      const sessData = fd => {
        const at = fromDTInput(fd.get('at')), rawU = fd.get('url').trim(), rawR = fd.get('rec').trim(), url = normUrl(rawU), rec = normUrl(rawR);
        if (!at) throw new Error('حدّد موعد اللقاء');
        if (rawU && !url) throw new Error('رابط اللقاء غير صالح'); if (rawR && !rec) throw new Error('رابط التسجيل غير صالح');
        return { title: fd.get('title').trim(), at, dur: Math.max(5, +fd.get('dur') || 60), url, rec };
      };
      const meetLine = raw => { const m = raw ? meetInfo(raw) : null; return !raw ? '' : !m ? `<p class="mstat bad">${ic('x', 15)} رابط غير صالح</p>` : `<p class="mstat ${m.p === 'other' ? 'warn' : 'ok'}">${ic(m.p === 'other' ? 'link' : 'check', 15)} ${m.p === 'other' ? 'رابط غير معروف — سيفتح كما هو' : esc(m.label)}${m.id ? ` — رقم الاجتماع <span dir="ltr">${esc(m.id)}</span>` : ''}${m.hasPwd ? ' — الرابط يتضمن رمز الدخول' : ''}</p>`; };
      const live = () => {
        const st = liveState(lv), now = Date.now();
        pane.innerHTML = `<form class="form panel" id="flv" style="max-width:820px">
          <label class="check"><input type="checkbox" name="online" ${c.online ? 'checked' : ''}> دورة أونلاين بلقاءات مباشرة <span class="hint">يظهر للزوّار أنها مباشرة ومواعيدها، ويظهر الرابط للطلاب المسجّلين فقط</span></label>
          <div id="lvf">
          <label>رابط الاجتماع الثابت <span class="hint">Zoom أو Google Meet أو Microsoft Teams — الصق رابط الدعوة كاملاً. إن كان لكل لقاء رابط مختلف فاتركه فارغاً وضع الرابط في كل لقاء.</span><input name="url" dir="ltr" placeholder="https://zoom.us/j/…" value="${esc(lv.url)}" autocomplete="off"></label>
          <div id="mline">${meetLine(lv.url)}</div>
          <div class="row"><label>رقم الاجتماع <span class="hint">اختياري — يُستخرج من رابط Zoom وMeet تلقائياً</span><input name="meetingId" dir="ltr" maxlength="40" value="${esc(lv.meetingId)}"></label><label>رمز الدخول (Passcode) <span class="hint">اختياري</span><input name="passcode" dir="ltr" maxlength="40" value="${esc(lv.passcode)}"></label></div>
          <label>مواعيد اللقاءات <span class="hint">نص يراه الزوّار في صفحة الدورة، مثل: كل أحد وأربعاء — 8 مساءً بتوقيت مكة</span><input name="liveSchedule" maxlength="120" value="${esc(c.liveSchedule)}"></label>
          <label>تعليمات للطلاب <span class="hint">اختياري — تظهر للمسجّلين فوق الرابط، مثل: ادخل باسمك الثلاثي وأغلق الميكروفون</span><textarea name="note" rows="3" maxlength="600">${esc(lv.note)}</textarea></label>
          </div>
          <div><button class="btn btn-primary">حفظ</button></div></form>
          <div class="panel" style="max-width:820px;margin-top:20px" id="lvs">
            <div class="toolbar"><h3 class="grow" style="margin:0">مواعيد اللقاءات <small class="muted" style="font-weight:400">(${st.upcoming.length} قادم، ${st.past.length} منتهٍ)</small></h3><button class="btn btn-ghost btn-sm" id="addR">${ic('calendar', 16)} جدولة متكررة</button><button class="btn btn-primary btn-sm" id="addS">${ic('plus', 16)} لقاء</button></div>
            <p class="hint" style="margin-bottom:12px">يرى الطالب اللقاء القادم مع عدّ تنازلي، ويتحوّل زر الدخول إلى «انضم الآن» قبل الموعد بربع ساعة وحتى نهاية اللقاء. الجدول اختياري: يكفي الرابط الثابت ونص المواعيد.</p>
            ${st.ss.length ? `<div class="rowlist">${st.ss.map((x, i) => { const on = now >= x.at - LIVE_EARLY && now < sessEnd(x), done = sessEnd(x) <= now; return `<div class="ritem"><span class="tick">${i + 1}</span>${ic('video', 19)}<div class="grow"><strong>${esc(x.title)}</strong><br><small>${fmtSess(x)} — ${x.dur || 60} د${x.url ? ' — رابط خاص' : ''}${x.rec ? ' — <span style="color:var(--ok)">فيه تسجيل</span>' : ''}${!sessUrl(lv, x) ? ' — <span style="color:var(--warn)">بلا رابط</span>' : ''}</small></div>
              <span class="pill ${on ? 'ok' : done ? 'mut' : 'no'}" style="${!on && !done ? 'background:var(--mist);color:var(--teal)' : ''}">${on ? 'جارٍ الآن' : done ? 'انتهى' : 'قادم'}</span>
              <div class="acts"><button class="icon-btn sm" data-se="${x.id}" title="تعديل">${ic('edit', 16)}</button><button class="icon-btn sm danger" data-sr="${x.id}" title="حذف">${ic('trash', 16)}</button></div></div>`; }).join('')}</div>${st.past.length ? `<div style="margin-top:12px"><button class="btn btn-ghost btn-sm" id="clrP">${ic('trash', 15)} حذف اللقاءات المنتهية بلا تسجيل</button></div>` : ''}`
              : `<div class="empty">${ic('video', 34)}<p>لم تُجدول لقاءات بعد. أضف لقاءً واحداً، أو «جدولة متكررة» لعدة لقاءات أسبوعية دفعة واحدة.</p></div>`}
          </div>`;
        const f = $('#flv'), on = $('[name=online]', f), vis = () => { $('#lvf').style.opacity = on.checked ? 1 : .5; $('#lvs').hidden = !on.checked; };
        on.onchange = vis; vis();
        let tm; $('[name=url]', f).oninput = e => { clearTimeout(tm); tm = setTimeout(() => { const v = e.target.value.trim(); $('#mline').innerHTML = meetLine(v); const m = meetInfo(v), mid = $('[name=meetingId]', f); if (m?.id && !mid.value.trim()) mid.value = m.id; }, 350); };
        f.onsubmit = async e => {
          e.preventDefault(); const fd = new FormData(f), raw = fd.get('url').trim(), url = normUrl(raw);
          if (raw && !url) { toast('رابط الاجتماع غير صالح — انسخه كاملاً من دعوة Zoom أو Meet أو Teams', 'err'); return; }
          Object.assign(lv, { url, meetingId: fd.get('meetingId').trim(), passcode: fd.get('passcode').trim(), note: fd.get('note').trim() });
          c.online = !!fd.get('online'); c.liveSchedule = fd.get('liveSchedule').trim();
          c.livePlatform = c.online ? (meetInfo(url)?.p || meetInfo(lv.sessions.map(x => x.url).find(Boolean))?.p || '') : '';
          try { await saveLive(); await save(); liveCount(); toast(c.online && !url && !lv.sessions.some(x => x.url) ? 'حُفظ — لكن لا يوجد رابط اجتماع بعد' : 'حُفظت إعدادات اللقاءات', c.online && !url && !lv.sessions.some(x => x.url) ? '' : 'ok'); } catch (err) { toast(err.message, 'err'); }
        };
        const commit = async msg => { await saveLive(); if (!c.livePlatform) { c.livePlatform = meetInfo(lv.url)?.p || meetInfo(lv.sessions.map(x => x.url).find(Boolean))?.p || ''; await save(); } liveCount(); live(); if (msg) toast(msg, 'ok'); };
        $('#addS').onclick = () => { const last = st.ss[st.ss.length - 1]; modal('لقاء جديد', sessForm({ title: `اللقاء ${st.ss.length + 1}`, dur: last?.dur || 60, at: last ? +last.at + 7 * 864e5 : 0 }), { wide: true, submitText: 'إضافة', onSubmit: async fd => { lv.sessions.push({ id: genId(), ...sessData(fd) }); await commit('أُضيف اللقاء'); } }); };
        $('#addR').onclick = () => modal('جدولة لقاءات متكررة', `<p class="hint">تُنشأ لقاءات أسبوعية في الأيام التي تختارها، بالرابط الثابت للدورة.</p>
          <fieldset class="fset"><legend>أيام اللقاء</legend><div class="wdays">${WD.map((d, i) => `<label class="check"><input type="checkbox" name="wd" value="${i}"> ${d}</label>`).join('')}</div></fieldset>
          <div class="row"><label>من تاريخ<input type="date" name="from" required value="${toDateInput(Date.now())}"></label><label>الساعة<input type="time" name="time" required value="20:00"></label></div>
          <div class="row"><label>عدد اللقاءات<input type="number" name="n" min="1" max="100" required value="8"></label><label>المدة بالدقائق<input type="number" name="dur" min="5" max="600" value="60"></label></div>
          <label>بادئة العنوان <span class="hint">تُرقَّم تلقائياً: اللقاء 1، اللقاء 2…</span><input name="prefix" value="اللقاء" maxlength="60"></label>`, { wide: true, submitText: 'إنشاء اللقاءات', onSubmit: async fd => {
            const days = fd.getAll('wd').map(Number); if (!days.length) throw new Error('اختر يوماً واحداً على الأقل');
            const n = Math.min(100, Math.max(1, +fd.get('n') || 1)), [hh, mm] = fd.get('time').split(':').map(Number), base = fromDateInput(fd.get('from')), pre = fd.get('prefix').trim() || 'اللقاء', start = lv.sessions.length;
            const out = []; for (let d = new Date(base); out.length < n; d.setDate(d.getDate() + 1)) if (days.includes(d.getDay())) out.push(new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm).getTime());
            lv.sessions.push(...out.map((at, i) => ({ id: genId() + i, title: `${pre} ${start + i + 1}`, at, dur: Math.max(5, +fd.get('dur') || 60), url: '', rec: '' })));
            await commit(`أُنشئ ${n} ${n > 10 ? 'لقاءً' : n > 2 ? 'لقاءات' : 'لقاء'}`);
          } });
        $('#clrP') && ($('#clrP').onclick = async () => { const rm = st.past.filter(x => !x.rec); if (!rm.length) { toast('كل اللقاءات المنتهية فيها تسجيل'); return; } if (await confirmBox(`حذف ${rm.length} من اللقاءات المنتهية؟`, 'حذف')) { lv.sessions = lv.sessions.filter(x => !rm.includes(x)); await commit('حُذفت'); } });
        $('#lvs').onclick = async e => {
          const b = e.target.closest('button'); if (!b) return; const d = b.dataset, x = lv.sessions.find(y => y.id === (d.se || d.sr)); if (!x) return;
          if (d.se) modal('تعديل اللقاء', sessForm(x), { wide: true, onSubmit: async fd => { Object.assign(x, sessData(fd)); await commit('حُفظ اللقاء'); } });
          if (d.sr && await confirmBox(`حذف «${esc(x.title)}»؟`, 'حذف')) { lv.sessions = lv.sessions.filter(y => y !== x); await commit(); }
        };
      };
      const lessonForm = (l = {}) => `<label>عنوان الدرس<input name="title" required value="${esc(l.title)}"></label>
        <div class="row"><label>النوع<select name="type">${Object.entries(TYPE_LBL).map(([k, v]) => `<option value="${k}" ${l.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label><label>المدة بالدقائق<input name="duration" type="number" min="0" value="${esc(l.duration)}"></label></div>
        <label>الرابط <span class="hint">يوتيوب (فيديو، Shorts، بث، قائمة تشغيل)، Vimeo، ساوند كلاود، Google Drive ومستندات Google، Archive.org، Dropbox، أو رابط مباشر لملف mp3/mp4/pdf. يمكنك لصق كود التضمين أيضاً.</span><input name="url" dir="ltr" placeholder="https://" value="${esc(l.url)}" autocomplete="off"></label>
        <div class="mprev" id="mprev"></div>
        <label>النص <span class="hint">للمتون: يُعرض بخط نسخي كبير. لغيرها: ملاحظات تحت المادة.</span><textarea name="content" rows="7">${esc(l.content)}</textarea></label>`;
      const lessonData = fd => {
        const raw = fd.get('url').trim(), url = normUrl(raw);
        if (raw && !url) throw new Error('الرابط غير صالح — انسخه من شريط العنوان كاملاً');
        return { title: fd.get('title').trim(), type: fd.get('type'), duration: fd.get('duration'), url, content: fd.get('content') };
      };
      /* معاينة فورية للرابط داخل نافذة الدرس */
      const wireL = form => {
        const box = $('#mprev', form), u = $('[name=url]', form), t = $('[name=type]', form); let tm, last = null;
        const draw = () => {
          const raw = u.value.trim(), key = raw + '|' + t.value; if (key === last) return; last = key;
          if (!raw) { box.innerHTML = ''; return; }
          const m = mediaInfo(raw, t.value);
          const tips = { 'Google Drive': 'تأكد أن مشاركة الملف «أي شخص لديه الرابط» وإلا لن يظهر للطلاب.', 'Google Docs': 'تأكد أن المستند مشارك «لأي شخص لديه الرابط».', 'يوتيوب': 'إن ظهر خطأ داخل المشغّل فغالباً صاحب المقطع منع تضمينه، أو المقطع خاص؛ اجعله «عام» أو «غير مدرج».' };
          box.innerHTML = !m ? `<p class="mstat bad">${ic('x', 15)} رابط غير صالح</p>`
            : m.kind === 'link' ? `<p class="mstat warn">${ic('link', 15)} موقع غير مدعوم للتضمين — سيظهر للطالب زر «فتح المادة».</p>`
            : `<p class="mstat ok">${ic('check', 15)} ${esc(m.label)} — سيُعرض داخل الدرس.${tips[m.label] ? ` <span class="hint">${tips[m.label]}</span>` : ''}</p><div class="mprev-media">${mediaEmbed({ url: raw, type: t.value, title: 'معاينة' })}</div>`;
        };
        u.oninput = () => { clearTimeout(tm); tm = setTimeout(draw, 450); }; t.onchange = draw; draw();
      };
      const lessons = () => {
        pane.innerHTML = `<div class="toolbar"><p class="grow muted">رتّب الدروس بالأسهم. يرى الطالب الدروس بهذا الترتيب.</p><button class="btn btn-primary btn-sm" id="addL">${ic('plus', 16)} درس جديد</button></div>
          ${c.lessons.length ? `<div class="rowlist">${c.lessons.map((l, i) => `<div class="ritem"><span class="tick">${i + 1}</span>${ic(TYPE_IC[l.type], 19)}<div class="grow"><strong>${esc(l.title)}</strong><br><small>${TYPE_LBL[l.type]}${l.duration ? ` — ${esc(l.duration)} د` : ''}${l.type !== 'text' && !l.url ? ' — <span style="color:var(--warn)">بلا رابط</span>' : ''}</small></div>
            <div class="acts"><button class="icon-btn sm" data-up="${i}" ${i === 0 ? 'disabled' : ''} title="أعلى">${ic('up', 16)}</button><button class="icon-btn sm" data-dn="${i}" ${i === c.lessons.length - 1 ? 'disabled' : ''} title="أسفل">${ic('down', 16)}</button><button class="icon-btn sm" data-ed="${i}" title="تعديل">${ic('edit', 16)}</button><button class="icon-btn sm danger" data-rm="${i}" title="حذف">${ic('trash', 16)}</button></div></div>`).join('')}</div>`
            : `<div class="empty">${ic('play', 34)}<p>أضف أول درس: فيديو أو صوت أو ملف أو متن.</p></div>`}`;
        $('#addL').onclick = () => modal('درس جديد', lessonForm({ type: 'video' }), { wide: true, submitText: 'إضافة الدرس', onOpen: wireL, onSubmit: async fd => { c.lessons.push({ id: genId(), ...lessonData(fd) }); await save(); counts(); lessons(); toast('أُضيف الدرس', 'ok'); } });
        pane.onclick = async e => {
          const b = e.target.closest('button'); if (!b || b.disabled) return; const d = b.dataset;
          if (d.up || d.dn) { const i = +(d.up ?? d.dn), j = d.up ? i - 1 : i + 1; [c.lessons[i], c.lessons[j]] = [c.lessons[j], c.lessons[i]]; await save(); lessons(); }
          if (d.ed) { const l = c.lessons[+d.ed]; modal('تعديل الدرس', lessonForm(l), { wide: true, onOpen: wireL, onSubmit: async fd => { Object.assign(l, lessonData(fd)); await save(); lessons(); toast('حُفظ الدرس', 'ok'); } }); }
          if (d.rm) { const l = c.lessons[+d.rm]; if (await confirmBox(`حذف درس «${esc(l.title)}»؟`, 'حذف')) { c.lessons.splice(+d.rm, 1); await save(); counts(); lessons(); } }
        };
      };
      const qForm = (q = { type: 'mcq', options: ['', '', '', ''], answer: 0 }) => `<label>نص السؤال<textarea name="text" rows="2" required>${esc(q.text)}</textarea></label>
        <label>نوع السؤال<select name="type" id="qt"><option value="mcq" ${q.type === 'mcq' ? 'selected' : ''}>اختيار من متعدد</option><option value="tf" ${q.type === 'tf' ? 'selected' : ''}>صح أو خطأ</option></select></label>
        <div id="opts"></div>`;
      const wireQ = (form, q) => {
        const draw = () => {
          const t = $('#qt', form).value, opts = t === 'tf' ? ['صح', 'خطأ'] : (q.type === 'mcq' ? [...q.options, '', '', '', ''].slice(0, 4) : ['', '', '', '']);
          $('#opts', form).innerHTML = `<p class="hint" style="margin-bottom:4px">اختر الإجابة الصحيحة بالدائرة</p>` + opts.map((o, i) => `<div style="display:flex;gap:10px;align-items:center;margin-bottom:8px"><input type="radio" name="answer" value="${i}" ${q.answer === i ? 'checked' : ''} required style="width:20px;height:20px;accent-color:var(--teal)" aria-label="الإجابة الصحيحة">${t === 'tf' ? `<strong>${o}</strong><input type="hidden" name="opt" value="${o}">` : `<input name="opt" value="${esc(o)}" placeholder="الخيار ${i + 1}${i > 1 ? ' (اختياري)' : ''}" ${i < 2 ? 'required' : ''}>`}</div>`).join('');
        };
        $('#qt', form).onchange = draw; draw();
      };
      const qData = fd => {
        const type = fd.get('type'), raw = fd.getAll('opt').map(s => s.trim()); let answer = +fd.get('answer');
        const keep = raw.map((o, i) => ({ o, i })).filter(x => x.o);
        if (!keep.some(x => x.i === answer)) throw new Error('الخيار المحدد كإجابة صحيحة فارغ');
        answer = keep.findIndex(x => x.i === answer);
        return { text: fd.get('text').trim(), type, options: keep.map(x => x.o), answer };
      };
      const exam = () => {
        const ex = c.exam;
        pane.innerHTML = `<form class="form panel" id="fe" style="margin-bottom:20px"><h3>إعدادات الاختبار</h3>
          <div class="row"><label>درجة النجاح %<input name="passScore" type="number" min="1" max="100" value="${ex.passScore}"></label><label>المدة بالدقائق <span class="hint">0 = مفتوحة</span><input name="duration" type="number" min="0" value="${ex.duration}"></label></div>
          <div class="row"><label>عدد المحاولات <span class="hint">0 = غير محدود</span><input name="maxAttempts" type="number" min="0" value="${ex.maxAttempts}"></label><div style="display:grid;gap:8px;align-content:end">
          <label class="check"><input type="checkbox" name="shuffle" ${ex.shuffle ? 'checked' : ''}> ترتيب عشوائي للأسئلة</label>
          <label>بعد التسليم يرى الطالب<select name="reveal" id="rvl">${REVEAL_OPTS.map(([k, t]) => `<option value="${k}" ${revealMode(ex) === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
          <label class="check" id="acw" ${revealMode(ex) === 'hidden' ? '' : 'hidden'}><input type="checkbox" name="autoCert" ${ex.autoCert ? 'checked' : ''}> إصدار الشهادة تلقائياً للناجح (تظهر في حسابه) — وإلا تُصدرها أنت من «نتائج الاختبارات»</label>
          <label class="check"><input type="checkbox" name="requireLessons" ${ex.requireLessons ? 'checked' : ''}> لا يُفتح إلا بعد إتمام الدروس</label></div></div>
          <div><button class="btn btn-primary">حفظ الإعدادات</button></div></form>
          <div class="toolbar"><h3 class="grow">الأسئلة (${ex.questions.length})</h3><button class="btn btn-primary btn-sm" id="addQ">${ic('plus', 16)} سؤال جديد</button></div>
          ${ex.questions.length ? `<div class="rowlist">${ex.questions.map((q, i) => `<div class="ritem"><span class="tick">${i + 1}</span><div class="grow"><strong>${esc(q.text)}</strong><br><small>${q.type === 'tf' ? 'صح أو خطأ' : 'اختيار من متعدد'} — الصحيحة: ${esc(q.options[q.answer])}</small></div><div class="acts"><button class="icon-btn sm" data-qe="${i}" title="تعديل">${ic('edit', 16)}</button><button class="icon-btn sm danger" data-qr="${i}" title="حذف">${ic('trash', 16)}</button></div></div>`).join('')}</div>`
            : `<div class="empty">${ic('quiz', 34)}<p>بلا أسئلة تصدر الشهادة بمجرد إتمام الدروس. أضف أسئلة لتفعيل الاختبار.</p></div>`}`;
        $('#fe').onsubmit = async e => {
          e.preventDefault(); const fd = new FormData(e.target);
          Object.assign(ex, { passScore: +fd.get('passScore') || 60, duration: +fd.get('duration') || 0, maxAttempts: +fd.get('maxAttempts') || 0, shuffle: !!fd.get('shuffle'), reveal: fd.get('reveal'), autoCert: !!fd.get('autoCert'), requireLessons: !!fd.get('requireLessons') });
          await save(); toast('حُفظت إعدادات الاختبار', 'ok');
        };
        $('#rvl').onchange = e => { $('#acw').hidden = e.target.value !== 'hidden'; };
        $('#addQ').onclick = () => { const q = { type: 'mcq', options: ['', '', '', ''], answer: 0 }; modal('سؤال جديد', qForm(q), { wide: true, submitText: 'إضافة السؤال', onOpen: f => wireQ(f, q), onSubmit: async fd => { ex.questions.push({ id: genId(), ...qData(fd) }); await save(); counts(); exam(); toast('أُضيف السؤال', 'ok'); } }); };
        pane.onclick = async e => {
          const b = e.target.closest('button'); if (!b) return;
          if (b.dataset.qe) { const q = ex.questions[+b.dataset.qe]; modal('تعديل السؤال', qForm(q), { wide: true, onOpen: f => wireQ(f, q), onSubmit: async fd => { Object.assign(q, qData(fd)); await save(); exam(); toast('حُفظ السؤال', 'ok'); } }); }
          if (b.dataset.qr) { if (await confirmBox('حذف هذا السؤال؟', 'حذف')) { ex.questions.splice(+b.dataset.qr, 1); await save(); counts(); exam(); } }
        };
      };
      draw();
    }
  };
}

async function adminStudents() {
  const d = await loadAll();
  const rows = () => d.users.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const studentForm = (u = {}) => `<label>الاسم الكامل<input name="name" required value="${esc(u.name)}"></label>
    <label>الاسم بالإنجليزية <span class="hint">للشهادة</span><input name="nameEn" dir="ltr" value="${esc(u.nameEn)}"></label>
    ${u.id ? '' : `<label>اسم المستخدم <span class="hint">أحرف إنجليزية وأرقام</span><input name="username" required pattern="[A-Za-z0-9_.]{3,20}" dir="ltr"></label>`}
    <label>رقم الجوال<input name="phone" type="tel" dir="ltr" value="${esc(u.phone)}"></label>
    ${u.id ? '' : `<label>كلمة المرور <span class="hint">6 أحرف على الأقل</span><input name="password" required minlength="6" dir="ltr" value="${Math.random().toString(36).slice(2, 10)}"></label>`}`;
  return {
    active: 'students', title: 'الطلاب',
    actions: `<button class="btn btn-ghost btn-sm" id="csv">${ic('download', 16)} تصدير</button><button class="btn btn-primary btn-sm" id="addS">${ic('plus', 16)} طالب جديد</button>`,
    html: `<div class="toolbar"><label class="searchbox grow">${ic('search', 18)}<span class="sr">بحث</span><input id="q" placeholder="ابحث بالاسم أو اسم المستخدم أو الجوال"></label></div><div id="tbl"></div>`,
    mount() {
      let q = '';
      const draw = () => {
        const list = rows().filter(u => !q || (u.name + u.username + (u.phone || '')).toLowerCase().includes(q));
        $('#tbl').innerHTML = list.length ? `<div class="tbl-wrap"><table><thead><tr><th>الطالب</th><th>اسم المستخدم</th><th>الرقم الجامعي</th><th>الجوال</th><th>الدورات</th><th>الشهادات</th><th>الحالة</th><th></th></tr></thead><tbody>${list.map(u => `<tr>
          <td><strong>${esc(u.name)}</strong><br><small class="muted">منذ ${fmtDate(u.createdAt)}</small></td><td dir="ltr" style="text-align:end">${esc(u.username)}</td><td>${d.records.filter(r => r.uid === u.id).map(r => `<span dir="ltr">${esc(r.studentNo)}</span> <small class="muted">${esc(programName(r.program))}</small>`).join('<br>') || '<span class="muted">—</span>'}</td><td dir="ltr" style="text-align:end">${esc(u.phone || '—')}</td>
          <td>${d.enrollments.filter(e => e.uid === u.id).length}</td><td>${d.certificates.filter(c => c.uid === u.id).length}</td>
          <td><span class="pill ${u.disabled ? 'no' : 'ok'}">${u.disabled ? 'موقوف' : 'نشط'}</span></td>
          <td><div class="acts"><button class="icon-btn sm" data-a="view" data-id="${u.id}" title="التفاصيل">${ic('eye', 16)}</button><button class="icon-btn sm" data-a="enroll" data-id="${u.id}" title="التسجيل في دورات">${ic('book', 16)}</button><button class="icon-btn sm" data-a="edit" data-id="${u.id}" title="تعديل">${ic('edit', 16)}</button>${Auth.canReset ? `<button class="icon-btn sm" data-a="pw" data-id="${u.id}" title="كلمة مرور جديدة">${ic('key', 16)}</button>` : ''}<button class="icon-btn sm" data-a="toggle" data-id="${u.id}" title="${u.disabled ? 'تفعيل' : 'إيقاف'}">${ic(u.disabled ? 'check' : 'ban', 16)}</button><button class="icon-btn sm danger" data-a="del" data-id="${u.id}" title="حذف">${ic('trash', 16)}</button></div></td></tr>`).join('')}</tbody></table></div>`
          : `<div class="empty">${ic('users', 36)}<p>${q ? 'لا نتائج مطابقة.' : 'لا يوجد طلاب بعد. أضف طالباً أو فعّل التسجيل الذاتي من الإعدادات.'}</p></div>`;
      };
      $('#q').oninput = e => { q = e.target.value.trim().toLowerCase(); draw(); };
      $('#addS').onclick = () => modal('طالب جديد', studentForm(), {
        submitText: 'إضافة الطالب', onSubmit: async (fd, f) => {
          const data = { name: fd.get('name').trim(), nameEn: fd.get('nameEn').trim(), username: fd.get('username').trim(), password: fd.get('password'), phone: fd.get('phone').trim() };
          const id = await Auth.createUser(data, false);
          d.users.push({ id, ...data, createdAt: Date.now(), disabled: false }); draw();
          modal('أُضيف الطالب', `<p>أرسل للطالب بيانات الدخول:</p><pre class="code">${esc(location.href.replace(/admin\.html.*$/, ''))}#/login\nاسم المستخدم: ${esc(data.username.toLowerCase())}\nكلمة المرور: ${esc(data.password)}</pre>`, { noFoot: true });
        }
      });
      $('#csv').onclick = () => downloadFile('students.csv', toCSV([['الاسم', 'اسم المستخدم', 'الجوال', 'تاريخ التسجيل', 'عدد الدورات', 'عدد الشهادات', 'الحالة'], ...rows().map(u => [u.name, u.username, u.phone, fmtDate(u.createdAt), d.enrollments.filter(e => e.uid === u.id).length, d.certificates.filter(c => c.uid === u.id).length, u.disabled ? 'موقوف' : 'نشط'])]));
      $('#tbl').onclick = async e => {
        const b = e.target.closest('[data-a]'); if (!b) return; const u = d.users.find(x => x.id === b.dataset.id); if (!u) return;
        const a = b.dataset.a;
        if (a === 'edit') modal('تعديل بيانات الطالب', studentForm(u), { onSubmit: async fd => { const v = { name: fd.get('name').trim(), nameEn: fd.get('nameEn').trim(), phone: fd.get('phone').trim() }; await DB.update('users', u.id, v); Object.assign(u, v); draw(); toast('حُفظت البيانات', 'ok'); } });
        if (a === 'pw') modal('كلمة مرور جديدة', `<label>كلمة المرور الجديدة لـ ${esc(u.name)}<input name="p" required minlength="6" dir="ltr" value="${Math.random().toString(36).slice(2, 10)}"></label>`, { onSubmit: async fd => { await Auth.resetPassword(u.id, fd.get('p')); toast('تغيّرت كلمة المرور', 'ok'); } });
        if (a === 'toggle') { u.disabled = !u.disabled; await DB.update('users', u.id, { disabled: u.disabled }); draw(); toast(u.disabled ? 'أُوقف الحساب' : 'فُعّل الحساب', 'ok'); }
        if (a === 'del') {
          if (!(await confirmBox(`حذف الطالب «${esc(u.name)}» مع تسجيلاته ونتائجه؟ تبقى شهاداته الصادرة قابلة للتحقق.${S.live ? '<br><small class="muted">ملاحظة: احذف حسابه أيضاً من Firebase ← Authentication.</small>' : ''}`, 'حذف'))) return;
          for (const en of d.enrollments.filter(x => x.uid === u.id)) await DB.del('enrollments', en.id);
          for (const at of d.attempts.filter(x => x.uid === u.id)) await DB.del('attempts', at.id);
          for (const [c, l] of [['applications', d.applications], ['records', d.records], ['regs', await safeList('regs', { uid: u.id })]]) for (const x of l.filter(x => x.uid === u.id)) await DB.del(c, x.id);
          for (const p of ADM_PROGS) await DB.del('appFiles', `${u.id}_${p}`).catch(() => {});
          await DB.del('users', u.id); d.users = d.users.filter(x => x.id !== u.id); d.enrollments = d.enrollments.filter(x => x.uid !== u.id); draw(); toast('حُذف الطالب');
        }
        if (a === 'enroll') {
          const mine = d.enrollments.filter(x => x.uid === u.id).map(x => x.courseId);
          modal(`دورات ${esc(u.name)}`, d.courses.length ? d.courses.map(c => `<label class="check"><input type="checkbox" name="c" value="${c.id}" ${mine.includes(c.id) ? 'checked' : ''}> ${esc(c.title)}</label>`).join('') : '<p class="muted">لا توجد دورات.</p>', {
            onSubmit: async fd => {
              const want = fd.getAll('c');
              for (const cid of want.filter(x => !mine.includes(x))) { const c = d.courses.find(x => x.id === cid); const en = { uid: u.id, courseId: cid, userName: u.name, courseTitle: c.title, completed: [], enrolledAt: Date.now() }; await DB.set('enrollments', `${u.id}_${cid}`, en); d.enrollments.push({ id: `${u.id}_${cid}`, ...en }); }
              for (const cid of mine.filter(x => !want.includes(x))) { await DB.del('enrollments', `${u.id}_${cid}`); d.enrollments = d.enrollments.filter(x => x.id !== `${u.id}_${cid}`); }
              draw(); toast('حُدّثت دورات الطالب', 'ok');
            }
          });
        }
        if (a === 'view') {
          const ens = d.enrollments.filter(x => x.uid === u.id), ats = d.attempts.filter(x => x.uid === u.id).sort((x, y) => y.at - x.at);
          modal(esc(u.name), `<p class="muted" dir="ltr" style="text-align:end">${esc(u.username)}${u.phone ? ' — ' + esc(u.phone) : ''}</p>
            <h4>التقدّم في الدورات</h4>${ens.length ? `<div class="hbars">${ens.map(en => { const c = d.courses.find(x => x.id === en.courseId); const ls = c?.lessons || []; const p = ls.length ? Math.round(ls.filter(l => (en.completed || []).includes(l.id)).length / ls.length * 100) : 0; return `<div class="hbar"><span class="t">${esc(c?.title || en.courseTitle)}</span><div class="track"><i style="width:${p}%"></i></div><b>${p}%</b></div>`; }).join('')}</div>` : '<p class="muted">غير مسجّل في أي دورة.</p>'}
            <h4 style="margin-top:18px">محاولات الاختبار</h4>${ats.length ? `<div class="rowlist">${ats.map(x => `<div class="ritem"><div class="grow">${esc(x.courseTitle)}<br><small>${fmtDT(x.at)}</small></div><span class="pill ${x.passed ? 'ok' : 'no'}">${x.score}%</span></div>`).join('')}</div>` : '<p class="muted">لا توجد محاولات.</p>'}`, { wide: true, noFoot: true });
        }
      };
      draw();
    }
  };
}

async function adminResults() {
  const [att, courses, certs] = await Promise.all([DB.list('attempts'), DB.list('courses'), DB.list('certificates')]);
  const cm = Object.fromEntries(courses.map(c => [c.id, c])), certOf = a => certs.find(x => x.uid === a.uid && x.courseId === a.courseId);
  att.sort((a, b) => b.at - a.at);
  return {
    active: 'results', title: 'نتائج الاختبارات', actions: `<button class="btn btn-ghost btn-sm" id="csv">${ic('download', 16)} تصدير</button>`,
    html: `<div class="toolbar"><select id="fc" style="max-width:320px"><option value="">كل الدورات</option>${courses.map(c => `<option value="${c.id}">${esc(c.title)}</option>`).join('')}</select><select id="fr" style="max-width:180px"><option value="">كل النتائج</option><option value="1">الناجحون</option><option value="0">غير الناجحين</option></select></div><div id="tbl"></div>`,
    mount() {
      const list = () => att.filter(a => (!$('#fc').value || a.courseId === $('#fc').value) && ($('#fr').value === '' || String(+a.passed) === $('#fr').value));
      const draw = () => {
        const l = list();
        $('#tbl').innerHTML = l.length ? `<p class="muted" style="margin-bottom:10px">${l.length} محاولة — متوسط الدرجة ${Math.round(l.reduce((s, a) => s + a.score, 0) / l.length)}%</p><div class="tbl-wrap"><table><thead><tr><th>الطالب</th><th>الدورة</th><th>الصحيحة</th><th>الدرجة</th><th>النتيجة</th><th>الوقت</th><th></th></tr></thead><tbody>${l.map(a => `<tr><td>${esc(a.userName)}</td><td>${esc(a.courseTitle)}</td><td>${a.correct}/${a.total}</td><td><strong>${a.score}%</strong></td><td><span class="pill ${a.passed ? 'ok' : 'no'}">${a.passed ? 'ناجح' : 'لم ينجح'}</span></td><td>${fmtDT(a.at)}</td><td><div class="acts">${certOf(a) ? `<a class="icon-btn sm" href="index.html#/cert/${certOf(a).id}" target="_blank" title="عرض الشهادة">${ic('award', 16)}</a>` : a.passed ? `<button class="btn btn-brass btn-sm" data-iss="${a.id}" title="إصدار شهادة لهذا الطالب">${ic('award', 15)} إصدار شهادة</button>` : ''}<button class="icon-btn sm danger" data-del="${a.id}" title="حذف المحاولة لإتاحة محاولة جديدة">${ic('trash', 16)}</button></div></td></tr>`).join('')}</tbody></table></div>`
          : `<div class="empty">${ic('quiz', 36)}<p>لا توجد محاولات مطابقة.</p></div>`;
      };
      $('#fc').onchange = draw; $('#fr').onchange = draw;
      $('#csv').onclick = () => downloadFile('results.csv', toCSV([['الطالب', 'الدورة', 'الصحيحة', 'المجموع', 'الدرجة', 'النتيجة', 'الوقت'], ...list().map(a => [a.userName, a.courseTitle, a.correct, a.total, a.score + '%', a.passed ? 'ناجح' : 'لم ينجح', fmtDT(a.at)])]));
      $('#tbl').onclick = async e => {
        const is = e.target.closest('[data-iss]');
        if (is) {
          const a = att.find(x => x.id === is.dataset.iss), c = cm[a.courseId] || {}, hid = revealMode(c.exam || {}) === 'hidden';
          if (!(await confirmBox(`إصدار شهادة «${esc(a.courseTitle)}» للطالب ${esc(a.userName)}؟${hid ? '<br><small class="muted">الاختبار في وضع «حفظ فقط»، فلن تُكتب الدرجة على الشهادة.</small>' : ''}`, 'إصدار'))) return;
          is.disabled = true;
          try {
            const u = await safeGet('users', a.uid), code = `BYN-${rnd4()}-${rnd4()}`;
            const v = { uid: a.uid, courseId: a.courseId, name: u?.name || a.userName, nameEn: u?.nameEn || '', courseTitle: c.title || a.courseTitle, courseTitleEn: c.titleEn || '', instructor: c.instructor || '', instructorEn: c.instructorEn || '', certType: c.certType || '', score: hid ? null : a.score, issuedAt: Date.now() };
            await DB.set('certificates', code, v); certs.push({ id: code, ...v }); draw(); toast('صدرت الشهادة ' + code, 'ok');
          } catch (err) { toast(err.message, 'err'); is.disabled = false; }
          return;
        }
        const b = e.target.closest('[data-del]'); if (!b) return; if (await confirmBox('حذف هذه المحاولة؟ يُعاد للطالب حق محاولة إضافية.', 'حذف')) { await DB.del('attempts', b.dataset.del); att.splice(att.findIndex(a => a.id === b.dataset.del), 1); draw(); toast('حُذفت المحاولة'); } };
      draw();
    }
  };
}

/* ================= القبول: طلبات الالتحاق وقراراتها ================= */
const ADM_TABS = [['', 'طلبات الالتحاق', 'file'], ['settings', 'مواعيد القبول', 'calendar']];
const APP_FILTERS = [['open', 'بحاجة لقرار', ['submitted', 'review', 'waitlist']], ['submitted', 'جديدة'], ['review', 'قيد المراجعة'], ['incomplete', 'مطلوب استكمال'], ['waitlist', 'قائمة الانتظار'], ['accepted', 'المقبولون'], ['rejected', 'غير المقبولين'], ['withdrawn', 'المسحوبة'], ['', 'الكل']];
const setNewApps = n => { S.newApps = n; const b = $('#newapps'); if (b) { b.textContent = n; b.hidden = !n; } };
const progOpts = (sel, all = 'كل البرامج') => `${all ? `<option value="">${all}</option>` : ''}${ADM_PROGS.map(k => `<option value="${k}" ${sel === k ? 'selected' : ''}>${programName(k)}</option>`).join('')}`;
const levelOpts = sel => [1, 2, 3, 4].map(t => `<option value="${t}" ${+sel === t ? 'selected' : ''}>${termLabel(t)}</option>`).join('');
const trackOpts = sel => IJAZA_PLAN.map(t => `<option value="${t.key}" ${sel === t.key ? 'selected' : ''}>${esc(t.title)}</option>`).join('');
/* الفصل المقترح لقيد المقبول الآن: مفتوح التسجيل أو جارٍ */
const liveTerm = terms => terms.filter(t => enrollState(t).open || (+t.startsAt <= Date.now() && (!+t.endsAt || Date.now() <= +t.endsAt))).sort((a, b) => (+b.startsAt || 0) - (+a.startsAt || 0))[0];
async function adminAdmissions(tab = '') {
  const base = { active: 'admissions', title: 'القبول' };
  const tabs = `<div class="tabs" role="tablist">${ADM_TABS.map(([k, t, i]) => `<a class="tab ${tab === k ? 'on' : ''}" href="#/admissions${k ? '/' + k : ''}">${ic(i, 16)} ${t}</a>`).join('')}</div>`;
  if (tab === 'settings') return { ...base, ...admWindows(tabs) };
  const [apps, recs, courses, terms] = await Promise.all([DB.list('applications'), DB.list('records'), DB.list('courses'), safeList('terms')]);
  apps.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
  const inF = (a, f) => { const x = APP_FILTERS.find(y => y[0] === f); return !f || (x[2] ? x[2].includes(a.status) : a.status === f); };
  return {
    ...base, actions: `<button class="btn btn-ghost btn-sm" id="csv">${ic('download', 16)} تصدير</button>`,
    html: `${tabs}<div class="chips" id="sf" style="margin-bottom:12px"></div>
      <div class="toolbar"><select id="pf" style="max-width:220px">${progOpts('')}</select><label class="searchbox grow">${ic('search', 18)}<span class="sr">بحث</span><input id="q" placeholder="ابحث بالاسم أو الجوال أو اسم المستخدم"></label></div><div id="tbl"></div>`,
    mount() {
      let f = apps.some(a => inF(a, 'open')) ? 'open' : '', q = '';
      const vis = () => apps.filter(a => inF(a, f) && (!$('#pf').value || a.program === $('#pf').value) && (!q || [a.name, a.nameEn, a.phone, a.username, a.email].join(' ').toLowerCase().includes(q)));
      const draw = () => {
        setNewApps(apps.filter(a => a.status === 'submitted').length);
        $('#sf').innerHTML = APP_FILTERS.map(([k, t]) => { const n = apps.filter(a => inF(a, k)).length; return `<button class="chip ${f === k ? 'on' : ''}" data-f="${k}">${t} <small>${n}</small></button>`; }).join('');
        const l = vis();
        $('#tbl').innerHTML = l.length ? `<div class="tbl-wrap"><table><thead><tr><th>المتقدّم</th><th>البرنامج</th><th>العمر والمؤهل</th><th>الشروط</th><th>الحالة</th><th>التقديم</th><th></th></tr></thead><tbody>${l.map(a => {
          const x = admissionIssues(a.program, a), age = ageOf(a.birthDate);
          return `<tr><td><strong>${esc(a.name)}</strong><br><small class="muted" dir="ltr">${esc(a.username || '')}${a.phone ? ' · ' + esc(a.phone) : ''}</small></td>
            <td>${esc(programName(a.program))}${a.track ? `<br><small class="muted">${esc(trackName(a.track))}</small>` : ''}</td>
            <td>${age != null ? age + ' سنة' : '—'}<br><small class="muted">${esc(optName(QUALS, a.qual) || '—')}</small></td>
            <td>${x.hard.length ? `<span class="pill no" title="${esc(x.hard.join('\n'))}">غير مستوفاة</span>` : x.soft.length ? `<span class="pill warn" title="${esc(x.soft.join('\n'))}">${x.soft.length} ملاحظة</span>` : `<span class="pill ok">مستوفاة</span>`}</td>
            <td>${stPill(APP_ST, a.status)}</td><td>${fmtDate(a.submittedAt)}</td>
            <td><button class="btn btn-ghost btn-sm" data-open="${a.id}">${ic('eye', 15)} مراجعة</button></td></tr>`;
        }).join('')}</tbody></table></div>` : `<div class="empty">${ic('file', 36)}<p>${q ? 'لا نتائج مطابقة.' : f === 'open' ? 'لا طلبات بحاجة لقرار الآن.' : 'لا توجد طلبات هنا. تصل طلبات الالتحاق من صفحة «القبول» في الموقع.'}</p></div>`;
      };
      $('#sf').onclick = e => { const b = e.target.closest('[data-f]'); if (!b) return; f = b.dataset.f; draw(); };
      $('#pf').onchange = draw; $('#q').oninput = e => { q = e.target.value.trim().toLowerCase(); draw(); };
      $('#csv').onclick = () => downloadFile('applications.csv', toCSV([['الاسم', 'الاسم بالإنجليزية', 'البرنامج', 'المسار', 'الحالة', 'تاريخ الميلاد', 'العمر', 'الجنس', 'الجنسية', 'البلد', 'المدينة', 'الجوال', 'البريد', 'المؤهل', 'التخصص', 'سنة المؤهل', 'الجهة', 'العربية', 'الحفظ', 'إجازات سابقة', 'كيف عرف', 'الدافع', 'الرقم الجامعي', 'ملاحظة القرار', 'تاريخ التقديم'],
        ...vis().map(a => [a.name, a.nameEn, programName(a.program), trackName(a.track), (APP_ST[a.status] || [a.status])[0], a.birthDate, ageOf(a.birthDate), optName(GENDERS, a.gender), a.nationality, a.country, a.city, a.phone, a.email, optName(QUALS, a.qual), a.qualSpec, a.qualYear, a.qualFrom, optName(ARABIC_LV, a.arabic), a.quranAmt, a.priorIjaza, a.heard, a.motivation, a.studentNo, a.decisionNote, fmtDT(a.submittedAt)])]));
      const setSt = async (a, status, note) => {
        const now = Date.now(), v = { status, decisionNote: note, updatedAt: now, history: [...(a.history || []), { at: now, status, note }] };
        if (['accepted', 'rejected'].includes(status)) v.decidedAt = now;
        await DB.update('applications', a.id, v); Object.assign(a, v); draw();
      };
      const accept = (a, note, closeView) => {
        const p = a.program, old = recs.find(r => r.uid === a.uid && r.program === p), t = p === 'academy' ? liveTerm(terms) : null;
        const ij = p === 'ijaza' ? courses.filter(c => c.program === 'ijaza') : [];
        modal(`قبول ${esc(a.name)}`, `<p class="muted" style="margin-top:-6px">${esc(programName(p))} — يصدر للطالب رقم جامعي ويُفتح له قيد في البرنامج.</p>
          <label>الدفعة <span class="hint">اسم يجمع المقبولين معاً، مثل: دفعة 2026</span><input name="cohort" maxlength="40" value="${esc(old?.cohort || S.settings.admCohort || 'دفعة ' + new Date().getFullYear())}"></label>
          ${p === 'academy' ? `<label>يبدأ من <span class="hint">الفصل الأول للمستجد، أو فصل لاحق لمن يُعادَل له ما سبق</span><select name="level">${levelOpts(old?.level || 1)}</select></label>
            ${t ? `<label class="check"><input type="checkbox" name="reg" checked> تسجيله الآن في «${esc(t.name)}» وفتح مواد مستواه</label>` : `<p class="hint">لا يوجد فصل دراسي مفتوح الآن؛ يسجّل الطالب في فصله حين تفتح التسجيل من «القيد والفصول».</p>`}`
          : `<label>المسار<select name="track">${trackOpts(a.track)}</select></label><label class="check"><input type="checkbox" name="reg" checked> تسجيله في مواد المسار الموجودة</label>`}
          <label>ملاحظة للطالب <span class="hint">تظهر له مع القرار</span><textarea name="note" rows="3">${esc(note)}</textarea></label>`, {
          submitText: 'قبول وإصدار الرقم الجامعي', onSubmit: async fd => {
            const now = Date.now(), level = p === 'academy' ? +fd.get('level') || 1 : 0, track = p === 'ijaza' ? fd.get('track') : '';
            const r = { uid: a.uid, program: p, track, level, status: 'active', studentNo: old?.studentNo || await nextStudentNo(p), cohort: fd.get('cohort').trim(), name: a.name, nameEn: a.nameEn || '', username: a.username || '', admittedAt: old?.admittedAt || now, appId: a.id, updatedAt: now };
            await DB.set('records', `${a.uid}_${p}`, r); const ri = recs.findIndex(x => x.id === `${a.uid}_${p}`); ri >= 0 ? recs.splice(ri, 1, { id: `${a.uid}_${p}`, ...r }) : recs.push({ id: `${a.uid}_${p}`, ...r });
            await DB.update('applications', a.id, { studentNo: r.studentNo, cohort: r.cohort, track: track || a.track || '' });
            await setSt(a, 'accepted', fd.get('note').trim()); a.studentNo = r.studentNo;
            let extra = '';
            if (fd.get('reg')) {
              if (p === 'academy' && t) { const g = await registerInTerm(r, t, courses, 'admin'); extra = ` وسُجّل في ${t.name} (${nMawad(g.courseIds.length)})`; }
              if (p === 'ijaza') { let n = 0; for (const c of ij.filter(c => eligibleFor(c, r))) n += await enrollIn(r, c) ? 1 : 0; extra = n ? ` وسُجّل في ${nMawad(n)}` : ''; }
            }
            closeView?.(); toast(`قُبل ${firstName(a.name)} — الرقم الجامعي ${r.studentNo}${extra}`, 'ok');
          }
        });
      };
      $('#tbl').onclick = async e => {
        const b = e.target.closest('[data-open]'); if (!b) return; const a = apps.find(x => x.id === b.dataset.open); if (!a) return;
        if (a.status === 'submitted') await setSt(a, 'review', a.decisionNote || '').catch(() => {});
        const x = admissionIssues(a.program, a), rec = recs.find(r => r.uid === a.uid && r.program === a.program);
        const row = (k, v) => v ? `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>` : '';
        const close = modal(`${esc(a.name)}`, `<div class="toolbar" style="margin:-6px 0 4px">${stPill(APP_ST, a.status)}<span class="muted">${esc(programName(a.program))}${a.track ? ' — ' + esc(trackName(a.track)) : ''} · أُرسل ${fmtDT(a.submittedAt)}</span>${rec ? `<span class="pill ok" dir="ltr">${esc(rec.studentNo)}</span>` : ''}</div>
          <div class="issues">${x.hard.map(t => `<p class="bad">${ic('ban', 16)} ${esc(t)}</p>`).join('')}${x.soft.map(t => `<p>${ic('info', 16)} ${esc(t)}</p>`).join('')}${!x.hard.length && !x.soft.length ? `<p class="good">${ic('check', 16)} شروط القبول مستوفاة حسب البيانات المرسلة</p>` : ''}</div>
          <dl class="facts">${row('الاسم بالإنجليزية', a.nameEn)}${row('تاريخ الميلاد', a.birthDate ? `${a.birthDate} (${ageOf(a.birthDate)} سنة)` : '')}${row('الجنس', optName(GENDERS, a.gender))}${row('الجنسية', a.nationality)}${row('الإقامة', [a.country, a.city].filter(Boolean).join(' — '))}${row('الجوال', a.phone)}${row('البريد', a.email)}${row('اسم المستخدم', a.username)}
            ${row('المؤهل', optName(QUALS, a.qual))}${row('التخصص', a.qualSpec)}${row('سنة المؤهل', a.qualYear)}${row('الجهة المانحة', a.qualFrom)}${row('مستوى العربية', optName(ARABIC_LV, a.arabic))}${row('الحفظ', a.quranAmt)}${row('إجازات سابقة', a.priorIjaza)}${row('كيف عرفنا', a.heard)}</dl>
          ${a.motivation ? `<h4 style="margin-top:14px">سبب الالتحاق</h4><div class="msg-body">${esc(a.motivation)}</div>` : ''}
          <div class="app-file" id="afile">${a.hasFile ? 'جارٍ تحميل صورة المؤهل…' : '<span class="muted">لم تُرفع صورة المؤهل.</span>'}</div>
          ${(a.history || []).length ? `<h4 style="margin-top:14px">سجل القرارات</h4><div class="rowlist">${a.history.map(h => `<div class="ritem"><div class="grow">${stPill(APP_ST, h.status)} ${h.note ? `<small>${esc(h.note)}</small>` : ''}</div><small>${fmtDT(h.at)}</small></div>`).join('')}</div>` : ''}
          <label style="display:grid;gap:6px;margin-top:16px;font-weight:500">ملاحظة للمتقدّم <span class="hint">تظهر له مع القرار — ضرورية عند طلب الاستكمال</span><textarea id="dn" rows="3">${esc(a.decisionNote)}</textarea></label>
          <div class="hero-cta dec" style="margin-top:12px">${a.status !== 'accepted' ? `<button type="button" class="btn btn-primary btn-sm" data-d="accepted">${ic('check', 16)} قبول</button>` : `<a class="btn btn-ghost btn-sm" href="#/registry">${ic('users', 16)} القيد</a>`}
            ${a.status !== 'incomplete' && a.status !== 'accepted' ? `<button type="button" class="btn btn-ghost btn-sm" data-d="incomplete">طلب استكمال</button>` : ''}
            ${!['review', 'accepted'].includes(a.status) ? `<button type="button" class="btn btn-ghost btn-sm" data-d="review">قيد المراجعة</button>` : ''}
            ${!['waitlist', 'accepted'].includes(a.status) ? `<button type="button" class="btn btn-ghost btn-sm" data-d="waitlist">قائمة الانتظار</button>` : ''}
            ${a.status !== 'rejected' && a.status !== 'accepted' ? `<button type="button" class="btn btn-ghost btn-sm danger-t" data-d="rejected">رفض</button>` : ''}
            ${['rejected', 'withdrawn'].includes(a.status) ? `<button type="button" class="btn btn-ghost btn-sm" data-d="incomplete" title="يفتح الطلب للمتقدّم ليعدّله ويعيد إرساله">السماح بإعادة التقديم</button>` : ''}
            <button type="button" class="btn btn-ghost btn-sm danger-t" data-d="delete" title="حذف الطلب نهائياً">${ic('trash', 16)}</button></div>`, { wide: true, noFoot: true });
        const bx = $('.modal-bg .modal');
        if (a.hasFile) safeGet('appFiles', a.id).then(fl => { const el = $('#afile', bx); if (!el) return; el.innerHTML = fl?.data ? `<h4>صورة المؤهل</h4><button type="button" class="app-img" title="فتح بالحجم الكامل"><img src="${fl.data}" alt="صورة المؤهل"></button>` : '<span class="muted">تعذّر تحميل الصورة.</span>'; $('.app-img', el) && ($('.app-img', el).onclick = () => openDataUrl(fl.data)); });
        setTimeout(() => { document.activeElement?.blur(); bx.scrollTop = 0; bx.parentElement.scrollTop = 0; }, 80);
        bx.onclick = async ev => {
          const d = ev.target.closest('[data-d]')?.dataset.d; if (!d) return; const note = $('#dn', bx).value.trim();
          try {
            if (d === 'accepted') return accept(a, note, close);
            if (d === 'delete') { close(); if (await confirmBox(`حذف طلب «${esc(a.name)}» نهائياً؟ يستطيع التقديم من جديد بعدها. لا يُحذف قيده إن كان مقبولاً.`, 'حذف')) { await DB.del('applications', a.id); await DB.del('appFiles', a.id).catch(() => {}); apps.splice(apps.indexOf(a), 1); draw(); toast('حُذف الطلب'); } return; }
            if (d === 'incomplete' && !note) { $('#dn', bx).focus(); toast('اكتب للمتقدّم ما المطلوب استكماله', 'err'); return; }
            await setSt(a, d, note); close(); toast(`حالة الطلب: ${APP_ST[d][0]}`, 'ok');
          } catch (err) { toast(err.message, 'err'); }
        };
      };
      draw();
    }
  };
}
/* مواعيد القبول لكل برنامج: settings.adm */
function admWindows(tabs) {
  const st = S.settings, adm = st.adm || {};
  const box = p => { const w = adm[p] || {}, es = enrollState(w); return `<fieldset class="fset" data-p="${p}"><legend>${ic(p === 'academy' ? 'book' : 'moonc', 17)} ${esc(programName(p))} <span class="pill ${es.open ? 'ok' : es.state === 'soon' ? 'mut' : 'no'}">${esc(admLabel(es))}</span></legend>
    <label>القبول<select name="m_${p}" data-mode>${ENROLL_MODES.map(([k, t]) => `<option value="${k}" ${(w.enrollMode || 'open') === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
    <div class="row" data-m="window"><label>يفتح في <span class="hint">فارغ = من الآن</span><input type="date" name="s_${p}" value="${toDateInput(w.enrollStart)}"></label><label>يُغلق في <span class="hint">فارغ = بلا نهاية</span><input type="date" name="e_${p}" value="${toDateInput(w.enrollEnd)}"></label></div>
    <label data-m="closed window">ملاحظة حين يكون القبول مغلقاً <span class="hint">مثل: يفتح القبول للدفعة القادمة في شوال</span><input name="n_${p}" maxlength="120" value="${esc(w.enrollNote)}"></label></fieldset>`; };
  return {
    html: `${tabs}<form class="form panel" id="fw" style="max-width:820px"><p class="hint">يظهر الموعد في صفحة «القبول» والبرامج، ولا يُقبل طلب جديد خارجه (تتحقق منه قواعد Firestore أيضاً). شروط القبول نفسها تُعدّل من <a href="#/settings" style="color:var(--teal)">الإعدادات ← الأكاديمية والبرامج</a>.</p>
      ${ADM_PROGS.map(box).join('')}
      <label>الدفعة الافتراضية للمقبولين <span class="hint">تُقترح عند كل قبول، مثل: دفعة 2026</span><input name="cohort" maxlength="40" value="${esc(st.admCohort)}" placeholder="دفعة ${new Date().getFullYear()}"></label>
      <div><button class="btn btn-primary">حفظ مواعيد القبول</button></div></form>`,
    mount() {
      const f = $('#fw');
      $$('[data-p]', f).forEach(fs => { const m = $('[data-mode]', fs), vis = () => $$('[data-m]', fs).forEach(el => el.hidden = !el.dataset.m.split(' ').includes(m.value)); m.onchange = vis; vis(); });
      f.onsubmit = async e => {
        e.preventDefault(); const fd = new FormData(f), adm2 = {};
        for (const p of ADM_PROGS) {
          const w = { enrollMode: fd.get('m_' + p), enrollStart: fromDateInput(fd.get('s_' + p)), enrollEnd: fromDateInput(fd.get('e_' + p), true), enrollNote: fd.get('n_' + p).trim() };
          if (w.enrollMode !== 'window') { w.enrollStart = 0; w.enrollEnd = 0; }
          if (w.enrollStart && w.enrollEnd && w.enrollEnd < w.enrollStart) { toast(`${programName(p)}: تاريخ الإغلاق قبل تاريخ الفتح`, 'err'); return; }
          adm2[p] = w;
        }
        const v = { adm: adm2, admCohort: fd.get('cohort').trim() };
        try { await DB.update('settings', 'main', v); Object.assign(S.settings, v); toast('حُفظت مواعيد القبول', 'ok'); route(); } catch (err) { toast(err.message, 'err'); }
      };
    }
  };
}

/* ================= القيد والفصول: سجلات الطلاب والفصول الدراسية ================= */
const REG_TABS = [['', 'سجلات الطلاب', 'users'], ['terms', 'الفصول الدراسية', 'calendar']];
const termForm = (t = {}) => `<label>اسم الفصل <span class="hint">مثل: الفصل الأول 2026/2027</span><input name="name" required maxlength="60" value="${esc(t.name)}"></label>
  <div class="row"><label>بداية الدراسة<input type="date" name="startsAt" required value="${toDateInput(t.startsAt)}"></label><label>نهاية الفصل<input type="date" name="endsAt" value="${toDateInput(t.endsAt)}"></label></div>
  <fieldset class="fset"><legend>${ic('calendar', 17)} تسجيل الطلاب في الفصل</legend>
    <label>التسجيل<select name="enrollMode" data-mode>${ENROLL_MODES.map(([k, tt]) => `<option value="${k}" ${(t.enrollMode || 'closed') === k ? 'selected' : ''}>${tt}</option>`).join('')}</select></label>
    <div class="row" data-m="window"><label>يفتح في<input type="date" name="enrollStart" value="${toDateInput(t.enrollStart)}"></label><label>يُغلق في<input type="date" name="enrollEnd" value="${toDateInput(t.enrollEnd)}"></label></div>
    <p class="hint">حين يكون مفتوحاً يرى كل طالب منتظم زرّ «سجّل في الفصل» في حسابه، فيُسجَّل في مواد مستواه المنشورة. ويمكنك تسجيلهم جميعاً من صفحة الفصل.</p></fieldset>`;
const termModeVis = f => { const m = $('[data-mode]', f); const vis = () => $$('[data-m]', f).forEach(el => el.hidden = !el.dataset.m.split(' ').includes(m.value)); m.onchange = vis; vis(); };
const readTerm = fd => {
  const t = { name: fd.get('name').trim(), program: 'academy', startsAt: fromDateInput(fd.get('startsAt')), endsAt: fromDateInput(fd.get('endsAt'), true), enrollMode: fd.get('enrollMode'), enrollStart: fromDateInput(fd.get('enrollStart')), enrollEnd: fromDateInput(fd.get('enrollEnd'), true), enrollNote: '' };
  if (t.enrollMode !== 'window') { t.enrollStart = 0; t.enrollEnd = 0; }
  if (t.endsAt && t.endsAt < t.startsAt) throw new Error('نهاية الفصل قبل بدايته');
  if (t.enrollStart && t.enrollEnd && t.enrollEnd < t.enrollStart) throw new Error('إغلاق التسجيل قبل فتحه');
  return t;
};
const termPill = t => { const es = enrollState(t); return `<span class="pill ${es.open ? 'ok' : es.state === 'soon' ? 'mut' : 'no'}">${es.open ? (es.closesAt ? 'التسجيل مفتوح حتى ' + fmtDate(es.closesAt) : 'التسجيل مفتوح') : es.state === 'soon' ? 'يفتح ' + fmtDate(es.opensAt) : 'التسجيل مغلق'}</span>`; };
const termPhase = t => { const n = Date.now(); return n < +t.startsAt ? 'لم يبدأ' : +t.endsAt && n > +t.endsAt ? 'انتهى' : 'جارٍ'; };
async function adminRegistry(tab = '') {
  const base = { active: 'registry', title: 'القيد والفصول' };
  const tabs = `<div class="tabs" role="tablist">${REG_TABS.map(([k, t, i]) => `<a class="tab ${tab === k ? 'on' : ''}" href="#/registry${k ? '/' + k : ''}">${ic(i, 16)} ${t}</a>`).join('')}</div>`;
  const [recs, regs, terms] = await Promise.all([DB.list('records'), DB.list('regs'), DB.list('terms')]);
  terms.sort((a, b) => (+b.startsAt || 0) - (+a.startsAt || 0));
  if (tab === 'terms') return {
    ...base, actions: `<button class="btn btn-primary btn-sm" id="newT">${ic('plus', 16)} فصل دراسي جديد</button>`,
    html: `${tabs}<p class="muted" style="margin-bottom:16px">الفصل الدراسي فترة زمنية يدرس فيها كل طالب منتظم مواد مستواه (الفصل الأول أو الثاني…) من البرنامج الأكاديمي. افتح التسجيل فيه، ثم رفّع الطلاب بعد نهايته من «سجلات الطلاب».</p>
      ${terms.length ? `<div class="tbl-wrap"><table><thead><tr><th>الفصل</th><th>المدة</th><th>الحالة</th><th>التسجيل</th><th>المسجّلون</th><th></th></tr></thead><tbody>${terms.map(t => `<tr><td><a href="#/term/${t.id}"><strong>${esc(t.name)}</strong></a></td><td>${fmtDate(t.startsAt)}${t.endsAt ? ' ← ' + fmtDate(t.endsAt) : ''}</td><td>${termPhase(t)}</td><td>${termPill(t)}</td><td>${regs.filter(g => g.termId === t.id).length}</td><td><a class="btn btn-ghost btn-sm" href="#/term/${t.id}">${ic('edit', 15)} إدارة</a></td></tr>`).join('')}</tbody></table></div>`
        : `<div class="empty">${ic('calendar', 36)}<p>لا توجد فصول دراسية بعد. أنشئ الفصل الذي تبدأ فيه الدراسة، وافتح التسجيل فيه.</p></div>`}`,
    mount() {
      $('#newT').onclick = () => modal('فصل دراسي جديد', termForm({ enrollMode: 'open' }), {
        onOpen: termModeVis, submitText: 'إنشاء', onSubmit: async fd => { const t = readTerm(fd), id = genId(); await DB.set('terms', id, { ...t, createdAt: Date.now() }); toast('أُنشئ الفصل', 'ok'); go('/term/' + id); }
      });
    }
  };
  const users = await DB.list('users'), um = Object.fromEntries(users.map(u => [u.id, u]));
  return {
    ...base, actions: `<button class="btn btn-ghost btn-sm" id="csv">${ic('download', 16)} تصدير</button><button class="btn btn-primary btn-sm" id="addR">${ic('plus', 16)} قيد طالب يدوياً</button>`,
    html: `${tabs}<div class="toolbar"><select id="pf" style="max-width:200px">${progOpts('')}</select><select id="lf" style="max-width:220px"><option value="">كل المستويات</option>${levelOpts(0)}${IJAZA_PLAN.map(t => `<option value="t:${t.key}">${esc(t.title)}</option>`).join('')}</select><select id="sf2" style="max-width:170px"><option value="">كل الحالات</option>${Object.entries(REC_ST).map(([k, [t]]) => `<option value="${k}">${t}</option>`).join('')}</select>
      <label class="searchbox grow">${ic('search', 18)}<span class="sr">بحث</span><input id="q" placeholder="الاسم أو الرقم الجامعي أو الدفعة"></label></div>
      <div class="bulk" id="bulk" hidden><b id="bn"></b><button class="btn btn-ghost btn-sm" id="promo">${ic('up', 15)} ترفيع إلى الفصل التالي</button><select id="bst" style="max-width:170px"><option value="">تغيير الحالة إلى…</option>${Object.entries(REC_ST).map(([k, [t]]) => `<option value="${k}">${t}</option>`).join('')}</select></div>
      <div id="tbl"></div>`,
    mount() {
      let q = ''; const sel = new Set();
      const vis = () => recs.filter(r => (!$('#pf').value || r.program === $('#pf').value) && (!$('#lf').value || ($('#lf').value.startsWith('t:') ? r.track === $('#lf').value.slice(2) : r.program === 'academy' && +r.level === +$('#lf').value)) && (!$('#sf2').value || r.status === $('#sf2').value) && (!q || [r.name, r.studentNo, r.cohort, r.username].join(' ').toLowerCase().includes(q)))
        .sort((a, b) => String(a.studentNo).localeCompare(String(b.studentNo)));
      const bulk = () => { $('#bulk').hidden = !sel.size; $('#bn').textContent = `${sel.size} محدّد`; };
      const draw = () => {
        const l = vis();
        $('#tbl').innerHTML = l.length ? `<div class="tbl-wrap"><table><thead><tr><th><input type="checkbox" id="all" aria-label="تحديد الكل"></th><th>الرقم الجامعي</th><th>الطالب</th><th>البرنامج والمستوى</th><th>الدفعة</th><th>الفصول</th><th>الحالة</th><th></th></tr></thead><tbody>${l.map(r => `<tr>
          <td><input type="checkbox" data-sel="${r.id}" ${sel.has(r.id) ? 'checked' : ''}></td><td dir="ltr" style="text-align:end"><b>${esc(r.studentNo || '—')}</b></td><td><strong>${esc(r.name)}</strong><br><small class="muted" dir="ltr">${esc(r.username || um[r.uid]?.username || '')}</small></td>
          <td>${esc(programName(r.program))}<br><small class="muted">${esc(recLevel(r))}</small></td><td>${esc(r.cohort || '—')}</td><td>${regs.filter(g => g.uid === r.uid && g.program === r.program).length}</td><td>${stPill(REC_ST, r.status)}</td>
          <td><div class="acts"><button class="icon-btn sm" data-a="view" data-id="${r.id}" title="الفصول">${ic('eye', 16)}</button><button class="icon-btn sm" data-a="edit" data-id="${r.id}" title="تعديل القيد">${ic('edit', 16)}</button></div></td></tr>`).join('')}</tbody></table></div>`
          : `<div class="empty">${ic('users', 36)}<p>${recs.length ? 'لا سجلات مطابقة.' : 'لا يوجد طلاب مقيّدون بعد. يُقيَّد الطالب عند قبول طلبه من «القبول»، أو يدوياً من الزر أعلاه.'}</p></div>`;
        $('#all') && ($('#all').onchange = e => { l.forEach(r => e.target.checked ? sel.add(r.id) : sel.delete(r.id)); draw(); });
        bulk();
      };
      ['#pf', '#lf', '#sf2'].forEach(s => $(s).onchange = () => { sel.clear(); draw(); });
      $('#q').oninput = e => { q = e.target.value.trim().toLowerCase(); draw(); };
      $('#csv').onclick = () => downloadFile('records.csv', toCSV([['الرقم الجامعي', 'الاسم', 'الاسم بالإنجليزية', 'اسم المستخدم', 'البرنامج', 'المستوى / المسار', 'الدفعة', 'الحالة', 'تاريخ القبول', 'عدد الفصول'], ...vis().map(r => [r.studentNo, r.name, r.nameEn, r.username, programName(r.program), recLevel(r), r.cohort, (REC_ST[r.status] || [r.status])[0], fmtDate(r.admittedAt), regs.filter(g => g.uid === r.uid && g.program === r.program).length])]));
      const upd = async (r, v) => { v.updatedAt = Date.now(); await DB.update('records', r.id, v); Object.assign(r, v); };
      $('#promo').onclick = async () => {
        const l = recs.filter(r => sel.has(r.id) && r.program === 'academy' && r.status === 'active');
        if (!l.length) { toast('الترفيع للطلاب المنتظمين في البرنامج الأكاديمي فقط', 'err'); return; }
        const fin = l.filter(r => +r.level >= 4).length;
        if (!(await confirmBox(`ترفيع ${l.length} طالب إلى الفصل التالي؟${fin ? `<br><small class="muted">${fin} منهم في الفصل الرابع، فتصبح حالتهم «أنهى المواد».</small>` : ''}`, 'ترفيع'))) return;
        try { for (const r of l) await upd(r, +r.level >= 4 ? { status: 'completed' } : { level: +r.level + 1 }); sel.clear(); draw(); toast(`رُفّع ${l.length} طالب`, 'ok'); } catch (err) { toast(err.message, 'err'); }
      };
      $('#bst').onchange = async e => {
        const s = e.target.value; e.target.value = ''; if (!s) return; const l = recs.filter(r => sel.has(r.id));
        if (!(await confirmBox(`تغيير حالة ${l.length} طالب إلى «${REC_ST[s][0]}»؟`, 'تغيير'))) return;
        try { for (const r of l) await upd(r, { status: s }); sel.clear(); draw(); toast('حُدّثت الحالات', 'ok'); } catch (err) { toast(err.message, 'err'); }
      };
      const recForm = r => `${r.program === 'academy' ? `<label>المستوى الحالي<select name="level">${levelOpts(r.level)}</select></label>` : `<label>المسار<select name="track">${trackOpts(r.track)}</select></label>`}
        <div class="row"><label>الحالة<select name="status">${Object.entries(REC_ST).map(([k, [t]]) => `<option value="${k}" ${r.status === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label><label>الدفعة<input name="cohort" maxlength="40" value="${esc(r.cohort)}"></label></div>`;
      $('#addR').onclick = () => {
        const free = users.filter(u => !u.disabled).sort((a, b) => String(a.name).localeCompare(String(b.name), 'ar'));
        modal('قيد طالب يدوياً', `<p class="hint" style="margin-top:-6px">لطالب له حساب ولم يمرّ بطلب التحاق (مثل الطلاب القدامى). يصدر له رقم جامعي.</p>
          <label>الطالب<select name="uid" required><option value="">اختر</option>${free.map(u => `<option value="${u.id}">${esc(u.name)} — ${esc(u.username || '')}</option>`).join('')}</select></label>
          <label>البرنامج<select name="program" id="rp">${progOpts('academy', '')}</select></label>
          <label data-pp="academy">يبدأ من<select name="level">${levelOpts(1)}</select></label><label data-pp="ijaza">المسار<select name="track">${trackOpts('')}</select></label>
          <label>الدفعة<input name="cohort" maxlength="40" value="${esc(S.settings.admCohort || 'دفعة ' + new Date().getFullYear())}"></label>`, {
          onOpen: f => { const pp = () => $$('[data-pp]', f).forEach(el => el.hidden = el.dataset.pp !== $('#rp', f).value); $('#rp', f).onchange = pp; pp(); },
          onSubmit: async fd => {
            const u = um[fd.get('uid')], p = fd.get('program'), id = `${u.id}_${p}`;
            if (recs.some(r => r.id === id)) throw new Error('هذا الطالب مقيّد في البرنامج من قبل');
            const r = { uid: u.id, program: p, track: p === 'ijaza' ? fd.get('track') : '', level: p === 'academy' ? +fd.get('level') : 0, status: 'active', studentNo: await nextStudentNo(p), cohort: fd.get('cohort').trim(), name: u.name, nameEn: u.nameEn || '', username: u.username || '', admittedAt: Date.now(), appId: '', updatedAt: Date.now() };
            await DB.set('records', id, r); recs.push({ id, ...r }); draw(); toast(`قُيّد ${firstName(u.name)} — ${r.studentNo}`, 'ok');
          }
        });
      };
      $('#tbl').onclick = async e => {
        const cb = e.target.closest('[data-sel]'); if (cb) { cb.checked ? sel.add(cb.dataset.sel) : sel.delete(cb.dataset.sel); bulk(); return; }
        const b = e.target.closest('[data-a]'); if (!b) return; const r = recs.find(x => x.id === b.dataset.id); if (!r) return;
        if (b.dataset.a === 'edit') modal(`قيد ${esc(r.name)} — ${esc(r.studentNo)}`, recForm(r), {
          onSubmit: async fd => { const v = { status: fd.get('status'), cohort: fd.get('cohort').trim() }; if (r.program === 'academy') v.level = +fd.get('level'); else v.track = fd.get('track'); await upd(r, v); draw(); toast('حُفظ القيد', 'ok'); }
        });
        if (b.dataset.a === 'view') {
          const mine = regs.filter(g => g.uid === r.uid && g.program === r.program).sort((x, y) => y.at - x.at);
          modal(esc(r.name), `<dl class="facts"><div><dt>الرقم الجامعي</dt><dd dir="ltr">${esc(r.studentNo)}</dd></div><div><dt>البرنامج</dt><dd>${esc(programName(r.program))}</dd></div><div><dt>المستوى / المسار</dt><dd>${esc(recLevel(r))}</dd></div><div><dt>الدفعة</dt><dd>${esc(r.cohort || '—')}</dd></div><div><dt>تاريخ القبول</dt><dd>${fmtDate(r.admittedAt)}</dd></div><div><dt>الحالة</dt><dd>${stPill(REC_ST, r.status)}</dd></div></dl>
            <h4 style="margin-top:16px">الفصول المسجّل فيها</h4>${mine.length ? `<div class="rowlist">${mine.map(g => `<a class="ritem" href="#/term/${g.termId}"><div class="grow"><strong>${esc(g.termName)}</strong><br><small>${esc(termLabel(g.level))} — ${nMawad((g.courseIds || []).length)}</small></div><small>${fmtDate(g.at)} · ${g.by === 'admin' ? 'من الإدارة' : 'بنفسه'}</small></a>`).join('')}</div>` : '<p class="muted">لم يُسجَّل في أي فصل بعد.</p>'}
            ${r.appId ? `<p style="margin-top:14px"><a href="#/admissions" style="color:var(--teal)">طلب الالتحاق في قسم القبول</a></p>` : ''}`, { wide: true, noFoot: true });
        }
      };
      draw();
    }
  };
}
async function adminTerm(id) {
  const [t, recs, regs, courses, enr] = await Promise.all([DB.get('terms', id), DB.list('records'), DB.list('regs', { termId: id }), DB.list('courses'), DB.list('enrollments')]);
  if (!t) return { active: 'registry', title: 'غير موجود', html: '<div class="empty">الفصل غير موجود.</div>' };
  const act = recs.filter(r => r.program === 'academy' && r.status === 'active'), known = new Set(enr.map(x => x.id));
  const todo = () => act.filter(r => !regs.some(g => g.uid === r.uid));
  return {
    active: 'registry', title: esc(t.name),
    actions: `<a class="btn btn-ghost btn-sm" href="#/registry/terms">${ic('prev', 16)} الفصول</a><button class="btn btn-ghost btn-sm" id="csv">${ic('download', 16)} تصدير المسجّلين</button>`,
    html: `<div class="cols"><form class="form panel" id="tf"><h3>بيانات الفصل <span style="font-weight:400">${termPill(t)}</span></h3>${termForm(t)}<div class="hero-cta" style="margin:0"><button class="btn btn-primary">حفظ</button><button type="button" class="btn btn-ghost danger-t" id="delT">${ic('trash', 16)} حذف الفصل</button></div></form>
      <div style="display:grid;gap:20px;align-content:start"><div class="panel"><h3>المستويات في هذا الفصل</h3>
        <div class="tbl-wrap"><table><thead><tr><th>المستوى</th><th>المواد المنشورة</th><th>الطلاب المنتظمون</th><th>المسجّلون</th></tr></thead><tbody>${[1, 2, 3, 4].map(l => `<tr><td>${termLabel(l)}</td><td>${levelCourses(courses, l).length}</td><td>${act.filter(r => +r.level === l).length}</td><td><b>${regs.filter(g => +g.level === l).length}</b></td></tr>`).join('')}</tbody></table></div>
        <div class="hero-cta" style="margin:14px 0 0"><button class="btn btn-brass btn-sm" id="regAll">${ic('users', 16)} تسجيل كل المنتظمين (<span id="tn">${todo().length}</span>)</button><button class="btn btn-ghost btn-sm" id="sync" title="يضيف للمسجّلين ما نُشر من مواد مستواهم بعد تسجيلهم">${ic('check', 16)} مزامنة المواد</button></div>
        <p class="hint" style="margin-top:8px">يُسجَّل كل طالب في مواد مستواه المنشورة. إن نشرت مادة بعد التسجيل اضغط «مزامنة المواد».</p></div></div></div>
      <div class="panel" style="margin-top:20px"><h3>المسجّلون (${regs.length})</h3><div id="rl"></div></div>`,
    mount() {
      const f = $('#tf'); termModeVis(f);
      const draw = () => {
        regs.sort((a, b) => (+a.level - +b.level) || String(a.studentNo).localeCompare(String(b.studentNo)));
        $('#rl').innerHTML = regs.length ? `<div class="tbl-wrap"><table><thead><tr><th>الرقم الجامعي</th><th>الطالب</th><th>المستوى</th><th>المواد</th><th>سجّل</th><th></th></tr></thead><tbody>${regs.map(g => `<tr><td dir="ltr" style="text-align:end">${esc(g.studentNo || '—')}</td><td>${esc(g.name)}</td><td>${esc(termLabel(g.level))}</td><td>${(g.courseIds || []).length}</td><td>${fmtDate(g.at)} <small class="muted">${g.by === 'admin' ? 'الإدارة' : 'بنفسه'}</small></td><td><button class="icon-btn sm danger" data-rm="${g.id}" title="إلغاء التسجيل">${ic('trash', 16)}</button></td></tr>`).join('')}</tbody></table></div>` : `<p class="muted">لم يُسجَّل أحد بعد.</p>`;
        $('#tn').textContent = todo().length; $('h3', $('#rl').parentElement).textContent = `المسجّلون (${regs.length})`;
      };
      f.onsubmit = async e => { e.preventDefault(); try { const v = readTerm(new FormData(f)); v.updatedAt = Date.now(); await DB.update('terms', id, v); Object.assign(t, v); toast('حُفظ الفصل', 'ok'); route(); } catch (err) { toast(err.message, 'err'); } };
      $('#delT').onclick = async () => {
        if (!(await confirmBox(`حذف «${esc(t.name)}»؟${regs.length ? `<br><small class="muted">تُحذف ${regs.length} تسجيلات فصلية، وتبقى تسجيلات الطلاب في المواد وتقدّمهم.</small>` : ''}`, 'حذف'))) return;
        for (const g of regs) await DB.del('regs', g.id); await DB.del('terms', id); toast('حُذف الفصل'); go('/registry/terms');
      };
      $('#regAll').onclick = async e => {
        const l = todo(); if (!l.length) { toast('كل الطلاب المنتظمين مسجّلون في هذا الفصل'); return; }
        if (!(await confirmBox(`تسجيل ${l.length} طالب منتظم في «${esc(t.name)}»، كلٌّ في مواد مستواه؟`, 'تسجيل'))) return;
        const b = e.currentTarget; b.disabled = true; let n = 0;
        try { for (let i = 0; i < l.length; i += 8) { const part = await Promise.all(l.slice(i, i + 8).map(r => registerInTerm(r, t, courses, 'admin', known))); regs.push(...part); n += part.length; b.textContent = `جارٍ التسجيل… ${n}/${l.length}`; } toast(`سُجّل ${n} طالب`, 'ok'); }
        catch (err) { toast(err.message, 'err'); }
        b.disabled = false; route();
      };
      $('#sync').onclick = async e => {
        const b = e.currentTarget; b.disabled = true; let add = 0;
        try {
          for (const g of regs) {
            const r = recs.find(x => x.uid === g.uid && x.program === 'academy') || { uid: g.uid, name: g.name }, lc = levelCourses(courses, g.level);
            for (const c of lc) add += await enrollIn(r, c, known) ? 1 : 0;
            const ids = [...new Set([...(g.courseIds || []), ...lc.map(c => c.id)])];
            if (ids.length !== (g.courseIds || []).length) { await DB.update('regs', g.id, { courseIds: ids }); g.courseIds = ids; }
          }
          toast(add ? `أُضيف ${add} تسجيل مادة` : 'كل المسجّلين مسجّلون في مواد مستواهم', 'ok'); draw();
        } catch (err) { toast(err.message, 'err'); }
        b.disabled = false;
      };
      $('#csv').onclick = () => downloadFile(`term-${t.name}.csv`, toCSV([['الرقم الجامعي', 'الطالب', 'المستوى', 'عدد المواد', 'تاريخ التسجيل', 'بواسطة'], ...regs.map(g => [g.studentNo, g.name, termLabel(g.level), (g.courseIds || []).length, fmtDT(g.at), g.by === 'admin' ? 'الإدارة' : 'الطالب'])]));
      $('#rl').onclick = async e => {
        const b = e.target.closest('[data-rm]'); if (!b) return; const g = regs.find(x => x.id === b.dataset.rm);
        if (!(await confirmBox(`إلغاء تسجيل ${esc(g.name)} في هذا الفصل؟ تُلغى أيضاً تسجيلاته في مواد الفصل التي لم يبدأها.`, 'إلغاء التسجيل'))) return;
        try {
          for (const cid of g.courseIds || []) { const en = enr.find(x => x.id === `${g.uid}_${cid}`); if (en && !(en.completed || []).length) { await DB.del('enrollments', en.id); known.delete(en.id); } }
          await DB.del('regs', g.id); regs.splice(regs.indexOf(g), 1); draw(); toast('أُلغي التسجيل');
        } catch (err) { toast(err.message, 'err'); }
      };
      draw();
    }
  };
}

/* ================= الشهادات: الصادرة · الأنواع · ربط الدورات · الإعدادات ================= */
const CERT_TABS = [['', 'الشهادات الصادرة', 'award'], ['types', 'أنواع الشهادات', 'star'], ['courses', 'شهادة كل دورة', 'book'], ['settings', 'الإعدادات', 'settings']];
const CERT_FORMAT_TIP = 'الصيغة الموصى بها: PNG أو JPG بمقاس A4 أفقي <b dir="ltr">3508×2480</b> بكسل (أو <b dir="ltr">2480×3508</b> عمودي)، أو PDF من صفحة واحدة بمقاس A4. اترك في التصميم أماكن الاسم والدورة والتاريخ ورمز QR فارغة لتُكتب تلقائياً.';
const typeName = (types, id) => (types.find(t => t.id === id) || {}).name;
/* أول دخول: يُنشأ نوع «شهادة إتمام» من القالب المختار سابقاً ويصبح الافتراضي، فلا تتغير الشهادات الحالية */
async function ensureCertTypes(types) {
  if (types.length) return types;
  const id = genId(), t = { name: 'شهادة إتمام', langs: '', design: 'tpl', tpl: S.settings.certTemplate || 'classic', titleAr: '', titleEn: '', lineAr: '', lineEn: '', o: 'landscape', hasEn: false, layout: {}, v: Date.now(), createdAt: Date.now(), updatedAt: Date.now() };
  try { await DB.set('certTypes', id, t); await DB.update('settings', 'main', { certDefault: id }); S.settings.certDefault = id; return [{ id, ...t }]; } catch { return []; }
}
async function adminCerts(tab = '') {
  const [certs, rawTypes, courses] = await Promise.all([DB.list('certificates'), DB.list('certTypes'), DB.list('courses')]);
  const types = await ensureCertTypes(rawTypes); types.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const st = S.settings, defId = types.some(t => t.id === st.certDefault) ? st.certDefault : '';
  const cm = Object.fromEntries(courses.map(c => [c.id, c]));
  const tabs = `<div class="tabs" role="tablist">${CERT_TABS.map(([k, t, i]) => `<a class="tab ${tab === k ? 'on' : ''}" href="#/certs${k ? '/' + k : ''}">${ic(i, 16)} ${t}${k === 'types' ? ` <span class="pill mut">${types.length}</span>` : k === '' ? ` <span class="pill mut">${certs.length}</span>` : ''}</a>`).join('')}</div>`;
  const typeOpts = (sel, withDef = true) => `${withDef ? `<option value="">الافتراضية${defId ? ` (${esc(typeName(types, defId))})` : ''}</option>` : ''}${types.map(t => `<option value="${t.id}" ${sel === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}`;
  const base = { active: 'certs', title: 'الشهادات' };

  if (tab === 'types') {
    const full = await Promise.all(types.map(t => loadCertType(t.id).then(x => x || t)));
    const used = id => courses.filter(c => (c.certType || defId) === id).length;
    return {
      ...base, actions: `<button class="btn btn-primary btn-sm" id="newT">${ic('plus', 16)} نوع جديد</button>`,
      html: `${tabs}<p class="muted" style="margin-bottom:16px">النوع هو شكل الشهادة ونصها: اختر قالباً جاهزاً أو ارفع تصميمك (PNG أو JPG أو PDF) وحدّد أماكن البيانات عليه. ثم اربط كل دورة بنوعها من «شهادة كل دورة».</p>
        <div class="tcards">${full.map(t => `<div class="tcard"><div class="thumb"><div class="cert-wrap">${certHtml(CERT_SAMPLE(), (certLangList(t)[0]), { type: t })}</div></div>
          <h4>${esc(t.name)} ${t.id === defId ? '<span class="pill ok">الافتراضية</span>' : ''}<span class="pill mut">${t.design === 'image' ? 'تصميم مستورد' : 'قالب ' + (CERT_TPLS[t.tpl]?.name || '')}</span></h4>
          <small class="muted">${CERT_LANGS[t.langs] || 'اللغة حسب الإعداد العام'} — ${used(t.id)} دورة</small>
          <div class="acts"><a class="btn btn-ghost btn-sm" href="#/certtype/${t.id}">${ic('edit', 15)} تعديل</a><button class="icon-btn sm" data-dup="${t.id}" title="نسخة جديدة منه">${ic('plus', 16)}</button>${t.id !== defId ? `<button class="icon-btn sm" data-def="${t.id}" title="اجعله الافتراضي">${ic('check', 16)}</button>` : ''}<button class="icon-btn sm danger" data-rm="${t.id}" title="حذف">${ic('trash', 16)}</button></div></div>`).join('')}</div>`,
      mount() {
        $('#newT').onclick = () => modal('نوع شهادة جديد', `<label>اسم النوع <span class="hint">للتمييز في لوحة التحكم، مثل: شهادة حضور، إجازة متن، شهادة دورة التجويد</span><input name="name" required maxlength="60"></label>
          <div class="fgroup"><span>التصميم</span><div class="tlist"><label><input type="radio" name="design" value="tpl" checked> قالب جاهز</label><label><input type="radio" name="design" value="image"> رفع تصميمي</label></div></div>
          <p class="hint">${CERT_FORMAT_TIP}</p>`, {
          submitText: 'إنشاء ومتابعة', onSubmit: async fd => {
            const id = genId(), now = Date.now();
            await DB.set('certTypes', id, { name: fd.get('name').trim(), langs: '', design: fd.get('design'), tpl: 'classic', titleAr: '', titleEn: '', lineAr: '', lineEn: '', o: 'landscape', hasEn: false, layout: {}, v: now, createdAt: now, updatedAt: now });
            go('/certtype/' + id);
          }
        });
        $('.tcards').onclick = async e => {
          const b = e.target.closest('button'); if (!b) return; const d = b.dataset;
          if (d.def) { await DB.update('settings', 'main', { certDefault: d.def }); S.settings.certDefault = d.def; toast('أصبح النوع الافتراضي', 'ok'); route(); }
          if (d.dup) {
            const src = full.find(t => t.id === d.dup), id = genId(), now = Date.now(); b.disabled = true;
            try {
              const { id: _, bgAr, bgEn, ...rest } = src;
              for (const [l, bg] of [['ar', bgAr], ['en', bgEn]]) if (bg) await DB.set('certAssets', `${id}_${l}`, { data: bg, o: src.o || 'landscape', at: now });
              await DB.set('certTypes', id, { ...rest, name: src.name + ' (نسخة)', v: now, createdAt: now, updatedAt: now });
              toast('أُنشئت نسخة', 'ok'); route();
            } catch (err) { toast(err.message, 'err'); b.disabled = false; }
          }
          if (d.rm) {
            const t = types.find(x => x.id === d.rm), n = courses.filter(c => c.certType === t.id).length;
            if (!(await confirmBox(`حذف نوع «${esc(t.name)}»؟${n ? `<br><small class="muted">${n} دورة مرتبطة به ستعود إلى الشهادة الافتراضية.</small>` : ''}${t.id === defId ? '<br><small class="muted">هذا هو النوع الافتراضي؛ اختر افتراضياً آخر بعد الحذف.</small>' : ''}<br><small class="muted">الشهادات الصادرة لا تُحذف، وتظهر بنوع دورتها الحالي أو الافتراضي.</small>`, 'حذف'))) return;
            for (const c of courses.filter(c => c.certType === t.id)) await DB.update('courses', c.id, { certType: '' });
            await Promise.all(['ar', 'en'].map(l => DB.del('certAssets', `${t.id}_${l}`).catch(() => {})));
            await DB.del('certTypes', t.id);
            if (t.id === defId) { const nx = types.find(x => x.id !== t.id)?.id || ''; await DB.update('settings', 'main', { certDefault: nx }); S.settings.certDefault = nx; }
            toast('حُذف النوع'); route();
          }
        };
      }
    };
  }

  if (tab === 'courses') {
    return {
      ...base,
      html: `${tabs}<p class="muted" style="margin-bottom:16px">لكل دورة شهادتها: اختر نوع الشهادة لكل دورة، ويُحفظ الاختيار فوراً ويُطبَّق على شهاداتها الجديدة والصادرة. الدورة التي تُترك على «الافتراضية» تأخذ النوع الافتراضي.</p>
        ${courses.length ? `<div class="tbl-wrap"><table><thead><tr><th>الدورة</th><th>الشهادات الصادرة</th><th style="min-width:240px">نوع الشهادة</th><th></th></tr></thead><tbody>${courses.map(c => `<tr><td><strong>${esc(c.title)}</strong>${c.titleEn ? '' : '<br><small style="color:var(--warn)">بلا عنوان إنجليزي</small>'}</td><td>${certs.filter(x => x.courseId === c.id).length}</td>
          <td><select data-ct="${c.id}">${typeOpts(c.certType || '')}</select></td><td><div class="acts"><button class="icon-btn sm" data-pv="${c.id}" title="معاينة">${ic('eye', 16)}</button><a class="icon-btn sm" href="#/certtype/${c.certType || defId}" title="تعديل النوع">${ic('edit', 16)}</a></div></td></tr>`).join('')}</tbody></table></div>`
          : `<div class="empty">${ic('book', 36)}<p>لا توجد دورات بعد.</p></div>`}`,
      mount() {
        $('.admin-main').onchange = async e => {
          const s = e.target.closest('[data-ct]'); if (!s) return; const c = cm[s.dataset.ct];
          try { await DB.update('courses', c.id, { certType: s.value }); c.certType = s.value; toast(`«${c.title}»: ${s.value ? typeName(types, s.value) : 'الشهادة الافتراضية'}`, 'ok'); } catch (err) { toast(err.message, 'err'); }
        };
        $('.admin-main').onclick = async e => {
          const b = e.target.closest('[data-pv]'); if (!b) return; const c = cm[b.dataset.pv];
          const t = await resolveCertType(null, c), langs = certLangList(t), sample = { ...CERT_SAMPLE(), courseTitle: c.title, courseTitleEn: c.titleEn || c.title, instructor: c.instructor || '', instructorEn: c.instructorEn || '' };
          modal(`شهادة «${esc(c.title)}» — ${esc(t.name)}`, langs.map(l => `<div class="cert-wrap" style="width:100%;margin-bottom:14px">${certHtml(sample, l, { type: t, c })}</div>`).join(''), { wide: true, noFoot: true });
        };
      }
    };
  }

  if (tab === 'settings') {
    return {
      ...base,
      html: `${tabs}<form class="form panel" id="fcs" style="max-width:720px"><h3>الإعدادات العامة للشهادات</h3>
        <label>النوع الافتراضي <span class="hint">للدورات التي لم يُحدَّد لها نوع</span><select name="certDefault">${typeOpts(defId, false)}</select></label>
        <label>اللغة الافتراضية <span class="hint">يمكن لكل نوع أن يحدّد لغته الخاصة</span><select name="certLangs">${Object.entries(CERT_LANGS).map(([k, t]) => `<option value="${k}" ${st.certLangs === k ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        <p class="hint">التاريخ الهجري يظهر في الشهادة العربية، والطالب الذي لا اسم إنجليزياً له يُطلب منه كتابته عند فتح شهادته الإنجليزية. اسم المنصة بالإنجليزية من «الإعدادات».</p>
        <div><button class="btn btn-primary">حفظ</button></div></form>
        <div class="panel" style="max-width:720px;margin-top:20px"><h3>${ic('upload', 18)} رفع تصميم خاص</h3><p class="hint" style="font-size:.9rem">${CERT_FORMAT_TIP}</p><p class="hint" style="font-size:.9rem;margin-top:8px">يمكن التصميم ببرامج مثل Canva أو Photoshop أو Illustrator أو PowerPoint، ثم التصدير PNG أو PDF. الصور غير المطابقة لمقاس A4 تُضاف لها هوامش بيضاء تلقائياً.</p></div>`,
      mount() {
        $('#fcs').onsubmit = async e => {
          e.preventDefault(); const fd = new FormData(e.target), v = { certDefault: fd.get('certDefault') || '', certLangs: fd.get('certLangs') || 'both' };
          try { await DB.update('settings', 'main', v); Object.assign(S.settings, v); toast('حُفظت إعدادات الشهادات', 'ok'); } catch (err) { toast(err.message, 'err'); }
        };
      }
    };
  }

  certs.sort((a, b) => b.issuedAt - a.issuedAt);
  const tOf = c => typeName(types, cm[c.courseId]?.certType || c.certType || defId) || '—';
  return {
    ...base, actions: `<button class="btn btn-ghost btn-sm" id="csv">${ic('download', 16)} تصدير</button>`,
    html: `${tabs}${certs.length ? `<div class="toolbar"><select id="fco" style="max-width:320px"><option value="">كل الدورات</option>${courses.map(c => `<option value="${c.id}">${esc(c.title)}</option>`).join('')}</select><label class="searchbox grow">${ic('search', 18)}<span class="sr">بحث</span><input id="q" placeholder="ابحث بالاسم أو الرمز"></label></div><div id="tbl"></div>`
      : `<div class="empty">${ic('award', 36)}<p>تصدر الشهادات تلقائياً عند اجتياز الطلاب لاختبارات الدورات، أو تُصدرها من «نتائج الاختبارات». شكلها من «أنواع الشهادات».</p></div>`}`,
    mount() {
      if (!certs.length) return;
      let q = '';
      const list = () => certs.filter(c => (!$('#fco').value || c.courseId === $('#fco').value) && (!q || (c.name + c.id + (c.nameEn || '')).toLowerCase().includes(q)));
      const draw = () => {
        const l = list();
        $('#tbl').innerHTML = l.length ? `<div class="tbl-wrap"><table><thead><tr><th>رمز التحقق</th><th>الطالب</th><th>الدورة</th><th>النوع</th><th>الدرجة</th><th>تاريخ الإصدار</th><th></th></tr></thead><tbody>${l.map(c => `<tr><td dir="ltr" style="text-align:end"><code>${esc(c.id)}</code></td><td>${esc(c.name)}</td><td>${esc(c.courseTitle)}</td><td><small>${esc(tOf(c))}</small></td><td>${c.score != null ? c.score + '%' : '—'}</td><td>${fmtDate(c.issuedAt)}</td><td><div class="acts"><a class="icon-btn sm" href="index.html#/cert/${c.id}" target="_blank" title="عرض">${ic('eye', 16)}</a><button class="icon-btn sm" data-ed="${c.id}" title="تعديل الأسماء">${ic('edit', 16)}</button><button class="icon-btn sm danger" data-del="${c.id}" title="إلغاء الشهادة">${ic('trash', 16)}</button></div></td></tr>`).join('')}</tbody></table></div>`
          : `<div class="empty">${ic('search', 32)}<p>لا شهادات مطابقة.</p></div>`;
      };
      $('#fco').onchange = draw; $('#q').oninput = e => { q = e.target.value.trim().toLowerCase(); draw(); };
      $('#csv').onclick = () => downloadFile('certificates.csv', toCSV([['الرمز', 'الطالب', 'الدورة', 'النوع', 'الدرجة', 'التاريخ'], ...list().map(c => [c.id, c.name, c.courseTitle, tOf(c), c.score ?? '', fmtDate(c.issuedAt)])]));
      $('#tbl').onclick = async e => {
        const ed = e.target.closest('[data-ed]');
        if (ed) { const c = certs.find(x => x.id === ed.dataset.ed); modal('بيانات الشهادة', `<label>اسم الطالب<input name="name" required value="${esc(c.name)}"></label><label>الاسم بالإنجليزية<input name="nameEn" dir="ltr" value="${esc(c.nameEn)}"></label><label>عنوان الدورة بالإنجليزية<input name="courseTitleEn" dir="ltr" value="${esc(c.courseTitleEn)}"></label><label>اسم المحاضر بالإنجليزية<input name="instructorEn" dir="ltr" value="${esc(c.instructorEn)}"></label>`, { onSubmit: async fd => { const v = { name: fd.get('name').trim(), nameEn: fd.get('nameEn').trim(), courseTitleEn: fd.get('courseTitleEn').trim(), instructorEn: fd.get('instructorEn').trim() }; await DB.update('certificates', c.id, v); Object.assign(c, v); draw(); toast('حُفظت بيانات الشهادة', 'ok'); } }); return; }
        const b = e.target.closest('[data-del]'); if (!b) return;
        if (await confirmBox(`إلغاء الشهادة ${esc(b.dataset.del)}؟ لن يعود رمزها صالحاً للتحقق.`, 'إلغاء الشهادة')) { await DB.del('certificates', b.dataset.del); certs.splice(certs.findIndex(x => x.id === b.dataset.del), 1); draw(); toast('أُلغيت الشهادة'); }
      };
      draw();
    }
  };
}

/* ---------- استيراد التصميم: PNG/JPG/WEBP/SVG أو أول صفحة من PDF ← صورة JPEG بمقاس A4 تُحفظ في certAssets ---------- */
const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', PDFJS_W = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
let pdfjsReady;
async function templateSource(file) {
  if (file.size > 30e6) throw new Error('الملف كبير جداً — الحد 30 ميغابايت');
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) {
    pdfjsReady = pdfjsReady || loadScript(PDFJS).then(() => { pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_W; }).catch(e => { pdfjsReady = null; throw e; });
    await pdfjsReady;
    const doc = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise, pg = await doc.getPage(1);
    const v1 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: 2400 / Math.max(v1.width, v1.height) });
    const cv = document.createElement('canvas'); cv.width = Math.round(vp.width); cv.height = Math.round(vp.height);
    const x = cv.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, cv.width, cv.height);
    await pg.render({ canvasContext: x, viewport: vp }).promise;
    return { src: cv, w: cv.width, h: cv.height, pages: doc.numPages, kind: 'PDF' };
  }
  if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.type)) throw new Error('صيغة غير مدعومة — ارفع PNG أو JPG أو WEBP أو SVG أو PDF');
  const url = URL.createObjectURL(file), im = new Image(); im.src = url;
  try { await im.decode(); } catch { URL.revokeObjectURL(url); throw new Error('تعذّرت قراءة الصورة'); }
  let w = im.naturalWidth, h = im.naturalHeight; if (!w || !h) { w = 2000; h = 1414; }
  return { src: im, w, h, kind: file.type.split('/')[1].replace('+xml', '').toUpperCase(), done: () => URL.revokeObjectURL(url) };
}
async function prepTemplate(file, forceO) {
  const s = await templateSource(file);
  try {
    const r = s.w / s.h, o = forceO || (r >= 1 ? 'landscape' : 'portrait'), A = 297 / 210, target = o === 'landscape' ? A : 1 / A;
    const fitted = Math.abs(r - target) / target > .02;
    const enc = (L, q) => {
      const W = o === 'landscape' ? L : Math.round(L / A), H = o === 'landscape' ? Math.round(L / A) : L;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.imageSmoothingQuality = 'high';
      if (!fitted) x.drawImage(s.src, 0, 0, W, H);
      else { const k = Math.min(W / s.w, H / s.h), dw = s.w * k, dh = s.h * k; x.drawImage(s.src, (W - dw) / 2, (H - dh) / 2, dw, dh); }
      return cv.toDataURL('image/jpeg', q);
    };
    let data = '';
    for (const L of [2000, 1700, 1400]) { for (const q of [.86, .78, .7, .62]) { data = enc(L, q); if (data.length < 880000) break; } if (data.length < 880000) break; }
    if (data.length >= 880000) throw new Error('التصميم مليء بالتفاصيل ولم يمكن ضغطه — صدّره بجودة أقل وأعد المحاولة');
    return { data, o, fitted, w: s.w, h: s.h, pages: s.pages || 1, kind: s.kind, kb: Math.round(data.length * .75 / 1024) };
  } finally { s.done?.(); }
}

/* ---------- محرر نوع الشهادة ---------- */
async function adminCertType(id) {
  const t = await loadCertType(id);
  if (!t) return { active: 'certs', title: 'غير موجود', html: `<div class="empty">نوع الشهادة غير موجود. <a href="#/certs/types" style="color:var(--teal)">العودة</a></div>` };
  const lay = certLayout(t.layout), pend = {}; let rmEn = false, sel = 'name', pl = certLangList(t)[0], dirty = false;
  const sample = CERT_SAMPLE();
  const f = () => $('#ft'), val = n => f().elements[n]?.value ?? '';
  const design = () => f().querySelector('[name=design]:checked')?.value || 'tpl';
  const cur = () => ({
    ...t, design: design(), tpl: f().querySelector('[name=tpl]:checked')?.value || t.tpl || 'classic', langs: val('langs'),
    titleAr: val('titleAr'), titleEn: val('titleEn'), lineAr: val('lineAr'), lineEn: val('lineEn'), layout: lay,
    o: pend.ar?.o || t.o || 'landscape', bgAr: pend.ar?.data ?? t.bgAr ?? '', bgEn: rmEn ? '' : pend.en?.data ?? t.bgEn ?? ''
  });
  const upBox = (l, title, note) => { const has = l === 'ar' ? (pend.ar || t.bgAr) : !rmEn && (pend.en || t.bgEn); return `<div class="ced-up ${has ? 'has' : ''}" data-box="${l}"><strong>${title}</strong><span class="hint">${note}</span>
    <div class="hero-cta" style="margin:0;gap:6px"><label class="btn btn-ghost btn-sm">${ic('upload', 15)} ${has ? 'استبدال' : 'رفع ملف'}<input type="file" hidden data-up="${l}" accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf,.pdf"></label>${l === 'en' && has ? `<button type="button" class="btn btn-ghost btn-sm danger-t" data-rmen>${ic('trash', 15)} إزالة</button>` : ''}</div><span class="hint" id="st_${l}">${pend[l]?.msg || ''}</span></div>`; };
  return {
    active: 'certs', title: 'نوع الشهادة: ' + esc(t.name),
    actions: `<a class="btn btn-ghost btn-sm" href="#/certs/types">${ic('prev', 16)} الأنواع</a><button class="btn btn-primary btn-sm" form="ft">${ic('check', 16)} حفظ</button>`,
    html: `<div class="ced"><div class="ced-stage">
        <div class="toolbar"><div class="seg" id="pl">${['ar', 'en'].map(l => `<button type="button" data-l="${l}" class="${pl === l ? 'on' : ''}">${l === 'ar' ? 'العربية' : 'English'}</button>`).join('')}</div><span class="grow"></span><span class="hint" id="dragTip">اسحب أي عنصر لتحريكه، وحرّكه بدقة بالأسهم (Shift للخطوة الكبيرة)</span></div>
        <div class="cert-wrap" id="cprev" style="position:relative"></div></div>
      <form class="form panel ced-side" id="ft" novalidate>
        <label>اسم النوع<input name="name" required maxlength="60" value="${esc(t.name)}"></label>
        <label>لغة الشهادة<select name="langs"><option value="">حسب الإعداد العام (${esc(CERT_LANGS[S.settings.certLangs] || '')})</option>${Object.entries(CERT_LANGS).map(([k, x]) => `<option value="${k}" ${t.langs === k ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
        <div class="fgroup"><span>التصميم</span><div class="tlist"><label><input type="radio" name="design" value="tpl" ${t.design !== 'image' ? 'checked' : ''}> قالب جاهز</label><label><input type="radio" name="design" value="image" ${t.design === 'image' ? 'checked' : ''}> تصميمي الخاص</label></div></div>
        <div data-d="tpl" class="ced-side">
          <div class="tlist">${Object.entries(CERT_TPLS).map(([k, x]) => `<label title="${esc(x.desc)}"><input type="radio" name="tpl" value="${k}" ${(t.tpl || 'classic') === k ? 'checked' : ''}> ${x.name}</label>`).join('')}</div>
          <label>عنوان الشهادة <span class="hint">فارغ = «شهادة إتمام»</span><input name="titleAr" maxlength="40" value="${esc(t.titleAr)}" placeholder="شهادة إتمام"></label>
          <label>العنوان بالإنجليزية<input name="titleEn" dir="ltr" maxlength="50" value="${esc(t.titleEn)}" placeholder="Certificate of Completion"></label>
          <label>العبارة قبل اسم الدورة<input name="lineAr" maxlength="80" value="${esc(t.lineAr)}" placeholder="قد أتمّ بحمد الله وتوفيقه دورة"></label>
          <label>العبارة بالإنجليزية<input name="lineEn" dir="ltr" maxlength="80" value="${esc(t.lineEn)}" placeholder="has successfully completed the course"></label>
        </div>
        <div data-d="image" class="ced-side">
          ${upBox('ar', 'التصميم الأساسي', 'يُستعمل للشهادتين إن لم ترفع تصميماً إنجليزياً.')}
          ${upBox('en', 'تصميم الشهادة الإنجليزية <small class="muted">(اختياري)</small>', 'بنفس اتجاه التصميم الأساسي، وتُستعمل له نفس مواضع البيانات.')}
          <p class="hint">${CERT_FORMAT_TIP}</p>
          <h4>البيانات على الشهادة</h4>
          <div class="flist" id="fl"></div>
          <div class="fctl" id="fc"></div>
          <div class="hero-cta" style="margin:0;gap:6px"><button type="button" class="btn btn-ghost btn-sm" id="resetL">إعادة المواضع الافتراضية</button></div>
        </div>
        <div><button class="btn btn-primary btn-block">حفظ نوع الشهادة</button></div>
      </form></div>`,
    mount() {
      const box = $('#cprev');
      const draw = () => {
        const T = cur();
        box.innerHTML = certHtml({ ...sample, certType: id }, pl, { type: T }) + '<i class="ced-g v"></i><i class="ced-g h"></i>';
        $$('.cf', box).forEach(el => el.classList.toggle('sel', el.dataset.f === sel));
        $('#dragTip').hidden = T.design !== 'image';
      };
      const fieldsList = () => {
        $('#fl').innerHTML = Object.entries(CERT_FIELDS).map(([k, d]) => `<div class="fi ${k === sel ? 'on' : ''}" data-k="${k}"><input type="checkbox" data-show="${k}" ${lay[k].show ? 'checked' : ''} aria-label="إظهار ${d.lbl}"><span>${d.lbl}</span>${k === 'hijri' ? '<small class="muted">عربي فقط</small>' : ''}</div>`).join('');
      };
      const ctl = () => {
        const L = lay[sel], d = CERT_FIELDS[sel], qr = sel === 'qr';
        $('#fc').innerHTML = `<strong>${d.lbl}</strong>
          <label>${qr ? 'العرض' : 'حجم الخط'} <span class="hint" id="szv">${L.size}</span><input type="range" data-p="size" min="${qr ? 3 : .6}" max="${qr ? 20 : 8}" step="${qr ? .2 : .05}" value="${L.size}"></label>
          ${qr ? '' : `<label>أقصى عرض للسطر <span class="hint" id="wv">${L.w}%</span><input type="range" data-p="w" min="10" max="100" step="1" value="${L.w}"></label>
          <div class="row"><label>الخط<select data-p="font">${Object.entries(CERT_FONTS).map(([k, [n]]) => `<option value="${k}" ${L.font === k ? 'selected' : ''}>${n}</option>`).join('')}</select></label><label>اللون<input type="color" data-p="color" value="${hexIn(L.color, '#1D2A28')}"></label></div>
          <label class="check"><input type="checkbox" data-p="bold" ${L.bold ? 'checked' : ''}> خط عريض</label>`}
          <div class="row"><label>أفقي %<input type="number" data-p="x" min="0" max="100" step=".1" value="${L.x}"></label><label>عمودي %<input type="number" data-p="y" min="0" max="100" step=".1" value="${L.y}"></label></div>
          <button type="button" class="btn btn-ghost btn-sm" id="ctrX">توسيط أفقي</button>`;
      };
      const pick = k => { sel = k; fieldsList(); ctl(); $$('.cf', box).forEach(el => el.classList.toggle('sel', el.dataset.f === sel)); };
      const vis = () => { const d = design(); $$('[data-d]', f()).forEach(el => el.hidden = el.dataset.d !== d); };
      const mark = () => { dirty = true; };
      vis(); fieldsList(); ctl(); draw();

      $$('#pl button').forEach(b => b.onclick = () => { pl = b.dataset.l; $$('#pl button').forEach(x => x.classList.toggle('on', x === b)); draw(); });
      f().addEventListener('input', e => {
        const p = e.target.dataset.p;
        if (p) { const L = lay[sel]; L[p] = p === 'bold' ? (e.target.checked ? 1 : 0) : p === 'font' || p === 'color' ? e.target.value : +e.target.value; if ($('#szv')) $('#szv').textContent = L.size; if ($('#wv')) $('#wv').textContent = L.w + '%'; mark(); draw(); return; }
        if (e.target.dataset.show) { lay[e.target.dataset.show].show = e.target.checked ? 1 : 0; mark(); draw(); return; }
        if (e.target.type !== 'file') { mark(); if (e.target.name === 'design') vis(); draw(); }
      });
      f().addEventListener('change', e => { if (e.target.name === 'design' || e.target.name === 'tpl' || e.target.name === 'langs') { vis(); draw(); } });
      f().addEventListener('click', async e => {
        const fi = e.target.closest('.fi'); if (fi && !e.target.dataset.show) { pick(fi.dataset.k); return; }
        if (e.target.closest('#ctrX')) { lay[sel].x = 50; mark(); ctl(); draw(); }
        if (e.target.closest('#resetL') && await confirmBox('إعادة كل البيانات إلى مواضعها ومقاساتها الافتراضية؟', 'إعادة')) { Object.assign(lay, certLayout({})); mark(); fieldsList(); ctl(); draw(); }
        if (e.target.closest('[data-rmen]')) { rmEn = true; delete pend.en; mark(); $('[data-box="en"]').outerHTML = upBox('en', 'تصميم الشهادة الإنجليزية <small class="muted">(اختياري)</small>', 'بنفس اتجاه التصميم الأساسي، وتُستعمل له نفس مواضع البيانات.'); draw(); }
      });
      f().addEventListener('change', async e => {
        const l = e.target.dataset.up; if (!l) return; const file = e.target.files[0]; if (!file) return;
        const st = $('#st_' + l); st.className = 'hint'; st.textContent = 'جارٍ تجهيز التصميم…';
        try {
          const forceO = l === 'en' ? (pend.ar?.o || t.o) : null;
          const r = await prepTemplate(file, (l === 'en' && (pend.ar || t.bgAr)) ? forceO : null);
          r.msg = `${r.fitted ? '⚠ مقاسه ' + r.w + '×' + r.h + ' لا يطابق A4، فأُضيفت هوامش بيضاء. الأفضل ' + (r.o === 'landscape' ? '3508×2480' : '2480×3508') + '.' : '✓ ' + r.kind + ' ' + r.w + '×' + r.h + ' — A4 ' + (r.o === 'landscape' ? 'أفقي' : 'عمودي') + '.'}${r.pages > 1 ? ' استُعملت الصفحة الأولى من ' + r.pages + '.' : ''} (${r.kb} ك.ب)`;
          pend[l] = r; if (l === 'en') rmEn = false; mark();
          if (l === 'ar' && t.bgEn && !rmEn && (t.o || 'landscape') !== r.o) toast('اتجاه التصميم الأساسي تغيّر؛ أعد رفع التصميم الإنجليزي بنفس الاتجاه', 'err');
          const title = l === 'ar' ? 'التصميم الأساسي' : 'تصميم الشهادة الإنجليزية <small class="muted">(اختياري)</small>', note = l === 'ar' ? 'يُستعمل للشهادتين إن لم ترفع تصميماً إنجليزياً.' : 'بنفس اتجاه التصميم الأساسي، وتُستعمل له نفس مواضع البيانات.';
          $(`[data-box="${l}"]`).outerHTML = upBox(l, title, note);
          $('#st_' + l).className = 'hint ' + (r.fitted ? 'stat-warn' : 'stat-ok');
          if (l === 'en') { pl = 'en'; $$('#pl button').forEach(x => x.classList.toggle('on', x.dataset.l === 'en')); }
          draw();
        } catch (err) { console.error(err); st.className = 'hint stat-warn'; st.textContent = '✗ ' + (err.message || 'تعذّر قراءة الملف'); e.target.value = ''; }
      });

      /* السحب بالمؤشر (فأرة أو لمس) */
      box.addEventListener('pointerdown', e => {
        const el = e.target.closest('.cf'); if (!el || design() !== 'image') return;
        e.preventDefault(); pick(el.dataset.f);
        const cert = $('.cert', box), r = cert.getBoundingClientRect(), L = lay[sel], sx = e.clientX, sy = e.clientY, ox = L.x, oy = L.y;
        const gv = $('.ced-g.v', box), gh = $('.ced-g.h', box);
        el.setPointerCapture(e.pointerId); el.classList.add('drag');
        el.onpointermove = ev => {
          let x = Math.min(100, Math.max(0, ox + (ev.clientX - sx) / r.width * 100)), y = Math.min(100, Math.max(0, oy + (ev.clientY - sy) / r.height * 100));
          const sxn = Math.abs(x - 50) < 1.2, syn = Math.abs(y - 50) < 1.2; if (sxn) x = 50; if (syn) y = 50;
          gv.classList.toggle('on', sxn); gh.classList.toggle('on', syn);
          L.x = Math.round(x * 10) / 10; L.y = Math.round(y * 10) / 10; el.style.left = L.x + '%'; el.style.top = L.y + '%';
        };
        el.onpointerup = el.onpointercancel = () => { el.onpointermove = el.onpointerup = el.onpointercancel = null; el.classList.remove('drag'); gv.classList.remove('on'); gh.classList.remove('on'); if (L.x !== ox || L.y !== oy) mark(); ctl(); };
      });
      const onKey = e => {
        if (design() !== 'image' || !/^Arrow/.test(e.key) || e.target.closest('input,select,textarea')) return;
        e.preventDefault(); const L = lay[sel], k = e.shiftKey ? 1 : .2;
        if (e.key === 'ArrowLeft') L.x -= k; if (e.key === 'ArrowRight') L.x += k; if (e.key === 'ArrowUp') L.y -= k; if (e.key === 'ArrowDown') L.y += k;
        L.x = Math.round(Math.min(100, Math.max(0, L.x)) * 10) / 10; L.y = Math.round(Math.min(100, Math.max(0, L.y)) * 10) / 10; mark(); ctl(); draw();
      };
      const onLeave = e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
      document.addEventListener('keydown', onKey); addEventListener('beforeunload', onLeave);
      S.cleanups.push(() => { document.removeEventListener('keydown', onKey); removeEventListener('beforeunload', onLeave); });

      f().onsubmit = async e => {
        e.preventDefault(); if (!f().checkValidity()) { f().reportValidity(); return; }
        const T = cur();
        if (T.design === 'image' && !T.bgAr) { toast('ارفع التصميم الأساسي للشهادة أولاً', 'err'); return; }
        const btns = $$('button[form=ft], #ft > div > .btn-primary'); btns.forEach(b => b.disabled = true);
        try {
          const now = Date.now(), lout = {};
          for (const [k, L] of Object.entries(lay)) lout[k] = { x: +L.x, y: +L.y, size: +L.size, w: +L.w || 0, font: L.font || '', color: L.color || '', bold: L.bold ? 1 : 0, show: L.show ? 1 : 0 };
          if (pend.ar) await DB.set('certAssets', id + '_ar', { data: pend.ar.data, o: pend.ar.o, at: now });
          if (pend.en) await DB.set('certAssets', id + '_en', { data: pend.en.data, o: pend.en.o, at: now });
          const hasEn = !!(pend.en || (t.hasEn && !rmEn));
          if (rmEn && t.hasEn) await DB.del('certAssets', id + '_en').catch(() => {});
          const doc = { name: val('name').trim(), langs: T.langs, design: T.design, tpl: T.tpl, titleAr: T.titleAr.trim(), titleEn: T.titleEn.trim(), lineAr: T.lineAr.trim(), lineEn: T.lineEn.trim(), o: T.o, hasEn, layout: lout, v: now, createdAt: t.createdAt || now, updatedAt: now };
          await DB.set('certTypes', id, doc);
          Object.assign(t, doc, { bgAr: T.bgAr, bgEn: hasEn ? T.bgEn : '' }); delete pend.ar; delete pend.en; rmEn = false; dirty = false;
          $('.admin-top h1').textContent = 'نوع الشهادة: ' + doc.name; toast('حُفظ نوع الشهادة', 'ok');
        } catch (err) { console.error(err); toast(/size|exceed|maximum/i.test(err.message) ? 'حجم التصميم أكبر من المسموح — صدّره بجودة أقل' : err.message, 'err'); }
        btns.forEach(b => b.disabled = false);
      };
    }
  };
}

const MSG_ST = { new: ['جديدة', 'no'], read: ['مقروءة', 'mut'], done: ['تمّ الرد', 'ok'] };
const setUnread = n => { S.unread = n; const b = $('#unread'); if (b) { b.textContent = n; b.hidden = !n; } };
async function adminMessages() {
  const msgs = (await DB.list('messages')).sort((a, b) => b.at - a.at);
  return {
    active: 'messages', title: 'الرسائل', actions: `<button class="btn btn-ghost btn-sm" id="csv">${ic('download', 16)} تصدير</button>`,
    html: `<div class="toolbar"><div class="seg" id="mf"><button type="button" data-f="new" class="on">الجديدة</button><button type="button" data-f="open">بانتظار الرد</button><button type="button" data-f="">الكل</button></div>
      <label class="searchbox grow">${ic('search', 18)}<span class="sr">بحث</span><input id="q" placeholder="ابحث بالاسم أو الموضوع أو النص"></label></div><div id="list"></div>`,
    mount() {
      let f = msgs.some(m => m.status === 'new') ? 'new' : '', q = '';
      $$('#mf button').forEach(b => b.classList.toggle('on', b.dataset.f === f));
      const vis = () => msgs.filter(m => (f === 'new' ? m.status === 'new' : f === 'open' ? m.status !== 'done' : true) && (!q || (m.name + m.topic + m.body + m.reply).toLowerCase().includes(q)));
      const draw = () => {
        const l = vis(); setUnread(msgs.filter(m => m.status === 'new').length);
        $('#list').innerHTML = l.length ? `<div class="rowlist">${l.map(m => `<button class="ritem msg ${m.status === 'new' ? 'unread' : ''}" data-id="${m.id}">
            <span class="tick">${ic(m.status === 'done' ? 'check' : 'mail', 14)}</span>
            <div class="grow"><strong>${esc(m.name)}</strong> <span class="pill mut">${esc(m.topic || 'عام')}</span><br><small>${esc(trim(m.body, 110))}</small></div>
            <div style="text-align:end;flex:none"><span class="pill ${MSG_ST[m.status]?.[1] || 'mut'}">${MSG_ST[m.status]?.[0] || ''}</span><br><small>${fmtDT(m.at)}</small></div></button>`).join('')}</div>`
          : `<div class="empty">${ic('inbox', 36)}<p>${q ? 'لا رسائل مطابقة.' : f === 'new' ? 'لا رسائل جديدة. تصل هنا رسائل نموذج «تواصل معنا».' : 'لا توجد رسائل.'}</p></div>`;
      };
      const setSt = async (m, st) => { await DB.update('messages', m.id, { status: st }); m.status = st; draw(); };
      $$('#mf button').forEach(b => b.onclick = () => { f = b.dataset.f; $$('#mf button').forEach(x => x.classList.toggle('on', x === b)); draw(); });
      $('#q').oninput = e => { q = e.target.value.trim().toLowerCase(); draw(); };
      $('#csv').onclick = () => downloadFile('messages.csv', toCSV([['الاسم', 'للرد', 'الموضوع', 'الرسالة', 'الحالة', 'الوقت'], ...vis().map(m => [m.name, m.reply, m.topic, m.body, MSG_ST[m.status]?.[0], fmtDT(m.at)])]));
      $('#list').onclick = async e => {
        const b = e.target.closest('[data-id]'); if (!b) return; const m = msgs.find(x => x.id === b.dataset.id);
        if (m.status === 'new') setSt(m, 'read').catch(() => {});
        const isMail = /@/.test(m.reply), wa = waNum(m.reply);
        const greet = `السلام عليكم ${firstName(m.name)}، بخصوص رسالتك إلى ${S.settings.name} (${m.topic || 'استفسار'}):\n`;
        const close = modal(esc(m.topic || 'رسالة'), `<p class="muted" style="margin-top:-8px">${esc(m.name)} — ${fmtDT(m.at)}${m.uid ? ' — طالب مسجّل' : ''}</p>
          <div class="msg-body">${esc(m.body)}</div>
          <p style="margin-top:12px"><strong>للرد:</strong> <bdi dir="ltr">${esc(m.reply)}</bdi></p>
          <div class="hero-cta" style="margin-top:12px">${isMail ? `<a class="btn btn-primary btn-sm" href="mailto:${esc(m.reply)}?subject=${encodeURIComponent('رد: ' + (m.topic || S.settings.name))}&body=${encodeURIComponent(greet)}">${ic('mail', 16)} رد بالبريد</a>` : ''}${!isMail && wa.length >= 7 ? `<a class="btn btn-primary btn-sm" href="${waLink(wa, greet)}" target="_blank" rel="noopener">${ic('whatsapp', 16)} رد عبر واتساب</a>` : ''}
            ${m.status !== 'done' ? `<button type="button" class="btn btn-ghost btn-sm" data-done>${ic('check', 16)} تمّ الرد</button>` : `<button type="button" class="btn btn-ghost btn-sm" data-reopen>إعادة فتح</button>`}
            <button type="button" class="btn btn-ghost btn-sm danger-t" data-rm>${ic('trash', 16)} حذف</button></div>`, { wide: true, noFoot: true });
        const bx = $('.modal-bg .modal');
        $('[data-done]', bx) && ($('[data-done]', bx).onclick = async () => { await setSt(m, 'done'); close(); toast('عُلّمت الرسالة: تمّ الرد', 'ok'); });
        $('[data-reopen]', bx) && ($('[data-reopen]', bx).onclick = async () => { await setSt(m, 'read'); close(); });
        $('[data-rm]', bx).onclick = async () => { close(); if (await confirmBox('حذف هذه الرسالة نهائياً؟', 'حذف')) { await DB.del('messages', m.id); msgs.splice(msgs.indexOf(m), 1); draw(); toast('حُذفت الرسالة'); } };
      };
      draw();
    }
  };
}

const RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function signedIn() { return request.auth != null; }
    function isAdmin() { return signedIn() && exists(/databases/$(db)/documents/admins/$(request.auth.uid)); }
    function own(d) { return signedIn() && d.uid == request.auth.uid; }
    // قراءة مستند الطالب نفسه (resource == null يسمح بالسؤال عن مستند غير موجود)
    function ownRead() { return isAdmin() || resource == null || own(resource.data); }
    // نافذة زمنية بصيغة الدورة: enrollMode (open | window | closed) و enrollStart و enrollEnd
    function inWindow(w, def) {
      let m = w.get('enrollMode', def);
      let t = request.time.toMillis();
      return m == 'open' || (m == 'window' && t >= w.get('enrollStart', 0) && (w.get('enrollEnd', 0) == 0 || t <= w.get('enrollEnd', 0)));
    }
    function recPath(p) { return /databases/$(db)/documents/records/$(request.auth.uid + '_' + p); }
    function activeRec(p) { return exists(recPath(p)) && get(recPath(p)).data.status == 'active'; }

    match /settings/{id}     { allow read: if true; allow write: if isAdmin(); }
    match /courses/{id}      { allow read: if true; allow write: if isAdmin(); }
    match /certificates/{id} {
      allow read: if true; allow create: if isAdmin() || own(request.resource.data); allow delete: if isAdmin();
      allow update: if isAdmin() || (own(resource.data) && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['nameEn']));
    }
    // أنواع الشهادات وتصاميمها المرفوعة: يقرؤها الجميع لعرض الشهادة، ويعدّلها المشرف
    match /certTypes/{id}    { allow read: if true; allow write: if isAdmin(); }
    match /certAssets/{id}   { allow read: if true; allow write: if isAdmin(); }
    // روابط اللقاءات المباشرة (Zoom / Meet / Teams): يقرؤها المشرف والطالب المسجّل في الدورة فقط
    match /courseLive/{cid}  {
      allow read: if isAdmin() || (signedIn() && exists(/databases/$(db)/documents/enrollments/$(request.auth.uid + '_' + cid)));
      allow write: if isAdmin();
    }
    match /admins/{uid}      { allow read: if signedIn() && request.auth.uid == uid; allow write: if false; }
    match /users/{uid} {
      allow read: if isAdmin() || (signedIn() && request.auth.uid == uid);
      allow create: if isAdmin() || (signedIn() && request.auth.uid == uid && request.resource.data.disabled == false);
      allow update: if isAdmin() || (signedIn() && request.auth.uid == uid && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['disabled','username']));
      allow delete: if isAdmin();
    }

    // ===== القبول والقيد =====
    // طلب الالتحاق {uid}_{program}: الطالب يرسله خلال فترة القبول، ويعدّله أو يسحبه قبل القرار، ويستكمله إذا طُلب منه. القرار للمشرف.
    function appKeys() { return ['uid','program','track','userName','username','name','nameEn','birthDate','gender','nationality','country','city','phone','email','qual','qualSpec','qualYear','qualFrom','arabic','quranAmt','priorIjaza','motivation','heard','pledge','hasFile','status','submittedAt','updatedAt']; }
    function admOpen(p) { return inWindow(get(/databases/$(db)/documents/settings/main).data.get('adm', {}).get(p, {}), 'open'); }
    match /applications/{id} {
      allow read: if ownRead();
      allow create: if isAdmin() || (own(request.resource.data) && id == request.auth.uid + '_' + request.resource.data.program
        && request.resource.data.program in ['academy', 'ijaza'] && request.resource.data.status == 'submitted'
        && request.resource.data.keys().hasOnly(appKeys()) && admOpen(request.resource.data.program));
      allow update: if isAdmin() || (own(resource.data) && own(request.resource.data)
        && request.resource.data.program == resource.data.program
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(appKeys())
        && ((resource.data.status in ['submitted', 'incomplete'] && request.resource.data.status in ['submitted', 'withdrawn'])
          || (resource.data.status == 'withdrawn' && request.resource.data.status == 'submitted' && admOpen(resource.data.program))));
      allow delete: if isAdmin();
    }
    // صورة المؤهل المرفقة بالطلب (JPEG مضغوطة بصيغة dataURL)
    match /appFiles/{id} {
      allow read: if ownRead();
      allow create, update: if isAdmin() || (own(request.resource.data) && id == request.auth.uid + '_' + request.resource.data.program
        && request.resource.data.keys().hasOnly(['uid','program','data','name','at']) && request.resource.data.data is string && request.resource.data.data.size() < 1000000);
      allow delete: if isAdmin();
    }
    // القيد في البرنامج بعد القبول (الرقم الجامعي، المستوى، المسار، الحالة): يكتبه المشرف فقط
    match /records/{id}  { allow read: if ownRead(); allow write: if isAdmin(); }
    match /counters/{id} { allow read, write: if isAdmin(); }
    // الفصول الدراسية: يقرؤها الجميع، ويكتبها المشرف
    match /terms/{id}    { allow read: if true; allow write: if isAdmin(); }
    // تسجيل الطالب في فصل {uid}_{termId}: بنفسه حين يكون تسجيل الفصل مفتوحاً، وبمستواه الحالي في قيده المنتظم
    match /regs/{id} {
      allow read: if ownRead();
      allow create: if isAdmin() || (own(request.resource.data) && id == request.auth.uid + '_' + request.resource.data.termId
        && request.resource.data.program == 'academy'
        && inWindow(get(/databases/$(db)/documents/terms/$(request.resource.data.termId)).data, 'closed')
        && activeRec('academy') && get(recPath('academy')).data.level == request.resource.data.level);
      allow update, delete: if isAdmin();
    }

    // التسجيل الذاتي في دورة: الدورات العامة حسب نافذة تسجيلها (enrollMode / enrollStart / enrollEnd)،
    // ومواد البرنامجين لمن قيده منتظم: الأكاديمي بمطابقة الفصل term لمستواه، والإجازات بمطابقة المسار ijazaKey
    function enrollOpen(cid) {
      let c = get(/databases/$(db)/documents/courses/$(cid)).data;
      let p = c.get('program', '');
      return (p == '' && inWindow(c, 'open'))
        || (p == 'academy' && activeRec(p) && get(recPath(p)).data.level == c.get('term', 0))
        || (p == 'ijaza' && activeRec(p) && get(recPath(p)).data.get('track', '') == c.get('ijazaKey', ''));
    }
    match /enrollments/{id} {
      allow read: if isAdmin() || resource == null || own(resource.data);
      allow create: if isAdmin() || (own(request.resource.data) && id == request.auth.uid + '_' + request.resource.data.courseId && enrollOpen(request.resource.data.courseId));
      allow update: if isAdmin() || (own(resource.data) && own(request.resource.data) && request.resource.data.courseId == resource.data.courseId);
      allow delete: if isAdmin();
    }
    // رسائل «تواصل معنا»: يرسلها أي زائر، ويقرؤها المشرف فقط
    match /messages/{id} {
      allow create: if request.resource.data.keys().hasOnly(['name','reply','topic','body','at','uid','status'])
        && request.resource.data.name is string && request.resource.data.name.size() >= 2 && request.resource.data.name.size() <= 80
        && request.resource.data.reply is string && request.resource.data.reply.size() >= 5 && request.resource.data.reply.size() <= 120
        && request.resource.data.body is string && request.resource.data.body.size() >= 5 && request.resource.data.body.size() <= 3000
        && request.resource.data.status == 'new'
        && (request.resource.data.uid == '' || (signedIn() && request.resource.data.uid == request.auth.uid));
      allow read, update, delete: if isAdmin();
    }
    match /attempts/{id} {
      allow read: if isAdmin() || own(resource.data);
      allow create: if own(request.resource.data);
      allow update, delete: if isAdmin();
    }
  }
}`;

async function adminSettings() {
  const st = S.settings;
  return {
    active: 'settings', title: 'الإعدادات',
    html: `<div class="cols">
      <form class="form panel" id="fs"><h3>المنصة</h3>
        <label>اسم المنصة<input name="name" required value="${esc(st.name)}"></label>
        <label>الاسم بالإنجليزية <span class="hint">يظهر في الشهادة</span><input name="nameEn" dir="ltr" value="${esc(st.nameEn)}"></label>
        <label>الشعار النصي<input name="tagline" value="${esc(st.tagline)}"></label>
        <label>نص الواجهة<textarea name="heroText" rows="3">${esc(st.heroText)}</textarea></label>
        <label>نبذة عن المنصة<textarea name="about" rows="3">${esc(st.about)}</textarea></label>
        <label class="check"><input type="checkbox" name="allowRegister" ${st.allowRegister ? 'checked' : ''}> السماح للزوّار بإنشاء حسابات بأنفسهم</label>
        <div><button class="btn btn-primary">حفظ الإعدادات</button></div></form>
      <div style="display:grid;gap:20px;align-content:start">
        ${!S.live ? `<form class="form panel" id="fa"><h3>دخول المشرف</h3><p class="hint">في الوضع التجريبي فقط. بعد الربط بـ Firebase يدخل المشرف ببريده.</p>
          <label>اسم المستخدم<input name="u" required dir="ltr" value="${esc(st.adminUser || 'admin')}"></label>
          <label>كلمة مرور جديدة<input name="p" type="password" required minlength="6" dir="ltr" autocomplete="new-password"></label>
          <div><button class="btn btn-primary">تغيير بيانات الدخول</button></div></form>` : ''}
        <div class="panel"><h3>البيانات</h3><p class="muted" style="margin-bottom:14px">${S.live ? 'البيانات محفوظة في Firebase وتظهر لكل الأجهزة.' : 'البيانات الآن محفوظة في هذا المتصفح فقط، ولن يراها الطلاب على أجهزتهم حتى تربط Firebase.'}</p>
          <div class="hero-cta" style="margin:0"><button class="btn btn-ghost btn-sm" id="seed">${ic('plus', 16)} إضافة دورات تجريبية</button><button class="btn btn-ghost btn-sm" id="exp">${ic('download', 16)} نسخة احتياطية</button>${!S.live ? `<label class="btn btn-ghost btn-sm">${ic('upload', 16)} استعادة نسخة<input type="file" id="imp" accept=".json" hidden></label>` : ''}</div></div>
      </div></div>
      <form class="panel form" id="fp" style="margin-top:20px"><div class="toolbar" style="margin:0"><h3 class="grow">الصفحات والتواصل</h3><a class="btn btn-ghost btn-sm" href="index.html#/contact" target="_blank">${ic('eye', 16)} معاينة</a><button class="btn btn-primary btn-sm">حفظ</button></div>
        <div class="row"><label>${ic('whatsapp', 15)} رقم واتساب <span class="hint">بالصيغة الدولية، مثل 9665xxxxxxxx</span><input name="whatsapp" dir="ltr" inputmode="tel" value="${esc(st.whatsapp || (!st.email && /^[+\d\s-]{7,}$/.test(st.contact || '') ? st.contact : ''))}"></label>
        <label>${ic('mail', 15)} البريد الإلكتروني<input name="email" type="email" dir="ltr" value="${esc(st.email || (/@/.test(st.contact || '') ? st.contact : ''))}"></label></div>
        <div class="row">${SOCIALS.map(([k, t]) => `<label>${ic(k, 15)} ${t}<input name="so_${k}" type="url" dir="ltr" placeholder="https://" value="${esc((st.social || {})[k])}"></label>`).join('')}</div>
        <label class="check"><input type="checkbox" name="allowMessages" ${st.allowMessages !== false ? 'checked' : ''}> إظهار نموذج «أرسل رسالة» في صفحة التواصل (تصل الرسائل إلى قسم «الرسائل»)</label>
        <label>صفحة «عن المنصة» <span class="hint">افصل الفقرات بسطر فارغ. ## عنوان، - عنصر قائمة، 1. عنصر مرقّم، {name} اسم المنصة. إن تركته فارغاً تُعرض النبذة المختصرة.</span><textarea name="aboutLong" rows="9">${esc(st.aboutLong)}</textarea></label>
        <label>شروط الاستخدام وسياسة الخصوصية <span class="hint">بنفس التنسيق. يظهر رابطها في التذييل حين تكتبها.</span><textarea name="terms" rows="7">${esc(st.terms)}</textarea></label>
      </form>
      <form class="panel form" id="fac" style="margin-top:20px"><div class="toolbar" style="margin:0"><h3 class="grow">الأكاديمية والبرامج</h3><a class="btn btn-ghost btn-sm" href="index.html#/programs" target="_blank">${ic('eye', 16)} معاينة</a><button class="btn btn-primary btn-sm">حفظ</button></div>
        <p class="hint">تظهر في صفحة «البرامج الدراسية» والرئيسية. جدول المواد يُبنى من الدورات المصنّفة «البرنامج الأكاديمي» (من محرر الدورة أو زر «استيراد الخطة الدراسية» في قسم الدورات).</p>
        <label>الاعتماد <span class="hint">سطر يظهر تحت عنوان صفحة البرامج</span><input name="accredit" value="${esc(st.accredit)}"></label>
        <div class="row"><label>البرنامج الأكاديمي — نبذة<textarea name="acadIntro" rows="3">${esc(st.acadIntro)}</textarea></label><label>البرنامج الأكاديمي — شرط القبول<textarea name="acadAdmission" rows="3">${esc(st.acadAdmission)}</textarea></label></div>
        <div class="row"><label>برنامج الإجازات — نبذة <span class="hint">مواد البرنامج (القرآن، الحديث) تُعدّل من قسم الدورات</span><textarea name="ijazaIntro" rows="3">${esc(st.ijazaIntro)}</textarea></label><label>برنامج الإجازات — شرط القبول<textarea name="ijazaAdmission" rows="3">${esc(st.ijazaAdmission)}</textarea></label></div>
      </form>
      <div class="panel" style="margin-top:20px;display:flex;gap:14px;align-items:center;flex-wrap:wrap">${ic('award', 22)}<p class="grow" style="margin:0">قوالب الشهادات ولغتها وأنواعها، ورفع تصميمك الخاص، وشهادة كل دورة — كلها في قسم <b>الشهادات</b>.</p><a class="btn btn-ghost btn-sm" href="#/certs/types">فتح أنواع الشهادات</a></div>
      <div class="panel guide" style="margin-top:20px"><h3>دليل الربط بـ Firebase والرفع على Netlify</h3>
        <ol>
          <li>افتح <a href="https://console.firebase.google.com" target="_blank" rel="noopener" style="color:var(--teal)">console.firebase.google.com</a> وأنشئ مشروعاً جديداً.</li>
          <li>من <b>Build ← Authentication</b> اضغط Get started وفعّل <b>Email/Password</b>.</li>
          <li>من <b>Build ← Firestore Database</b> أنشئ قاعدة بيانات، ثم من تبويب <b>Rules</b> الصق القواعد أدناه واضغط Publish.</li>
          <li>من <b>Project settings ← Your apps</b> أضف تطبيق ويب (أيقونة &lt;/&gt;)، وانسخ كائن <code>firebaseConfig</code> والصقه في ملف <code>js/config.js</code> مكان <code>const FIREBASE_CONFIG = null;</code></li>
          <li>من <b>Authentication ← Users ← Add user</b> أنشئ حساب المشرف ببريدك وكلمة مرور، وانسخ الـ <b>User UID</b>.</li>
          <li>في <b>Firestore</b> أنشئ مجموعة اسمها <code>admins</code>، واجعل معرّف المستند هو الـ UID الذي نسخته، وأضف حقلاً <code>name</code> باسمك.</li>
          <li>ارفع الملف على Netlify (اسحب المجلد إلى app.netlify.com/drop)، ثم أضف دومين Netlify في <b>Authentication ← Settings ← Authorized domains</b>.</li>
          <li>افتح <code>admin.html</code> وادخل بالبريد وكلمة المرور، ومن هنا اضغط «إضافة دورات تجريبية» إن أردت محتوى للبدء.</li>
        </ol>
        <div class="toolbar" style="margin:16px 0 8px"><strong class="grow">قواعد Firestore</strong><button class="btn btn-ghost btn-sm" id="cpr">${ic('link', 16)} نسخ القواعد</button></div>
        <pre class="code">${esc(RULES)}</pre></div>`,
    mount() {
      $('#fs').onsubmit = async e => {
        e.preventDefault(); const fd = new FormData(e.target);
        const v = { name: fd.get('name').trim(), nameEn: fd.get('nameEn').trim(), tagline: fd.get('tagline').trim(), heroText: fd.get('heroText').trim(), about: fd.get('about').trim(), allowRegister: !!fd.get('allowRegister') };
        try { await DB.update('settings', 'main', v); Object.assign(S.settings, v); toast('حُفظت الإعدادات', 'ok'); route(); } catch (err) { toast(err.message, 'err'); }
      };
      $('#fp').onsubmit = async e => {
        e.preventDefault(); const f = e.target; if (!f.checkValidity()) { f.reportValidity(); return; }
        const fd = new FormData(f), social = {};
        for (const [k] of SOCIALS) { const u = fd.get('so_' + k).trim(); if (u && !safeUrl(u)) { toast('رابط غير صالح — يجب أن يبدأ بـ https://', 'err'); return; } if (u) social[k] = u; }
        const v = { whatsapp: waNum(fd.get('whatsapp')), email: fd.get('email').trim(), social, allowMessages: !!fd.get('allowMessages'), aboutLong: fd.get('aboutLong').trim(), terms: fd.get('terms').trim() };
        try { await DB.update('settings', 'main', v); Object.assign(S.settings, v); toast('حُفظت الصفحات ووسائل التواصل', 'ok'); } catch (err) { toast(err.message, 'err'); }
      };
      $('#fac').onsubmit = async e => {
        e.preventDefault(); const fd = new FormData(e.target), v = {};
        for (const k of ['accredit', 'acadIntro', 'acadAdmission', 'ijazaIntro', 'ijazaAdmission']) v[k] = fd.get(k).trim();
        try { await DB.update('settings', 'main', v); Object.assign(S.settings, v); toast('حُفظت نصوص الأكاديمية', 'ok'); } catch (err) { toast(err.message, 'err'); }
      };
      $('#fa') && ($('#fa').onsubmit = async e => {
        e.preventDefault(); const fd = new FormData(e.target); const v = { adminUser: fd.get('u').trim(), adminHash: await sha(fd.get('p')) };
        await DB.update('settings', 'main', v); Object.assign(S.settings, v); e.target.reset(); $('[name=u]', e.target).value = v.adminUser; toast('تغيّرت بيانات دخول المشرف', 'ok');
      });
      $('#seed').onclick = async e => { e.currentTarget.disabled = true; try { await seedCourses(); toast('أُضيفت 3 دورات تجريبية', 'ok'); } catch (err) { toast(err.message, 'err'); } e.currentTarget.disabled = false; };
      $('#exp').onclick = async () => {
        const out = {}; for (const c of ['settings', 'courses', 'users', 'enrollments', 'attempts', 'certificates', 'certTypes', 'certAssets', 'courseLive', 'messages', 'applications', 'appFiles', 'records', 'terms', 'regs', 'counters']) out[c] = Object.fromEntries((await safeList(c)).map(({ id, ...r }) => [id, r]));
        downloadFile(`bayan-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(out, null, 1), 'application/json');
      };
      $('#imp') && ($('#imp').onchange = async e => {
        const f = e.target.files[0]; if (!f) return;
        try { const data = JSON.parse(await f.text()); if (!data.courses) throw new Error('الملف ليس نسخة احتياطية من بيان'); if (!(await confirmBox('ستُستبدل كل البيانات الحالية بمحتوى النسخة. متابعة؟', 'استعادة'))) return; Local.save(data); toast('استُعيدت النسخة', 'ok'); setTimeout(() => location.reload(), 600); }
        catch (err) { toast(err.message, 'err'); }
      });
      $('#cpr').onclick = async () => { try { await navigator.clipboard.writeText(RULES); toast('نُسخت القواعد', 'ok'); } catch { toast('انسخ القواعد يدوياً من المربع', 'err'); } };
    }
  };
}


/* ================= دخول المشرف ================= */
async function adminLoginView() {
  if (S.user?.isAdmin) { go('/'); return null; }
  const st = S.settings;
  return {
    layout: 'bare', docTitle: 'دخول',
    html: `<section class="auth" style="min-height:100vh;background:var(--deep)"><div class="auth-card reveal"><div class="auth-head">${logoMark(48)}<h1>لوحة تحكم ${esc(st.name)}</h1><p>للمشرفين فقط</p></div>
      <form id="f" class="form"><label>${S.live ? 'البريد الإلكتروني' : 'اسم المستخدم'}<input name="u" required autocomplete="username" dir="ltr"></label>
      <label>كلمة المرور<input name="p" type="password" required autocomplete="current-password" dir="ltr"></label>
      <div class="form-err" id="err"></div><button class="btn btn-primary btn-block">دخول</button></form>
      ${!S.live && !st.adminHash ? `<div class="demo-note">البيانات الافتراضية: <b dir="ltr">admin / admin123</b><br>غيّرها من الإعدادات بعد الدخول.</div>` : ''}
      <p class="auth-alt"><a href="index.html">الذهاب إلى الموقع</a></p></div></section>`,
    mount() {
      $('#f').onsubmit = async e => {
        e.preventDefault(); const fd = new FormData(e.target), b = $('button', e.target); b.disabled = true; $('#err').textContent = '';
        try { S.user = await Auth.adminLogin(fd.get('u').trim(), fd.get('p')); toast('أهلاً بك', 'ok'); go(sessionStorage.getItem('bayan_admin_next') || '/'); sessionStorage.removeItem('bayan_admin_next'); }
        catch (err) { $('#err').textContent = err.message; b.disabled = false; }
      };
    }
  };
}
const wrapA = f => async (...a) => {
  const [v, nw, na] = await Promise.all([f(...a), safeList('messages', { status: 'new' }), safeList('applications', { status: 'submitted' })]);
  S.unread = nw.length; S.newApps = na.length; return { layout: 'admin', ...v };
};

/* ================= تعريف التطبيق ================= */
const APP = {
  layout: v => v.layout === 'bare' ? v.html : adminShell(v.active, v.title, v.html, v.actions),
  routes: [
    [/^\/login$/, adminLoginView],
    [/^\/?$/, wrapA(adminDash), 'admin'], [/^\/courses$/, wrapA(adminCourses), 'admin'], [/^\/course\/([^/]+)$/, wrapA(adminCourse), 'admin'],
    [/^\/admissions(?:\/(settings))?$/, wrapA(adminAdmissions), 'admin'], [/^\/registry(?:\/(terms))?$/, wrapA(adminRegistry), 'admin'], [/^\/term\/([^/]+)$/, wrapA(adminTerm), 'admin'],
    [/^\/students$/, wrapA(adminStudents), 'admin'], [/^\/results$/, wrapA(adminResults), 'admin'],
    [/^\/certs(?:\/(types|courses|settings))?$/, wrapA(adminCerts), 'admin'], [/^\/certtype\/([^/]+)$/, wrapA(adminCertType), 'admin'], [/^\/messages$/, wrapA(adminMessages), 'admin'], [/^\/settings$/, wrapA(adminSettings), 'admin']
  ],
  guard(g, path) { if (S.user?.isAdmin) return false; if (path !== '/') sessionStorage.setItem('bayan_admin_next', path); go('/login'); return true; },
  afterLogout() { go('/login'); }
};
boot();
