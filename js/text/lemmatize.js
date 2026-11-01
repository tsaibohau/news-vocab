// 詞形還原：NGSL 字形表 → ECDICT 變化形 → 簡單規則。
// ngsl = {lemmas: [...依排名], forms: {字形: 原形}}
// dict = {entries: {字: [音標, 解釋]}, forms: {字形: 原形}}

const NOT = { "won't": 'will', "can't": 'can', "shan't": 'shall', "ain't": 'be' };
const CLITIC = /'(s|re|ve|ll|d|m)$/;

function ruleCandidates(w) {
  const c = [];
  const undouble = (s) => (/([b-df-hj-np-tv-z])\1$/.test(s) ? s.slice(0, -1) : null);
  const add = (s) => { if (s && s.length > 1) c.push(s); };
  if (w.endsWith('ies')) add(w.slice(0, -3) + 'y');
  if (w.endsWith('es')) add(w.slice(0, -2));
  if (w.endsWith('s') && !w.endsWith('ss')) add(w.slice(0, -1));
  if (w.endsWith('ied')) add(w.slice(0, -3) + 'y');
  if (w.endsWith('ed')) { const s = w.slice(0, -2); add(s); add(s + 'e'); add(undouble(s)); }
  if (w.endsWith('ing')) { const s = w.slice(0, -3); add(s); add(s + 'e'); add(undouble(s)); }
  if (w.endsWith('ier')) add(w.slice(0, -3) + 'y');
  if (w.endsWith('iest')) add(w.slice(0, -4) + 'y');
  if (w.endsWith('er')) { const s = w.slice(0, -2); add(s); add(s + 'e'); add(undouble(s)); }
  if (w.endsWith('est')) { const s = w.slice(0, -3); add(s); add(s + 'e'); add(undouble(s)); }
  return c;
}

export function createLexicon(ngsl, dict) {
  const rank = new Map(ngsl.lemmas.map((w, i) => [w, i + 1]));
  const cache = new Map();

  function baseOf(w) {
    if (ngsl.forms[w]) return ngsl.forms[w]; // 先查字形（同形字如 rose → rise）
    if (rank.has(w)) return w;
    if (dict.forms[w]) return dict.forms[w];
    if (w in dict.entries) return w;
    const cands = ruleCandidates(w);
    return cands.find((c) => rank.has(c)) || cands.find((c) => c in dict.entries) || w;
  }

  function lemmatize(word) {
    let w = word.toLowerCase().replace(/’/g, "'").replace(/\./g, '');
    if (cache.has(w)) return cache.get(w);
    const key = w;
    if (NOT[w]) w = NOT[w];
    else if (w.endsWith("n't")) w = w.slice(0, -3);
    else w = w.replace(CLITIC, '');
    w = w.replace(/'/g, '');
    const lemma = baseOf(w);
    cache.set(key, lemma);
    return lemma;
  }

  return {
    lemmatize,
    rankOf: (lemma) => rank.get(lemma) ?? null,
    lookup: (lemma) => dict.entries[lemma] || null,
    size: rank.size,
  };
}
