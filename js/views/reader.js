import * as db from '../db.js';
import { app, setLevel, refreshBadge } from '../state.js';
import { today } from '../clock.js';
import { esc, toast, openSheet, closeSheet, wordInfoHtml, bindWordInfo, diffLabel } from '../ui.js';
import { t, lang } from '../i18n.js';
import { analyze, LEVELS } from '../text/analyze.js';
import { collectWord } from '../actions.js';
import { ENCOUNTER_GOAL } from '../encounters.js';

export default async function reader(main, [id]) {
  const article = await db.get('articles', id);
  if (!article) {
    main.innerHTML = `<div class="card">${esc(t('notFound'))} <a href="#/">${esc(t('backToList'))}</a></div>`;
    return;
  }
  const saved = new Set((await db.getAll('words')).map((w) => w.lemma));
  let analysis;

  function renderArticle() {
    analysis = analyze(article.text, app.lex, app.level);
    const { tokens, stats, targets } = analysis;
    // 依原文切段，字包成可點的 span
    let html = '';
    let pos = 0;
    tokens.forEach((tk, i) => {
      html += esc(article.text.slice(pos, tk.start));
      const cls = ['w'];
      if (tk.target) cls.push('t');
      if (!tk.proper && saved.has(tk.lemma)) cls.push('s');
      html += `<span class="${cls.join(' ')}" data-i="${i}">${esc(tk.text)}</span>`;
      pos = tk.end;
    });
    html += esc(article.text.slice(pos));
    const paragraphs = html.split(/\n\s*\n|\n/).filter((p) => p.trim()).map((p) => `<p>${p}</p>`).join('');

    main.querySelector('#stats').innerHTML = `
      <div><b>${stats.words}</b><span>${esc(t('statWords'))}</span></div>
      <div><b>${Math.round(stats.ngslCoverage * 100)}%</b><span>${esc(t('statNgsl'))}</span></div>
      <div><b>${Math.round(stats.knownCoverage * 100)}%</b><span>${esc(t('statKnown'))}</span></div>`;
    const diff = main.querySelector('#diff');
    diff.className = `tag ${stats.difficulty.key}`;
    diff.textContent = t('difficulty', diffLabel(stats.difficulty.key));
    main.querySelector('#article').innerHTML = paragraphs;
    main.querySelector('#targets').innerHTML = targets.length
      ? targets.map((l) => `<button class="chip${saved.has(l) ? ' s' : ''}" data-lemma="${esc(l)}">${esc(l)}</button>`).join('')
      : `<p class="muted">${esc(t('noTargets'))}</p>`;
    main.querySelector('#targetCount').textContent = targets.length;
  }

  const att = article.attribution;
  main.innerHTML = `
    <h1 lang="en">${esc(article.title)}</h1>
    ${article.url ? `<p class="small"><a href="${esc(article.url)}" target="_blank" rel="noopener noreferrer">${esc(t('original'))}</a>${article.newsDate ? ` · ${esc(article.newsDate)}` : ''}</p>` : ''}
    <div class="card">
      <div class="stats" id="stats"></div>
      <div class="row spread" style="margin-top:12px">
        <span id="diff"></span>
        <span class="row small">${esc(t('myLevel'))}
          <select id="level">${LEVELS.map((l) => `<option value="${l}"${l === app.level ? ' selected' : ''}>${esc(t('levelOption', l))}</option>`).join('')}</select>
        </span>
      </div>
      <p class="muted small" style="margin:8px 0 0">${esc(t('legend'))}</p>
    </div>
    <div class="card article" id="article" lang="en"></div>
    ${att ? `<p class="attrib">${esc(t('sourceLine'))}: ${esc(lang() === 'zh' ? att.textZh : att.text)}
      · <a href="${esc(att.datasetUrl)}" target="_blank" rel="noopener noreferrer">data.gov.tw</a></p>` : ''}
    <h2>${esc(t('targetWords'))} (<span id="targetCount"></span>)</h2>
    <div class="card chips" id="targets" lang="en"></div>
    <button class="danger block" id="delArticle">${esc(t('deleteArticle'))}</button>`;

  renderArticle();

  main.querySelector('#level').onchange = async (e) => {
    await setLevel(Number(e.target.value));
    renderArticle();
  };

  main.querySelector('#article').onclick = (e) => {
    const span = e.target.closest('.w');
    if (span) showWord(analysis.tokens[Number(span.dataset.i)], span);
  };
  main.querySelector('#targets').onclick = (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const i = analysis.tokens.findIndex((tk) => tk.lemma === chip.dataset.lemma && !tk.proper);
    const span = main.querySelector(`.w[data-i="${i}"]`);
    span?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    showWord(analysis.tokens[i], span);
  };

  main.querySelector('#delArticle').onclick = async () => {
    if (!confirm(t('confirmDeleteArticle'))) return;
    await db.del('articles', article.id);
    location.hash = '#/';
  };

  async function showWord(token, span) {
    main.querySelectorAll('.w.active').forEach((x) => x.classList.remove('active'));
    span?.classList.add('active');
    const existing = await db.get('words', token.lemma);
    const body = openSheet(`${wordInfoHtml(token.lemma, { surface: token.text })}<div id="collect"></div>`,
      () => span?.classList.remove('active'));
    bindWordInfo(body, token.lemma);

    const box = body.querySelector('#collect');
    const showSaved = (w) => { box.innerHTML = `<p class="muted">${esc(t('inWordBook', w.encounters, ENCOUNTER_GOAL))}</p>`; };
    if (existing) { showSaved(existing); return; }
    box.innerHTML = `<button class="block" id="add">${esc(t('addToReview'))}</button>`;
    box.querySelector('#add').onclick = async () => {
      const w = await collectWord(db, article, analysis, token, today());
      saved.add(w.lemma);
      main.querySelectorAll('.w').forEach((el) => {
        const tk = analysis.tokens[Number(el.dataset.i)];
        if (!tk.proper && tk.lemma === w.lemma) el.classList.add('s');
      });
      main.querySelectorAll(`.chip[data-lemma="${CSS.escape(w.lemma)}"]`).forEach((c) => c.classList.add('s'));
      showSaved(w);
      toast(t('added', w.lemma));
      refreshBadge();
      setTimeout(closeSheet, 600);
    };
  }
}
