import * as db from '../db.js';
import { app, setLevel, refreshBadge } from '../state.js';
import { today, localDateStr, dayOffset, setDayOffset } from '../clock.js';
import { toast } from '../ui.js';
import { exportData, validateBackup } from '../actions.js';
import { LEVELS } from '../text/analyze.js';

export default async function settings(main) {
  const offset = dayOffset();
  main.innerHTML = `
    <h1>設定</h1>
    <div class="card">
      <label for="level">我的程度（這些字算已認識）</label>
      <select id="level">${LEVELS.map((l) => `<option value="${l}"${l === app.level ? ' selected' : ''}>NGSL 前 ${l} 字</option>`).join('')}</select>
      <p class="muted small">排名在你的程度之後的 NGSL 字會畫底線。</p>
    </div>
    <div class="card">
      <h2 style="margin-top:0">備份</h2>
      <p class="muted small">資料只存在這個瀏覽器。換手機或清除瀏覽器資料前，請先匯出。</p>
      <button class="block" id="export">匯出 JSON 備份</button>
      <label class="btn secondary block" style="color:var(--accent)">匯入 JSON 備份
        <input type="file" id="import" accept="application/json,.json" hidden></label>
    </div>
    <div class="card dev">
      <h2 style="margin-top:0">開發測試用</h2>
      <p class="small">App 的今天：<b>${today()}</b>${offset ? `（實際 ${localDateStr()}，已往後 ${offset} 天）` : ''}</p>
      <div class="row"><button id="tomorrow">跳到明天</button>
      ${offset ? '<button class="secondary" id="reset">回到實際日期</button>' : ''}</div>
    </div>
    <div class="card"><a href="#/about">授權與出處 →</a></div>`;

  main.querySelector('#level').onchange = async (e) => {
    await setLevel(Number(e.target.value));
    toast('已更新程度');
  };

  main.querySelector('#tomorrow').onclick = () => {
    setDayOffset(offset + 1);
    toast(`現在是 ${today()}`);
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
    toast(`已匯出 ${data.words.length} 個字、${data.articles.length} 篇文章`);
  };

  main.querySelector('#import').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = validateBackup(JSON.parse(await file.text()));
      if (!confirm(`備份裡有 ${data.words.length} 個字、${data.articles.length} 篇文章。\n匯入會取代目前所有資料，確定嗎？`)) return;
      await db.replaceAll({ articles: data.articles, words: data.words, meta: data.meta || [] });
      app.level = await db.getMeta('level', 1000);
      toast('匯入完成');
      refreshBadge();
      settings(main);
    } catch (err) {
      toast(`匯入失敗：${err.message}`, 4000);
    } finally {
      e.target.value = '';
    }
  };
}
