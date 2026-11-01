// 遇見次數：之後貼的文章出現已收藏的字就 +1，同一篇只算一次。
export const ENCOUNTER_GOAL = 12;

// 收藏一個新字（收藏當下那篇算第 1 次）
export function newWord({ lemma, surface, sentence, hlStart, hlEnd, articleId, articleTitle, today }) {
  return {
    lemma,
    surface,
    sentence,
    hlStart,
    hlEnd,
    articleId,
    articleTitle: articleTitle || '',
    addedAt: today,
    due: today,
    step: 0,
    reviews: 0,
    lapses: 0,
    lastReviewed: null,
    encounters: 1,
    seenArticles: [articleId],
  };
}

// words：已收藏的字；lemmas：這篇文章出現的原形集合。回傳有變動的字（新物件）
export function applyEncounters(words, lemmas, articleId) {
  const changed = [];
  for (const w of words) {
    if (!lemmas.has(w.lemma) || w.seenArticles.includes(articleId)) continue;
    changed.push({
      ...w,
      encounters: w.encounters + 1,
      seenArticles: [...w.seenArticles, articleId],
    });
  }
  return changed;
}
