import * as db from '../db.js';
import { app, refreshBadge } from '../state.js';
import { today } from '../clock.js';
import { esc, openSheet, closeSheet, highlightSentence, relDay, toast, wordInfoHtml, bindWordInfo } from '../ui.js';
import { t } from '../i18n.js';
import { statusOf } from '../srs.js';
import { ENCOUNTER_GOAL } from '../encounters.js';

const STATUS = { new: 'statusNew', learning: 'statusLearning', done: 'statusDone' };

export default async function words(main) {
  const list = (await db.getAll('words')).sort((a, b) => a.due.localeCompare(b.due) || a.lemma.localeCompare(b.lemma));
  const td = today();
  const firstLine = (lemma) => (app.lex.lookup(lemma)?.[1] || '').split('\n')[0];
  main.innerHTML = `
    <h1>${esc(t('wordBook', list.length))}</h1>
    <div class="card">${list.length ? `<ul class="list">${list.map((w) => {
      const st = statusOf(w);
      const pct = Math.min(100, Math.round((w.encounters / ENCOUNTER_GOAL) * 100));
      return `<li><div class="item" data-lemma="${esc(w.lemma)}">
        <div class="row spread"><span class="item-title" lang="en">${esc(w.lemma)}</span>
          <span class="tag ${st.key}">${esc(t(STATUS[st.key]))}${st.key === 'learning' ? ` ${st.dots}` : ''}</span></div>
        <div class="small muted" lang="en">${esc(firstLine(w.lemma))}</div>
        <div class="row spread small muted"><span>${esc(t('nextShort', relDay(w.due, td)))}</span><span>${esc(t('met', w.encounters, ENCOUNTER_GOAL))}</span></div>
        <div class="bar"><i style="width:${pct}%"></i></div>
      </div></li>`;
    }).join('')}</ul>` : `<p class="muted">${esc(t('noWords'))}</p>`}</div>`;

  main.querySelector('.list')?.addEventListener('click', (e) => {
    const item = e.target.closest('.item');
    if (!item) return;
    const w = list.find((x) => x.lemma === item.dataset.lemma);
    const body = openSheet(`
      ${wordInfoHtml(w.lemma)}
      <div class="quote" lang="en">${highlightSentence(w)}</div>
      <p class="small muted">${w.articleTitle ? `${esc(t('savedFrom', w.articleTitle))}<br>` : ''}
        ${esc(t('wordStats', w.addedAt, w.reviews, w.lapses))}<br>
        ${esc(t('nextShort', relDay(w.due, td)))} · ${esc(t('met', w.encounters, ENCOUNTER_GOAL))}</p>
      <button class="danger block" id="del">${esc(t('deleteWord'))}</button>`);
    bindWordInfo(body, w.lemma);
    body.querySelector('#del').onclick = async () => {
      if (!confirm(t('confirmDeleteWord', w.lemma))) return;
      await db.del('words', w.lemma);
      closeSheet();
      toast(t('deleted'));
      refreshBadge();
      words(main);
    };
  });
}
