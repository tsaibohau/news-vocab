// 每日新聞：讀取 GitHub Actions 產生的靜態 JSON
let indexCache = null;

export async function newsIndex() {
  if (!indexCache) {
    const r = await fetch('data/news/index.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    indexCache = await r.json();
  }
  return indexCache;
}

export async function newsItem(id) {
  if (!/^[a-z]+-[0-9a-f]{10}$/.test(id)) throw new Error('bad id');
  const r = await fetch(`data/news/items/${id}.json`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export const articleIdForNews = (id) => `n-${id}`;
