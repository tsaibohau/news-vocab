// 共用的小工具：跳脫 HTML、提示、底部彈出、發音、日期文字
import { daysBetween } from './clock.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let toastTimer;
export function toast(msg, ms = 2500) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}

export function openSheet(html, onClose) {
  const sheet = document.getElementById('sheet');
  const body = sheet.querySelector('.sheet-body');
  body.innerHTML = html;
  sheet.hidden = false;
  sheet.querySelector('.sheet-backdrop').onclick = () => closeSheet();
  sheet._onClose = onClose;
  return body;
}

export function closeSheet() {
  const sheet = document.getElementById('sheet');
  if (sheet.hidden) return;
  sheet.hidden = true;
  sheet.querySelector('.sheet-body').innerHTML = '';
  sheet._onClose?.();
  sheet._onClose = null;
}

export function speak(text) {
  if (!('speechSynthesis' in window)) { toast('這個瀏覽器不支援發音'); return; }
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US';
  u.rate = 0.9;
  const voices = synth.getVoices();
  const v = voices.find((x) => /^en[-_]US/i.test(x.lang)) || voices.find((x) => /^en/i.test(x.lang));
  if (v) u.voice = v;
  synth.speak(u);
}
// 有些瀏覽器要先觸發一次才會載入語音清單
if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.getVoices();

export function relDay(date, today) {
  const n = daysBetween(today, date);
  if (n < 0) return `逾期 ${-n} 天`;
  if (n === 0) return '今天';
  if (n === 1) return '明天';
  return `${n} 天後（${date.slice(5).replace('-', '/')}）`;
}

const POS = {
  n: '名詞', v: '動詞', vt: '及物動詞', vi: '不及物動詞', a: '形容詞', adj: '形容詞', s: '形容詞',
  ad: '副詞', adv: '副詞', prep: '介系詞', conj: '連接詞', pron: '代名詞', num: '數詞',
  art: '冠詞', int: '感嘆詞', interj: '感嘆詞', aux: '助動詞', abbr: '縮寫', pl: '複數',
};

// 把 ECDICT 解釋「n. 經濟\nv. ...」拆成 [{pos, label, text}]
export function parseDefs(trans) {
  return trans.split('\n').map((line) => {
    const m = line.match(/^([a-z]+)\.\s*(.*)$/);
    if (m && POS[m[1]]) return { pos: m[1], label: POS[m[1]], text: m[2] };
    return { pos: '', label: '', text: line };
  });
}

export function defsHtml(entry) {
  if (!entry) return '<p class="muted">字典裡沒有這個字的解釋。</p>';
  return '<div class="defs">' + parseDefs(entry[1]).map((d) =>
    (d.label ? `<span class="pos">${esc(d.pos)}. ${esc(d.label)}</span>` : '') + esc(d.text)).join('\n') + '</div>';
}

export function highlightSentence(word) {
  const s = word.sentence || '';
  return esc(s.slice(0, word.hlStart)) + '<b>' + esc(s.slice(word.hlStart, word.hlEnd)) + '</b>' + esc(s.slice(word.hlEnd));
}
