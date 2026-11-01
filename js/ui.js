// 共用的小工具：跳脫 HTML、提示、底部彈出、發音、日期文字、字的解釋區塊
import { daysBetween } from './clock.js';
import { t, lang, alwaysZh } from './i18n.js';
import { zhOf } from './zh.js';
import { app } from './state.js';

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
  if (!('speechSynthesis' in window)) { toast(t('noSpeech')); return; }
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
  if (n < 0) return t('overdue', -n);
  if (n === 0) return t('today');
  if (n === 1) return t('tomorrowDay');
  return t('daysLater', n, date.slice(5).replace('-', '/'));
}

const ZH_POS = {
  n: '名詞', v: '動詞', vt: '及物動詞', vi: '不及物動詞', a: '形容詞', adj: '形容詞', s: '形容詞',
  ad: '副詞', adv: '副詞', prep: '介系詞', conj: '連接詞', pron: '代名詞', num: '數詞',
  art: '冠詞', int: '感嘆詞', interj: '感嘆詞', aux: '助動詞', abbr: '縮寫', pl: '複數',
};
const EN_POS = { 'n.': 'noun', 'v.': 'verb', 'adj.': 'adjective', 'adv.': 'adverb' };

function englishHtml(en) {
  if (!en) return `<p class="muted">${esc(t('noEnglishDef'))}</p>`;
  return '<div class="defs">' + en.split('\n').map((line) => {
    const m = line.match(/^(n\.|v\.|adj\.|adv\.) (.*)$/);
    return m ? `<span class="pos" title="${EN_POS[m[1]]}">${m[1]}</span>${esc(m[2])}` : esc(line);
  }).join('\n') + '</div>';
}

function chineseHtml(zh) {
  if (!zh) return `<p class="muted">${esc(t('noDef'))}</p>`;
  return '<div class="defs zh">' + zh.split('\n').map((line) => {
    const m = line.match(/^([a-z]+)\.\s*(.*)$/);
    return m && ZH_POS[m[1]] ? `<span class="pos">${esc(m[1])}. ${ZH_POS[m[1]]}</span>${esc(m[2])}` : esc(line);
  }).join('\n') + '</div>';
}

// 字的解釋區塊：英英為主，中文按鈕（或設定為永遠顯示）
export function wordInfoHtml(lemma, { surface } = {}) {
  const entry = app.lex.lookup(lemma);
  const rank = app.lex.rankOf(lemma);
  const meta = [];
  if (surface && surface.toLowerCase() !== lemma) meta.push(t('fromText', surface));
  meta.push(rank ? t('ngslRank', rank) : t('notInNgsl'));
  return `
    <div class="word-head">
      <span class="lemma" lang="en">${esc(lemma)}</span>
      ${entry?.[0] ? `<span class="phon">/${esc(entry[0])}/</span>` : ''}
      <button class="secondary say" aria-label="${esc(t('speak'))}">🔊</button>
    </div>
    <div class="small muted">${esc(meta.join(' · '))}</div>
    <div lang="en">${englishHtml(entry?.[1])}</div>
    <div class="zh-box" hidden></div>
    <button class="secondary zh-toggle small-btn">${esc(t('showChinese'))}</button>`;
}

export function bindWordInfo(root, lemma) {
  root.querySelector('.say').onclick = () => speak(lemma);
  const box = root.querySelector('.zh-box');
  const btn = root.querySelector('.zh-toggle');
  const show = async () => {
    try {
      box.innerHTML = chineseHtml(await zhOf(lemma));
    } catch {
      box.innerHTML = `<p class="muted">${esc(t('error', 'zh'))}</p>`;
    }
    box.hidden = false;
    btn.textContent = t('hideChinese');
  };
  btn.onclick = () => {
    if (box.hidden) show();
    else { box.hidden = true; btn.textContent = t('showChinese'); }
  };
  if (alwaysZh()) show();
}

export function highlightSentence(word) {
  const s = word.sentence || '';
  return esc(s.slice(0, word.hlStart)) + '<b>' + esc(s.slice(word.hlStart, word.hlEnd)) + '</b>' + esc(s.slice(word.hlEnd));
}

export const diffLabel = (key) => t(`diff_${key}`);

// 依介面語言更新標題列與底部分頁
export function applyChrome() {
  document.documentElement.lang = lang() === 'zh' ? 'zh-Hant' : 'en';
  document.title = t('appName');
  document.querySelector('.brand').textContent = t('appName');
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
}
