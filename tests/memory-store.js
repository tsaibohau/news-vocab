// 測試用的記憶體版 store，介面和 js/db.js 相同
const KEYS = { articles: 'id', words: 'lemma', meta: 'key' };

export function memoryStore() {
  const data = { articles: new Map(), words: new Map(), meta: new Map() };
  const clone = (x) => structuredClone(x);
  return {
    async getAll(s) { return [...data[s].values()].map(clone); },
    async get(s, k) { const v = data[s].get(k); return v ? clone(v) : undefined; },
    async put(s, item) { data[s].set(item[KEYS[s]], clone(item)); },
    async putMany(s, items) { for (const i of items) data[s].set(i[KEYS[s]], clone(i)); },
    async del(s, k) { data[s].delete(k); },
  };
}
