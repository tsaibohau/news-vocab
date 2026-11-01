// 中文解釋另外放一個檔，使用者要看時才下載
let cache = null;
let loading = null;

export function loadZh() {
  if (cache) return Promise.resolve(cache);
  if (!loading) {
    loading = fetch('data/dict-zh.json')
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { cache = d.entries; return cache; })
      .catch((e) => { loading = null; throw e; });
  }
  return loading;
}

export async function zhOf(lemma) {
  return (await loadZh())[lemma] || '';
}
