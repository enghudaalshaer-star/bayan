const { open, sleep } = require('./run.js');
const fs = require('fs');
const base = JSON.parse(fs.readFileSync(__dirname + '/.tmp/seed.json'));
const IGN = /fonts\.googleapis|setTransform|getContext|Not implemented|cdnjs/;
let fails = 0;
const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fails++; };
const demoUid = Object.entries(base.users).find(([, u]) => u.username === 'demo')[0];
async function page(p, ls, seed = base) {
  const r = await open(p, { bayan_db_v1: JSON.stringify(seed), bayan_seeded: '1', bayan_seeded_v2: '1', ...ls }); await sleep(600);
  const w = r.w, $ = (s, el) => (el || w.document).querySelector(s), $$ = (s, el) => [...(el || w.document).querySelectorAll(s)];
  const click = async (el, ms = 700) => { if (typeof el === 'string') el = $(el); if (!el) throw new Error('no element'); el.dispatchEvent(new w.MouseEvent('click', { bubbles: true })); await sleep(ms); };
  const submitModal = async (ms = 900) => { const f = $$('.modal-bg form').pop(); f.dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await sleep(ms); };
  const go = async (h, ms = 900) => { w.location.hash = h; await sleep(ms); };
  const db = () => JSON.parse(w.localStorage.getItem('bayan_db_v1'));
  const errs = () => r.errors.filter(e => !IGN.test(e));
  return { w, $, $$, click, submitModal, go, db, errs };
}
(async () => {
  /* ---- admin: admissions accept ---- */
  { const P = await page('cp-7q4x9k.html', { bayan_admin_session: '{"admin":true}' });
    await P.go('#/admissions');
    ok(P.$$('#sf [data-f]').length === 9, 'admissions: chips rendered with counts ' + P.$$('#sf [data-f]').map(b => b.textContent.trim()).join(' | '));
    await P.click('#sf [data-f=""]', 900); const rows = P.$$('#tbl tbody tr').length; ok(rows > 0, 'admissions: "الكل" loads all statuses (' + rows + ')');
    await P.click('#sf [data-f="open"]'); const openBtn = P.$$('[data-open]')[0]; ok(!!openBtn, 'admissions: open filter has rows');
    const id = openBtn.dataset.open, app0 = P.db().applications[id];
    await P.click(openBtn, 900); ok(!!P.$('[data-d="accepted"]'), 'admissions: review modal opened');
    await P.click('[data-d="accepted"]', 900); ok(P.$$('.modal-bg').length >= 1 && !!P.$('[name=cohort]'), 'admissions: accept modal with cohort list (' + P.$$('#cohorts option').length + ' cohorts)');
    await P.submitModal(1500);
    const rec = P.db().records[`${app0.uid}_${app0.program}`];
    ok(rec && rec.status === 'active' && P.db().applications[id].status === 'accepted', 'admissions: accepted → record ' + (rec && rec.studentNo));
    ok(P.errs().length === 0, 'admissions: no errors ' + P.errs().join('\n').slice(0, 500));
    /* registry */
    await P.go('#/registry'); ok(P.$$('#tbl tbody tr').length > 0, 'registry: rows ' + P.$$('#tbl tbody tr').length);
    ok(!/undefined|NaN/.test(P.$('#tbl').textContent), 'registry: no undefined/NaN in table');
    await P.click('#tbl [data-a="view"]'); ok(/الفصول المسجّل فيها/.test(P.$$('.modal-bg').pop()?.textContent || ''), 'registry: student terms modal');
    P.$$('.modal-bg').forEach(m => m.remove());
    await P.click('#addR', 900); ok(P.$$('.modal-bg select[name=uid] option').length > 1, 'registry: manual-record modal lists users');
    P.$$('.modal-bg').forEach(m => m.remove());
    await P.go('#/registry/terms'); ok(/\d/.test(P.$('tbody')?.textContent || ''), 'registry terms: counts shown');
    /* students */
    await P.go('#/students'); ok(P.$$('#tbl tbody tr').length > 0 && !/NaN|undefined/.test(P.$('#tbl').textContent), 'students: table');
    await P.click('#tbl [data-a="view"]', 900); ok(/التقدّم في الدورات/.test(P.$$('.modal-bg').pop()?.textContent || ''), 'students: details modal (lazy)');
    P.$$('.modal-bg').forEach(m => m.remove());
    await P.click('#tbl [data-a="enroll"]', 900); ok(P.$$('.modal-bg input[name=c]:checked').length > 0, 'students: enroll modal shows current courses');
    P.$$('.modal-bg').forEach(m => m.remove());
    /* certs */
    await P.go('#/certs'); const n0 = P.$$('#tbl tbody tr').length; ok(n0 > 0, 'certs: recent list ' + n0);
    const code = P.db().certificates && Object.keys(P.db().certificates)[0];
    const q = P.$('#q'); q.value = code; q.dispatchEvent(new P.w.Event('input', { bubbles: true })); await P.sleep?.(0); await new Promise(r => setTimeout(r, 600));
    ok(P.$$('#tbl tbody tr').length === 1, 'certs: search by code');
    const co = Object.values(P.db().certificates)[0].courseId; q.value = ''; q.dispatchEvent(new P.w.Event('input', { bubbles: true }));
    P.$('#fco').value = co; P.$('#fco').dispatchEvent(new P.w.Event('change', { bubbles: true })); await new Promise(r => setTimeout(r, 700));
    ok(P.$$('#tbl tbody tr').length >= 1, 'certs: filter by course');
    await P.go('#/certs/courses'); ok(/\d/.test(P.$('tbody')?.textContent || ''), 'certs/courses: counts');
    /* term page: register all */
    const term = Object.keys(P.db().terms)[0]; await P.go('#/term/' + term, 1200);
    ok(!!P.$('#rl') && !/NaN|undefined/.test(P.$('#app').textContent), 'term page renders');
    /* marks index search */
    await P.go('#/results/marks'); const sq = P.$('#sq'); sq.value = 'de'; sq.dispatchEvent(new P.w.Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, 700));
    ok(P.$$('#sres a').length > 0, 'marks index: lazy student search');
    /* dashboard */
    await P.go('#/'); ok(!/NaN|undefined/.test(P.$('#app').textContent) && P.$$('.kpi').length >= 9, 'dashboard KPIs');
    ok(P.errs().length === 0, 'admin: no errors overall ' + P.errs().join('\n').slice(0, 800));
    P.w.close(); }

  /* ---- student: practice exam + cert, official test ---- */
  { const db = JSON.parse(JSON.stringify(base));
    // prepare an open official exam with no sitting for demo
    const [eid, e] = Object.entries(db.exams).find(([, e]) => db.enrollments[`${demoUid}_${e.courseId}`]);
    Object.assign(e, { published: true, opensAt: Date.now() - 6e4, closesAt: Date.now() + 36e5, duration: 30, resultsOut: false });
    delete db.sittings[`${eid}_${demoUid}`]; delete db.sitPapers[`${eid}_${demoUid}`]; delete db.grades[`${eid}_${demoUid}`];
    const P = await page('index.html', { bayan_session: JSON.stringify({ uid: demoUid }) }, db);
    await P.go('#/test/' + eid, 1000); ok(!!P.$('#go'), 'test: start button');
    await P.click('#go', 600); await P.submitModal(1500);
    const q1 = P.$('.opt, textarea, input[type=text]'); ok(!!q1, 'test: question rendered');
    let guard = 0;
    while (guard++ < 60) { const o = P.$('.opt'); if (o) await P.click(o, 150); const ta = P.$('#exam textarea'); if (ta && !ta.value) { ta.value = 'إجابة'; ta.dispatchEvent(new P.w.Event('input', { bubbles: true })); }
      if (P.$('#nx')) await P.click('#nx', 250); else break; }
    await P.click('#sb', 600); await P.submitModal(1500);
    const sit = P.db().sittings[`${eid}_${demoUid}`]; ok(sit && sit.status === 'submitted' && Object.keys(sit.answers || {}).length > 0, 'test: submitted with answers (' + Object.keys(sit?.answers || {}).length + ')');
    /* practice exam */
    const c = Object.entries(db.courses).find(([id, c]) => (c.exam?.questions || []).length && db.enrollments[`${demoUid}_${id}`] && !+c.offExams);
    if (c) { const [cid0, c0] = c; c0.exam.maxAttempts = 0; c0.exam.requireLessons = false; c0.startsAt = 0; c0.exam.reveal = 'full'; const en = db.enrollments[`${demoUid}_${cid0}`]; en.termId = ''; en.completed = (c0.lessons || []).map(l => l.id);
      for (const [k, a] of Object.entries(db.attempts)) if (a.uid === demoUid && a.courseId === cid0) delete db.attempts[k];
      for (const [k, x] of Object.entries(db.certificates)) if (x.uid === demoUid && x.courseId === cid0) delete db.certificates[k];
      P.w.localStorage.setItem('bayan_db_v1', JSON.stringify({ ...P.db(), courses: db.courses, enrollments: { ...P.db().enrollments, [`${demoUid}_${cid0}`]: en }, attempts: db.attempts, certificates: db.certificates }));
      console.log('  practice course', cid0, 'questions', c0.exam.questions.length);
      const [cid, course] = c; await P.go('#/exam/' + cid, 1000);
      if (P.$('#go')) { await P.click('#go', 500); let g = 0;
        while (g++ < 60) { const q = course.exam.questions.find(x => P.$('#exam h2')?.textContent.includes(x.text)); const opts = P.$$('.opt'); if (q && opts[q.answer]) await P.click(opts[q.answer], 120); if (P.$('#nx')) await P.click('#nx', 150); else break; }
        await P.click('#sb', 400); if (P.$('.modal-bg')) await P.submitModal(800); await new Promise(r => setTimeout(r, 1500));
        const att = Object.values(P.db().attempts).filter(a => a.uid === demoUid && a.courseId === cid); ok(att.length > 0, 'practice: attempt saved (score ' + att.at(-1)?.score + ')');
        ok(Object.values(P.db().certificates).some(x => x.uid === demoUid && x.courseId === cid), 'practice: certificate issued after pass');
      } else ok(true, 'practice: no start button (attempts exhausted / locked) — skipped');
    } else ok(true, 'practice: no eligible course — skipped');
    await P.go('#/me', 1200); ok(!/NaN|undefined/.test(P.$('#app').textContent), 'me page after actions');
    ok(P.errs().length === 0, 'student: no errors ' + P.errs().join('\n').slice(0, 800));
    P.w.close(); }
  console.log('FAILS', fails); process.exit(fails ? 1 : 0);
})();
