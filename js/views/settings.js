import * as db from '../db.js';
import { app, setLevel, refreshBadge } from '../state.js';
import { today, localDateStr, dayOffset, setDayOffset } from '../clock.js';
import { esc, toast } from '../ui.js';
import { t, lang, setLang, alwaysZh, setAlwaysZh } from '../i18n.js';
import { exportData, validateBackup } from '../actions.js';
import { LEVELS } from '../text/analyze.js';
import { applyChrome } from '../ui.js';

export default async function settings(main) {
  const offset = dayOffset();
  main.innerHTML = `
    <h1>${esc(t('settings'))}</h1>
    <div class="card">
      <label for="level">${esc(t('levelLabel'))}</label>
      <select id="level">${LEVELS.map((l) => `<option value="${l}"${l === app.level ? ' selected' : ''}>${esc(t('levelOption', l))}</option>`).join('')}</select>
      <p class="muted small">${esc(t('levelHelp'))}</p>
      <label for="lang">${esc(t('langLabel'))}</label>
      <select id="lang">
        <option value="en"${lang() === 'en' ? ' selected' : ''}>English</option>
        <option value="zh"${lang() === 'zh' ? ' selected' : ''}>中文</option>
      </select>
      <label class="row" style="color:var(--ink);margin-top:14px">
        <input type="checkbox" id="zh" style="width:auto"${alwaysZh() ? ' checked' : ''}> ${esc(t('zhLabel'))}</label>
      <p class="muted small">${esc(t('zhHelp'))}</p>
    </div>
    <div class="card">
      <h2 style="margin-top:0">${esc(t('backup'))}</h2>
      <p class="muted small">${esc(t('backupHelp'))}</p>
      <button class="block" id="export">${esc(t('exportJson'))}</button>
      <label class="btn secondary block" style="color:var(--accent)">${esc(t('importJson'))}
        <input type="file" id="import" accept="application/json,.json" hidden></label>
    </div>
    <div class="card dev">
      <h2 style="margin-top:0">${esc(t('devTools'))}</h2>
      <p class="small">${esc(t('appToday', today()))}${offset ? esc(t('realDate', localDateStr(), offset)) : ''}</p>
      <div class="row"><button id="tomorrow">${esc(t('jumpTomorrow'))}</button>
      ${offset ? `<button class="secondary" id="reset">${esc(t('resetDate'))}</button>` : ''}</div>
    </div>
    <div class="card"><a href="#/about">${esc(t('licenses'))}</a></div>`;

  main.querySelector('#level').onchange = async (e) => {
    await setLevel(Number(e.target.value));
    toast(t('levelUpdated'));
  };
  main.querySelector('#lang').onchange = (e) => {
    setLang(e.target.value);
    applyChrome();
    settings(main);
  };
  main.querySelector('#zh').onchange = (e) => setAlwaysZh(e.target.checked);

  main.querySelector('#tomorrow').onclick = () => {
    setDayOffset(offset + 1);
    toast(t('nowDate', today()));
    settings(main);
    refreshBadge();
  };
  main.querySelector('#reset')?.addEventListener('click', () => {
    setDayOffset(0);
    settings(main);
    refreshBadge();
  });

  main.querySelector('#export').onclick = async () => {
    const data = await exportData(db);
    const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `news-vocab-${localDateStr()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast(t('exported', data.words.length, data.articles.length));
  };

  main.querySelector('#import').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      let data;
      try { data = validateBackup(JSON.parse(await file.text())); } catch { throw new Error(t('notBackup')); }
      if (!confirm(t('confirmImport', data.words.length, data.articles.length))) return;
      await db.replaceAll({ articles: data.articles, words: data.words, meta: data.meta || [] });
      app.level = await db.getMeta('level', 1000);
      toast(t('imported'));
      refreshBadge();
      settings(main);
    } catch (err) {
      toast(t('importFailed', err.message), 4000);
    } finally {
      e.target.value = '';
    }
  };
}
