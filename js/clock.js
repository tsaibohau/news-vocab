// 「今天」的唯一來源。開發用的「跳到明天」只是在這裡加天數位移。
const KEY = 'devDayOffset';

export function dayOffset() {
  try { return Number(localStorage.getItem(KEY)) || 0; } catch { return 0; }
}

export function setDayOffset(n) {
  try { localStorage.setItem(KEY, String(n)); } catch { /* 無 localStorage 時忽略 */ }
}

export function localDateStr(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function daysBetween(from, to) {
  const t = (s) => Date.UTC(...s.split('-').map((v, i) => (i === 1 ? v - 1 : +v)));
  return Math.round((t(to) - t(from)) / 86400000);
}

export function today() {
  return addDays(localDateStr(), dayOffset());
}
