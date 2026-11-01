import * as db from '../db.js';
import { refreshBadge } from '../state.js';
import { today } from '../clock.js';
import { esc, highlightSentence, relDay, wordInfoHtml, bindWordInfo } from '../ui.js';
import { t } from '../i18n.js';
import { dueWords, gradeWord } from '../actions.js';
import { previewDays } from '../srs.js';

const gradeHint = (word, g) => {
  const n = previewDays(word, g);
  return n === 0 ? t('again') : n === 1 ? t('tomorrow') : t('inDays', n);
};

export default async function review(main) {
  const queue = await dueWords(db, today());
  let done = 0;

  async function next() {
    if (!queue.length) {
      const all = await db.getAll('words');
      const upcoming = all.map((w) => w.due).sort()[0];
      main.innerHTML = `<div class="card center pad">
        <h1>${esc(done ? t('reviewDone') : t('nothingDue'))}</h1>
        ${done ? `<p>${esc(t('reviewedN', done))}</p>` : ''}
        <p class="muted">${esc(upcoming ? t('nextReview', relDay(upcoming, today())) : t('howToAdd'))}</p>
        <a class="btn secondary" href="#/">${esc(t('goRead'))}</a></div>`;
      refreshBadge();
      return;
    }
    const word = queue[0];
    main.innerHTML = `
      <p class="muted small">${esc(t('cardsLeft', queue.length))}</p>
      <div class="card review-card">
        <div class="quote" lang="en">${highlightSentence(word)}</div>
        ${word.articleTitle ? `<p class="muted small" lang="en">— ${esc(word.articleTitle)}</p>` : ''}
        <div id="answer" hidden></div>
      </div>
      <button class="block" id="show">${esc(t('showAnswer'))}</button>
      <div class="grades" id="grades" hidden>
        ${['forgot', 'fuzzy', 'remember'].map((g) => `<button class="g-${g}" data-g="${g}">
          ${esc(t(g))}<small>${esc(gradeHint(word, g))}</small></button>`).join('')}
      </div>`;

    main.querySelector('#show').onclick = () => {
      const ans = main.querySelector('#answer');
      ans.innerHTML = `<hr style="border:0;border-top:1px solid var(--line);margin:14px 0">${wordInfoHtml(word.lemma)}`;
      bindWordInfo(ans, word.lemma);
      ans.hidden = false;
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
