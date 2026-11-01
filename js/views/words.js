import * as db from '../db.js';
import { app, refreshBadge } from '../state.js';
import { today } from '../clock.js';
import { esc, openSheet, closeSheet, speak, defsHtml, highlightSentence, relDay, toast } from '../ui.js';
import { statusOf } from '../srs.js';
import { ENCOUNTER_GOAL } from '../encounters.js';

export default async function words(main) {
  const list = (await db.getAll('words')).sort((a, b) => a.due.localeCompare(b.due) || a.lemma.localeCompare(b.lemma));
  const t = today();
  const firstLine = (lemma) => {
    const e = app.lex.lookup(lemma);
    return e ? e[1].split('\n')[0] : '';
  };
  main.innerHTML = `
    <h1>單字本（${list.length}）</h1>
    <div class="card">${list.length ? `<ul class="list">${list.map((w) => {
      const st = statusOf(w);
      const pct = Math.min(100, Math.round((w.encounters / ENCOUNTER_GOAL) * 100));
      return `<li><div class="item" data-lemma="${esc(w.lemma)}">
        <div class="row spread"><span class="item-title">${esc(w.lemma)}</span><span class="tag ${st.key}">${st.label}</span></div>
        <div class="small muted">${esc(firstLine(w.lemma))}</div>
        <div class="row spread small muted"><span>下次複習：${relDay(w.due, t)}</span><span>遇見 ${w.encounters}/${ENCOUNTER_GOAL}</span></div>
        <div class="bar"><i style="width:${pct}%"></i></div>
      </div></li>`;
    }).join('')}</ul>` : '<p class="muted">還沒有收藏的字。讀文章時點字，按「加入複習」。</p>'}</div>`;

  main.querySelector('.list')?.addEventListener('click', (e) => {
    const item = e.target.closest('.item');
    if (!item) return;
    const w = list.find((x) => x.lemma === item.dataset.lemma);
    const entry = app.lex.lookup(w.lemma);
    const body = openSheet(`
      <div class="word-head"><span class="lemma">${esc(w.lemma)}</span>
        ${entry?.[0] ? `<span class="phon">/${esc(entry[0])}/</span>` : ''}
        <button class="secondary" id="say" aria-label="發音">🔊</button></div>
      ${defsHtml(entry)}
      <div class="quote">${highlightSentence(w)}</div>
      <p class="small muted">${w.articleTitle ? `出自：${esc(w.articleTitle)}<br>` : ''}
        收藏於 ${w.addedAt}・複習 ${w.reviews} 次・忘記 ${w.lapses} 次<br>
        下次複習：${relDay(w.due, t)}・遇見 ${w.encounters}/${ENCOUNTER_GOAL} 次</p>
      <button class="danger block" id="del">從單字本刪除</button>`);
    body.querySelector('#say').onclick = () => speak(w.lemma);
    body.querySelector('#del').onclick = async () => {
      if (!confirm(`確定刪除「${w.lemma}」？`)) return;
      await db.del('words', w.lemma);
      closeSheet();
      toast('已刪除');
      refreshBadge();
      words(main);
    };
  });
}
