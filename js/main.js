import * as db from './db.js';
import { createLexicon } from './text/lemmatize.js';
import { closeSheet } from './ui.js';
import { app, refreshBadge } from './state.js';
import home from './views/home.js';
import reader from './views/reader.js';
import review from './views/review.js';
import words from './views/words.js';
import settings from './views/settings.js';
import about from './views/about.js';

const routes = { '': home, read: reader, review, words, settings, about };
const tabOf = { '': 'home', read: 'home', review: 'review', words: 'words', settings: 'settings', about: 'settings' };

async function loadData() {
  const [ngsl, dict] = await Promise.all(
    ['data/ngsl.json', 'data/dict.json'].map((u) => fetch(u).then((r) => {
      if (!r.ok) throw new Error(`${u} 載入失敗（${r.status}）`);
      return r.json();
    })));
  app.lex = createLexicon(ngsl, dict);
  app.level = await db.getMeta('level', 1000);
}

async function route() {
  closeSheet();
  const [name = '', ...params] = location.hash.replace(/^#\/?/, '').split('/');
  const view = routes[name] || home;
  document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('on', a.dataset.tab === tabOf[name]));
  const main = document.getElementById('app');
  window.scrollTo(0, 0);
  try {
    await view(main, params.map(decodeURIComponent));
  } catch (e) {
    console.error(e);
    main.innerHTML = `<div class="card">發生錯誤：${e.message}</div>`;
  }
  refreshBadge();
}

(async () => {
  try {
    await loadData();
  } catch (e) {
    document.getElementById('app').innerHTML = `<div class="card">${e.message}，請重新整理。</div>`;
    return;
  }
  window.addEventListener('hashchange', route);
  route();
})();
