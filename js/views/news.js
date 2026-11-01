// 打開一篇每日新聞：第一次打開時存進本機（並計算遇見次數），再轉到閱讀頁
import * as db from '../db.js';
import { app } from '../state.js';
import { today } from '../clock.js';
import { esc, toast } from '../ui.js';
import { t } from '../i18n.js';
import { saveArticle } from '../actions.js';
import { newsItem, articleIdForNews } from '../news.js';

export default async function news(main, [id]) {
  const articleId = articleIdForNews(id);
  if (!(await db.get('articles', articleId))) {
    main.innerHTML = `<p class="muted center pad">${esc(t('loading'))}</p>`;
    let item;
    try {
      item = await newsItem(id);
    } catch {
      main.innerHTML = `<div class="card">${esc(t('notFound'))} <a href="#/">${esc(t('backToList'))}</a></div>`;
      return;
    }
    const { encountered } = await saveArticle(db, app.lex, {
      title: item.title, url: item.url, text: item.text,
      source: item.source, attribution: item.attribution, newsDate: item.date,
    }, today(), articleId);
    if (encountered.length) toast(t('metEncountered', encountered.length, encountered.slice(0, 5).join(', ')), 4000);
  }
  location.replace(`#/read/${articleId}`);
}
