import { tokenize, splitSentences } from './tokenize.js';

export const LEVELS = [500, 1000, 1500, 2000, 2500];

// 依「已知字覆蓋率」判斷難度（Nation 的 95% / 98% 門檻）
export function difficultyOf(coverage) {
  if (coverage >= 0.98) return { key: 'easy', label: '輕鬆' };
  if (coverage >= 0.95) return { key: 'ok', label: '適中' };
  if (coverage >= 0.90) return { key: 'hard', label: '有挑戰' };
  return { key: 'vhard', label: '困難' };
}

// lex = createLexicon(...) 的結果；level = 使用者已知的 NGSL 前幾名
export function analyze(text, lex, level) {
  const sentences = splitSentences(text);
  const tokens = tokenize(text);
  let si = 0;
  let counted = 0, inNgsl = 0, known = 0;
  const targets = [];
  const seenTarget = new Set();
  const lemmas = new Set();

  for (let ti = 0; ti < tokens.length; ti++) {
    const t = tokens[ti];
    while (si < sentences.length - 1 && t.start >= sentences[si].end) si++;
    t.sent = si;
    t.lemma = lex.lemmatize(t.text);
    t.rank = lex.rankOf(t.lemma);

    const first = t.text[0];
    const isCap = first >= 'A' && first <= 'Z';
    const allCaps = t.text.length > 1 && t.text === t.text.toUpperCase();
    const lead = sentences[si] ? text.slice(sentences[si].start, t.start) : '';
    const sentenceStart = /^[\s"'“‘(\[]*$/.test(lead);
    // 專有名詞：全大寫縮寫、句中大寫且不在 NGSL、句首大寫且字典查無此字
    const prev = tokens[ti - 1];
    const next = tokens[ti + 1];
    const gap = (a, b) => text.slice(a.end, b.start);
    const capWord = (x) => x && /^[A-Z]/.test(x.text) && x.text !== 'I';
    const hyphenAfterProper = prev && prev.proper && gap(prev, t) === '-';
    // 句中連續大寫字視為一個名稱（Executive Yuan、Premier Cho）
    const inNameChain = isCap && !sentenceStart && (
      (capWord(next) && /^ $/.test(gap(t, next))) ||
      (prev && prev.proper && capWord(prev) && /^ $/.test(gap(prev, t))));
    t.proper = t.text !== 'I' && (
      allCaps || t.text.includes('.') || hyphenAfterProper || inNameChain ||
      (isCap && !sentenceStart && t.rank === null) ||
      (isCap && sentenceStart && t.rank === null && !lex.lookup(t.lemma))
    );
    if (t.proper) {
      if (allCaps || t.text.includes('.')) { t.lemma = t.text.toLowerCase(); t.rank = null; } // US 不要變成 we
      continue;
    }

    counted++;
    lemmas.add(t.lemma);
    if (t.rank !== null) inNgsl++;
    if (t.rank !== null && t.rank <= level) known++;
    t.target = t.rank !== null && t.rank > level;
    if (t.target && !seenTarget.has(t.lemma)) {
      seenTarget.add(t.lemma);
      targets.push(t.lemma);
    }
  }

  const ngslCoverage = counted ? inNgsl / counted : 0;
  const knownCoverage = counted ? known / counted : 0;
  return {
    tokens,
    sentences,
    lemmas,
    targets,
    stats: {
      words: tokens.length,
      counted,
      ngslCoverage,
      knownCoverage,
      difficulty: difficultyOf(knownCoverage),
    },
  };
}

// 取出某個字所在的原句，以及該字在句中的位置（給複習卡粗體用）
export function sentenceFor(text, analysis, token) {
  const s = analysis.sentences[token.sent];
  return {
    sentence: text.slice(s.start, s.end),
    hlStart: token.start - s.start,
    hlEnd: token.end - s.start,
  };
}
