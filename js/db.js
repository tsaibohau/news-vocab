// IndexedDB 小包裝。資料庫只在使用者自己的裝置上。
const DB_NAME = 'news-vocab';
const DB_VERSION = 1;
export const STORES = ['articles', 'words', 'meta'];
const KEYS = { articles: 'id', words: 'lemma', meta: 'key' };

let dbPromise = null;

function open() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      // 之後版本升級時在這裡加新的 store（例如第 3 階段的新聞快取）
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: KEYS[name] });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function done(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () => reject(tx.error);
  });
}

function request(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getAll(store) {
  const db = await open();
  return request(db.transaction(store).objectStore(store).getAll());
}

export async function get(store, key) {
  const db = await open();
  return request(db.transaction(store).objectStore(store).get(key));
}

export async function putMany(store, items) {
  const db = await open();
  const tx = db.transaction(store, 'readwrite');
  for (const item of items) tx.objectStore(store).put(item);
  return done(tx);
}

export const put = (store, item) => putMany(store, [item]);

export async function del(store, key) {
  const db = await open();
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).delete(key);
  return done(tx);
}

export async function replaceAll(data) {
  const db = await open();
  const tx = db.transaction(STORES, 'readwrite');
  for (const name of STORES) {
    const s = tx.objectStore(name);
    s.clear();
    for (const item of data[name] || []) s.put(item);
  }
  return done(tx);
}

export async function getMeta(key, fallback) {
  const row = await get('meta', key);
  return row ? row.value : fallback;
}

export const setMeta = (key, value) => put('meta', { key, value });
