// 斷詞與斷句。只抓英文字母組成的字（可含 don't 這種撇號），數字和標點略過。
// U.S.、e.g. 這種帶點縮寫算一個字。
const WORD = /(?:[A-Za-z]\.){2,}|[A-Za-z]+(?:['’][A-Za-z]+)*/g;

export function tokenize(text) {
  const out = [];
  for (const m of text.matchAll(WORD)) {
    out.push({ text: m[0], start: m.index, end: m.index + m[0].length });
  }
  return out;
}

// 句點後面接這些字時不算句子結束
const ABBR = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'st', 'jr', 'sr', 'vs', 'etc', 'inc', 'co', 'ltd', 'corp',
  'no', 'gen', 'gov', 'sen', 'rep', 'lt', 'col', 'capt', 'sgt', 'jan', 'feb', 'mar', 'apr',
  'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec', 'e.g', 'i.e', 'u.s', 'u.k', 'u.n',
  'a.m', 'p.m', 'approx', 'dept', 'est', 'fig', 'mt',
]);

// 回傳每句的 {start, end}（end 不含）
export function splitSentences(text) {
  const sentences = [];
  let start = 0;
  const push = (end) => {
    const s = text.slice(start, end);
    const lead = s.length - s.trimStart().length;
    const trail = s.length - s.trimEnd().length;
    if (s.trim()) sentences.push({ start: start + lead, end: end - trail });
    start = end;
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\n') { push(i + 1); continue; }
    if (ch !== '.' && ch !== '!' && ch !== '?') continue;
    let j = i + 1;
    while (j < text.length && /["'”’)\]]/.test(text[j])) j++;
    if (j < text.length && !/\s/.test(text[j])) continue; // 例如 3.5、U.S.A
    let k = j;
    while (k < text.length && /[ \t]/.test(text[k])) k++;
    if (k < text.length && text[k] !== '\n' && !/[A-Z0-9"“‘'(\[]/.test(text[k])) continue;
    if (ch === '.') {
      const before = text.slice(start, i).match(/([A-Za-z.]+)$/);
      const w = before ? before[1].toLowerCase() : '';
      if (ABBR.has(w) || /^[a-z]$/.test(w)) continue; // 縮寫或人名縮寫 J.
    }
    push(j);
  }
  push(text.length);
  return sentences;
}
