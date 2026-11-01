import * as db from '../db.js';
import { app } from '../state.js';
import { today } from '../clock.js';
import { esc, toast, diffLabel } from '../ui.js';
import { t } from '../i18n.js';
import { saveArticle } from '../actions.js';
import { analyze, difficultyOf } from '../text/analyze.js';
import { newsIndex, articleIdForNews } from '../news.js';

const PAGE = 15;
const view = { source: 'all', sort: 'new', shown: PAGE };

export default async function home(main) {
  const articles = (await db.getAll('articles')).sort((a, b) => b.savedAt - a.savedAt);
  const opened = new Set(articles.map((a) => a.id));

  main.innerHTML = `
    <h1>${esc(t('dailyNews'))}</h1>
    <p class="muted small" style="margin-top:-6px">${esc(t('newsNote'))} EY = Executive Yuan · MOFA = Ministry of Foreign Affairs</p>
    <div id="newsBox"><p class="muted">${esc(t('loading'))}</p></div>

    <details class="card" id="pasteBox">
      <summary>${esc(t('pasteTitle'))}</summary>
      <form id="pasteForm">
        <label for="f-title">${esc(t('title'))}</label>
        <input id="f-title" maxlength="200" autocomplete="off">
        <label for="f-url">${esc(t('sourceUrl'))}</label>
        <input id="f-url" type="url" inputmode="url" placeholder="https://" autocomplete="off">
        <label for="f-text">${esc(t('text'))}</label>
        <textarea id="f-text" required lang="en" placeholder="${esc(t('textPlaceholder'))}"></textarea>
        <button class="block" type="submit">${esc(t('analyze'))}</button>
        <p class="muted small">${esc(t('privateNote'))}</p>
      </form>
    </details>

    <h2>${esc(t('myArticles', articles.length))}</h2>
    <div class="card">${articles.length ? `<ul class="list">${articles.map((a) => {
      const st = analyze(a.text, app.lex, app.level).stats;
      return `<li><a class="item" href="#/read/${esc(a.id)}">
        <div class="item-title" lang="en">${esc(a.title)}</div>
        <div class="news-meta"><span class="tag ${st.difficulty.key}">${esc(diffLabel(st.difficulty.key))}</span>
        <span>${esc(t('words', st.words))}</span><span>${esc(t('known', Math.round(st.knownCoverage * 100)))}</span>
        ${a.source ? `<span class="src">${esc(a.source.toUpperCase())}</span>` : ''}<span>${esc(a.createdAt)}</span></div>
      </a></li>`;
    }).join('')}</ul>` : `<p class="muted">${esc(t('noArticles'))}</p>`}</div>`;

  main.querySelector('#pasteForm').onsubmit = async (e) => {
    e.preventDefault();
    const text = main.querySelector('#f-text').value;
    if (!/[A-Za-z]{2,}/.test(text)) { toast(t('needEnglish')); return; }
    let url = main.querySelector('#f-url').value.trim();
    if (url && !/^https?:\/\//i.test(url)) url = '';
    const { article, encountered } = await saveArticle(db, app.lex, {
      title: main.querySelector('#f-title').value, url, text,
    }, today());
    if (encountered.length) toast(t('metEncountered', encountered.length, encountered.slice(0, 5).join(', ')), 4000);
    location.hash = `#/read/${article.id}`;
  };

  renderNews(main.querySelector('#newsBox'), opened);
}

async function renderNews(box, opened) {
  let data;
  try {
    data = await newsIndex();
  } catch {
    box.innerHTML = `<p class="muted">${esc(t('newsLoadFailed'))}</p>`;
    return;
  }
  // 依使用者程度取對應的已知字比例
  const pct = (it) => it.known[String(app.level)] ?? 0;

  const draw = () => {
    let items = data.items.filter((it) => view.source === 'all' || it.source === view.source);
    if (view.sort === 'easy') items = [...items].sort((a, b) => pct(b) - pct(a));
    const shown = items.slice(0, view.shown);
    const chip = (key, label) => `<button class="chip${view.source === key ? ' on' : ''}" data-src="${key}">${esc(label)}</button>`;
    box.innerHTML = `
      <div class="filters">
        ${chip('all', t('filterAll'))}
        ${Object.keys(data.sources).map((k) => chip(k, k.toUpperCase())).join('')}
        <select id="newsSort" aria-label="sort">
          <option value="new"${view.sort === 'new' ? ' selected' : ''}>Newest</option>
          <option value="easy"${view.sort === 'easy' ? ' selected' : ''}>Easiest</option>
        </select>
      </div>
      <div class="card">${shown.length ? `<ul class="list">${shown.map((it) => {
        const d = difficultyOf(pct(it) / 100).key;
        return `<li><a class="item" href="#/news/${esc(it.id)}">
          <div class="item-title" lang="en">${opened.has(articleIdForNews(it.id)) ? '✓ ' : ''}${esc(it.title)}</div>
          <div class="news-meta"><span class="tag ${d}">${esc(diffLabel(d))}</span>
            <span>${esc(t('known', Math.round(pct(it))))}</span><span>${esc(t('words', it.words))}</span>
            <span class="src">${esc(it.source.toUpperCase())}</span><span>${esc(it.date)}</span></div>
        </a></li>`;
      }).join('')}</ul>` : `<p class="muted">${esc(t('newsEmpty'))}</p>`}
      ${items.length > shown.length ? `<button class="secondary block" id="more">${esc(t('showMore'))}</button>` : ''}</div>`;
    box.querySelectorAll('[data-src]').forEach((b) => { b.onclick = () => { view.source = b.dataset.src; view.shown = PAGE; draw(); }; });
    box.querySelector('#newsSort').onchange = (e) => { view.sort = e.target.value; draw(); };
    box.querySelector('#more')?.addEventListener('click', () => { view.shown += PAGE; draw(); });
  };
  draw();
}
