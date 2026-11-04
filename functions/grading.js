'use strict';
/* نسخة حرفية من دوال السحب والتصحيح في js/core.js:
   Q_TYPES, Q_AUTO, shuffleArr, paperCount, drawPaper, normAr, autoMark, gradeSitting
   إذا عدّلتها هناك فانسخها هنا كما هي، ليتطابق السيرفر مع لوحة التحكم. */
const Q_TYPES = { mcq: 'اختيار من متعدد', tf: 'صح أو خطأ', short: 'إجابة قصيرة', essay: 'سؤال مقالي' };
const Q_AUTO = t => t === 'mcq' || t === 'tf';
const shuffleArr = (a, rnd = Math.random) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const paperCount = (e, qs) => e.drawOn ? Object.keys(Q_TYPES).reduce((n, t) => n + Math.min(Math.max(0, +(e.draw || {})[t] || 0), qs.filter(q => q.type === t).length), 0) : qs.length;
function drawPaper(e, qs) {
  let out = e.drawOn ? Object.keys(Q_TYPES).flatMap(t => shuffleArr(qs.filter(q => q.type === t)).slice(0, Math.max(0, +(e.draw || {})[t] || 0))) : [...qs];
  if (e.shuffle) out = shuffleArr(out); else { const ids = new Set(out.map(q => q.id)); out = qs.filter(q => ids.has(q.id)); }
  return out;
}
const normAr = s => String(s ?? '').replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/^ال(?=\S{3,})/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().toLowerCase();
function autoMark(q, k, a) {
  const max = +q.pts || 1;
  if (q.type === 'essay') return { pts: a == null || String(a).trim() === '' ? 0 : null, review: a != null && String(a).trim() !== '' };
  if (a == null || a === '') return { pts: 0 };
  if (Q_AUTO(q.type)) return { pts: k && +a === +k.a ? max : 0 };
  const ok = (k?.acc || []).some(x => normAr(x) && normAr(x) === normAr(a));
  return { pts: ok ? max : 0, review: !ok };
}
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

module.exports = { Q_TYPES, drawPaper, paperCount, autoMark, gradeSitting, normAr };
