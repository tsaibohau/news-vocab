import * as db from '../db.js';
import { app } from '../state.js';
import { today } from '../clock.js';
import { esc, toast } from '../ui.js';
import { saveArticle } from '../actions.js';
import { analyze } from '../text/analyze.js';

export default async function home(main) {
  const articles = (await db.getAll('articles')).sort((a, b) => b.savedAt - a.savedAt);
  main.innerHTML = `
    <form class="card" id="pasteForm">
      <h1>貼上英文文章</h1>
      <label for="f-title">標題（選填）</label>
      <input id="f-title" maxlength="200" autocomplete="off">
      <label for="f-url">來源網址（選填）</label>
      <input id="f-url" type="url" inputmode="url" placeholder="https://" autocomplete="off">
      <label for="f-text">文章內容</label>
      <textarea id="f-text" required placeholder="把英文新聞貼在這裡…"></textarea>
      <button class="block" type="submit">分析並儲存</button>
      <p class="muted small">文章只存在這支手機的瀏覽器裡，不會上傳。</p>
    </form>
    <h2>我的文章（${articles.length}）</h2>
    <div class="card">${articles.length ? `<ul class="list">${articles.map((a) => {
      const st = analyze(a.text, app.lex, app.level).stats;
      return `<li><a class="item" href="#/read/${a.id}">
        <div class="item-title">${esc(a.title)}</div>
        <div class="row small muted"><span class="tag ${st.difficulty.key}">${st.difficulty.label}</span>
        <span>${st.words} 字</span><span>已知 ${Math.round(st.knownCoverage * 100)}%</span><span>${a.createdAt}</span></div>
      </a></li>`;
    }).join('')}</ul>` : '<p class="muted">還沒有文章。</p>'}</div>`;

  main.querySelector('#pasteForm').onsubmit = async (e) => {
    e.preventDefault();
    const text = main.querySelector('#f-text').value;
    if (!/[A-Za-z]{2,}/.test(text)) { toast('請貼上英文文章'); return; }
    let url = main.querySelector('#f-url').value.trim();
    if (url && !/^https?:\/\//i.test(url)) url = '';
    const { article, encountered } = await saveArticle(db, app.lex, {
      title: main.querySelector('#f-title').value, url, text,
    }, today());
    if (encountered.length) {
      toast(`又遇見 ${encountered.length} 個收藏的字：${encountered.slice(0, 5).join('、')}${encountered.length > 5 ? '…' : ''}`, 4000);
    }
    location.hash = `#/read/${article.id}`;
  };
}
