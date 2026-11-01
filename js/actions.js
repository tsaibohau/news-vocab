// 會寫入資料的動作。store 介面 = {getAll, get, put, putMany, del}，
// 瀏覽器用 db.js，測試用記憶體版本。
import { analyze, sentenceFor } from './text/analyze.js';
import { newWord, applyEncounters } from './encounters.js';
import { grade } from './srs.js';

export function newArticleId() {
  return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// 儲存新文章，並幫已收藏的字累計遇見次數。回傳 {article, encountered: [lemma]}
// extra：每日新聞的 {source, attribution, newsDate}
export async function saveArticle(store, lex, { title, url, text, ...extra }, today, id = newArticleId()) {
  const article = {
    id,
    title: title.trim() || text.trim().slice(0, 40),
    url: url.trim(),
    text,
    createdAt: today,
    savedAt: Date.now(),
    ...extra,
  };
  await store.put('articles', article);
  const { lemmas } = analyze(text, lex, 0);
  const changed = applyEncounters(await store.getAll('words'), lemmas, id);
  if (changed.length) await store.putMany('words', changed);
  return { article, encountered: changed.map((w) => w.lemma) };
}

// 從文章中的某個字收藏。已收藏就回傳原本的資料。
export async function collectWord(store, article, analysis, token, today) {
  const existing = await store.get('words', token.lemma);
  if (existing) return existing;
  const word = newWord({
    lemma: token.lemma,
    surface: token.text,
    ...sentenceFor(article.text, analysis, token),
    articleId: article.id,
    articleTitle: article.title,
    today,
  });
  await store.put('words', word);
  return word;
}

export async function gradeWord(store, word, g, today) {
  const next = grade(word, g, today);
  await store.put('words', next);
  return next;
}

export async function dueWords(store, today) {
  const words = await store.getAll('words');
  return words
    .filter((w) => w.due <= today)
    .sort((a, b) => a.due.localeCompare(b.due) || a.addedAt.localeCompare(b.addedAt));
}

export async function exportData(store) {
  return {
    app: 'news-vocab',
    version: 1,
    exportedAt: new Date().toISOString(),
    articles: await store.getAll('articles'),
    words: await store.getAll('words'),
    meta: await store.getAll('meta'),
  };
}

export function validateBackup(data) {
  if (!data || data.app !== 'news-vocab' || !Array.isArray(data.words) || !Array.isArray(data.articles)) {
    throw new Error('not a News Vocab backup');
  }
  return data;
}
