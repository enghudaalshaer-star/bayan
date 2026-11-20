/* محاكاة Firebase compat فوق ذاكرة: لاختبار مسار Firebase في الواجهة (Remote, cachedDB, count, listIn, recent, transactions, callables) */
module.exports = function install(w, seed, { uid, admins = [], log }) {
  const store = JSON.parse(JSON.stringify(seed)); store.admins = Object.fromEntries(admins.map(a => [a, { at: 1 }]));
  const stats = { reads: 0, writes: 0, agg: 0, byCol: {} };
  const R = (c, n = 1) => { stats.reads += n; stats.byCol[c] = (stats.byCol[c] || 0) + n; };
  class TS { constructor(ms) { this.ms = ms; } toMillis() { return this.ms; } }
  const SRV = { __srv: 1 };
  const fix = v => v === SRV ? new TS(Date.now()) : Array.isArray(v) ? v.map(fix) : v && typeof v === 'object' && !(v instanceof TS) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fix(x)])) : v;
  const clone = v => v instanceof TS ? v : Array.isArray(v) ? v.map(clone) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clone(x)])) : v;
  const snap = (c, id) => { const d = store[c]?.[id]; return { id, exists: !!d, data: () => d ? clone(d) : undefined, get: k => d?.[k] }; };
  const docRef = (c, id) => ({ id,
    async get() { R(c); return snap(c, id); },
    async set(v, o) { stats.writes++; store[c] = store[c] || {}; store[c][id] = o?.merge ? { ...(store[c][id] || {}), ...fix(clone(v)) } : fix(clone(v)); },
    async update(v) { if (!store[c]?.[id]) throw Object.assign(new Error('not-found'), { code: 'not-found' }); return this.set(v, { merge: true }); },
    async delete() { stats.writes++; if (store[c]) delete store[c][id]; } });
  const query = (c, fl = [], ord = null, lim = 0) => ({
    where(f, op, v) { return query(c, [...fl, [f, op, v]], ord, lim); }, orderBy(f, d) { return query(c, fl, [f, d], lim); }, limit(n) { return query(c, fl, ord, n); },
    doc(id) { return docRef(c, id); },
    async get() {
      let a = Object.entries(store[c] || {}).filter(([, d]) => fl.every(([f, op, v]) => op === '==' ? JSON.stringify(d[f]) === JSON.stringify(v) : op === 'in' ? v.includes(d[f]) : false));
      if (ord) a = a.filter(([, d]) => d[ord[0]] != null).sort((x, y) => (ord[1] === 'desc' ? -1 : 1) * ((x[1][ord[0]] > y[1][ord[0]]) - (x[1][ord[0]] < y[1][ord[0]])));
      if (lim) a = a.slice(0, lim);
      R(c, Math.max(1, a.length)); return { docs: a.map(([id]) => snap(c, id)), size: a.length };
    } });
  let user = uid ? { uid, email: uid + '@x', getIdToken: async () => 'tok' } : null;
  const fdb = { collection: c => query(c),
    async runTransaction(fn) { const tx = { get: r => r.get(), set: (r, v, o) => r.set(v, o) }; return fn(tx); } };
  const auth = { get currentUser() { return user; }, onAuthStateChanged(cb) { setTimeout(() => cb(user)); return () => {}; }, async setPersistence() {}, async signOut() { user = null; } };
  const callables = {
    async issueCert({ courseId, attemptId }) { const id = `BYN-TEST-${Math.random().toString(36).slice(2, 6).toUpperCase()}`; store.certificates = store.certificates || {}; store.certificates[id] = { uid, courseId, name: store.users[uid]?.name, issuedAt: Date.now(), score: 100 }; return { code: id }; },
    async startExam({ examId }) { const e = store.exams[examId], p = store.examPapers[examId]; const sid = `${examId}_${uid}`;
      store.sittings[sid] = { uid, examId, courseId: e.courseId, kind: e.kind, qids: p.questions.map(q => q.id), answers: {}, status: 'started', startedAt: new TS(Date.now()), savedAt: new TS(Date.now()) };
      store.sitPapers[sid] = { uid, examId, questions: p.questions.map(({ id, type, text, options, pts }) => ({ id, type, text, options, pts })) }; return { resumed: false, serverNow: Date.now() }; },
    async recountStats() { return { users: 1, certs: 1, courses: 1 }; } };
  const fb = { apps: [], initializeApp() { const a = { name: '[DEFAULT]', functions: () => ({ httpsCallable: n => async d => ({ data: await callables[n](d) }) }) }; fb.apps.push(a); return a; },
    app: () => fb.apps[0], firestore: Object.assign(() => fdb, { FieldValue: { serverTimestamp: () => SRV }, Timestamp: { fromMillis: ms => new TS(ms) } }),
    auth: Object.assign(() => auth, { Auth: { Persistence: { LOCAL: 1, SESSION: 2 } } }), functions: () => ({}), storage: () => ({ ref: p => ({ getDownloadURL: async () => 'https://x/' + p, put: async () => ({}), delete: async () => {} }) }) };
  w.firebase = fb;
  w.fetch = async (url, o) => {
    if (String(url).includes('runAggregationQuery')) {
      stats.agg++; const q = JSON.parse(o.body).structuredAggregationQuery, sq = q.structuredQuery, c = sq.from[0].collectionId, ag = q.aggregations[0];
      const val = v => 'integerValue' in v ? +v.integerValue : 'doubleValue' in v ? v.doubleValue : 'booleanValue' in v ? v.booleanValue : 'stringValue' in v ? v.stringValue : 'arrayValue' in v ? (v.arrayValue.values || []).map(val) : null;
      const fls = !sq.where ? [] : sq.where.compositeFilter ? sq.where.compositeFilter.filters : [sq.where];
      const OPS = { EQUAL: (a, b) => JSON.stringify(a) === JSON.stringify(b), NOT_EQUAL: (a, b) => a !== undefined && JSON.stringify(a) !== JSON.stringify(b), GREATER_THAN: (a, b) => a > b, LESS_THAN: (a, b) => a < b };
      const rows = Object.values(store[c] || {}).filter(d => fls.every(f => OPS[f.fieldFilter.op](d[f.fieldFilter.field.fieldPath], val(f.fieldFilter.value))));
      R(c, Math.max(1, Math.ceil(rows.length / 1000)));
      const out = ag.count ? { integerValue: String(rows.length) } : (() => { const f = ag.avg.field.fieldPath, l = rows.filter(r => typeof r[f] === 'number'); return l.length ? { doubleValue: l.reduce((s, r) => s + r[f], 0) / l.length } : { nullValue: null }; })();
      return { ok: true, status: 200, json: async () => [{ result: { aggregateFields: { v: out } } }] };
    }
    return globalThis.fetch(url, o);
  };
  return { store, stats };
};
