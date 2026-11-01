// 複習排程。日期一律用 'YYYY-MM-DD' 字串，由呼叫端傳入「今天」。
import { addDays } from './clock.js';

export const INTERVALS = [1, 3, 7, 16, 35];

export function isDue(word, today) {
  return word.due <= today;
}

// grade: 'forgot' | 'fuzzy' | 'remember'；回傳新的物件，不改原物件
export function grade(word, g, today) {
  const w = { ...word, reviews: (word.reviews || 0) + 1, lastReviewed: today };
  if (g === 'remember') {
    w.due = addDays(today, INTERVALS[Math.min(w.step, INTERVALS.length - 1)]);
    w.step = Math.min(w.step + 1, INTERVALS.length);
  } else if (g === 'fuzzy') {
    w.due = addDays(today, 1);
  } else if (g === 'forgot') {
    w.step = 0;
    w.due = today;
    w.lapses = (word.lapses || 0) + 1;
  } else {
    throw new Error(`未知的評分：${g}`);
  }
  return w;
}

// 按鈕上顯示的「下次」說明
export function previewLabel(word, g) {
  if (g === 'forgot') return '重來';
  if (g === 'fuzzy') return '明天';
  return `${INTERVALS[Math.min(word.step, INTERVALS.length - 1)]} 天後`;
}

export function statusOf(word) {
  if (!word.reviews) return { key: 'new', label: '新字' };
  if (word.step >= INTERVALS.length) return { key: 'done', label: '熟練' };
  return { key: 'learning', label: `學習中 ${'●'.repeat(word.step)}${'○'.repeat(INTERVALS.length - word.step)}` };
}
