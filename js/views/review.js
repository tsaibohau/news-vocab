import * as db from '../db.js';
import { app, refreshBadge } from '../state.js';
import { today } from '../clock.js';
import { esc, speak, defsHtml, highlightSentence, relDay } from '../ui.js';
import { dueWords, gradeWord } from '../actions.js';
import { previewLabel } from '../srs.js';

export default async function review(main) {
  const queue = await dueWords(db, today());
  let done = 0;

  async function next() {
    if (!queue.length) {
      const all = await db.getAll('words');
      const upcoming = all.map((w) => w.due).sort()[0];
      main.innerHTML = `<div class="card center pad">
        <h1>${done ? '今天複習完成 🎉' : '目前沒有要複習的字'}</h1>
        ${done ? `<p>這次複習了 ${done} 張。</p>` : ''}
        ${upcoming ? `<p class="muted">下一次複習：${relDay(upcoming, today())}</p>` : '<p class="muted">到文章裡點字，按「加入複習」。</p>'}
        <a class="btn secondary" href="#/">去讀文章</a></div>`;
      refreshBadge();
      return;
    }
    const word = queue[0];
    main.innerHTML = `
      <p class="muted small">剩 ${queue.length} 張</p>
      <div class="card review-card">
        <div class="quote">${highlightSentence(word)}</div>
        ${word.articleTitle ? `<p class="muted small">— ${esc(word.articleTitle)}</p>` : ''}
        <div id="answer" hidden></div>
      </div>
      <button class="block" id="show">顯示答案</button>
      <div class="grades" id="grades" hidden>
        ${['forgot', 'fuzzy', 'remember'].map((g) => `<button class="g-${g}" data-g="${g}">
          ${{ forgot: '忘了', fuzzy: '模糊', remember: '記得' }[g]}<small>${previewLabel(word, g)}</small></button>`).join('')}
      </div>`;

    main.querySelector('#show').onclick = () => {
      const entry = app.lex.lookup(word.lemma);
      const ans = main.querySelector('#answer');
      ans.innerHTML = `<hr style="border:0;border-top:1px solid var(--line);margin:14px 0">
        <div class="word-head"><span class="lemma">${esc(word.lemma)}</span>
        ${entry?.[0] ? `<span class="phon">/${esc(entry[0])}/</span>` : ''}
        <button class="secondary" id="say" aria-label="發音">🔊</button></div>
        ${defsHtml(entry)}`;
      ans.hidden = false;
      ans.querySelector('#say').onclick = () => speak(word.lemma);
      main.querySelector('#show').hidden = true;
      main.querySelector('#grades').hidden = false;
    };

    main.querySelector('#grades').onclick = async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const updated = await gradeWord(db, word, btn.dataset.g, today());
      queue.shift();
      done++;
      if (updated.due <= today()) queue.push(updated); // 忘了：這輪最後再出現一次
      next();
    };
  }
  next();
}
