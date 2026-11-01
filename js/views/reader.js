import * as db from '../db.js';
import { app, setLevel, refreshBadge } from '../state.js';
import { today } from '../clock.js';
import { esc, toast, openSheet, closeSheet, speak, defsHtml } from '../ui.js';
import { analyze, LEVELS } from '../text/analyze.js';
import { collectWord } from '../actions.js';
import { ENCOUNTER_GOAL } from '../encounters.js';

export default async function reader(main, [id]) {
  const article = await db.get('articles', id);
  if (!article) { main.innerHTML = '<div class="card">找不到這篇文章。<a href="#/">回文章列表</a></div>'; return; }
  const saved = new Set((await db.getAll('words')).map((w) => w.lemma));
  let analysis;

  function renderArticle() {
    analysis = analyze(article.text, app.lex, app.level);
    const { tokens, stats, targets } = analysis;
    // 依原文切段，字包成可點的 span
    let html = '';
    let pos = 0;
    tokens.forEach((t, i) => {
      html += esc(article.text.slice(pos, t.start));
      const cls = ['w'];
      if (t.target) cls.push('t');
      if (!t.proper && saved.has(t.lemma)) cls.push('s');
      html += `<span class="${cls.join(' ')}" data-i="${i}">${esc(t.text)}</span>`;
      pos = t.end;
    });
    html += esc(article.text.slice(pos));
    const paragraphs = html.split(/\n\s*\n|\n/).filter((p) => p.trim()).map((p) => `<p>${p}</p>`).join('');

    main.querySelector('#stats').innerHTML = `
      <div><b>${stats.words}</b><span>字數</span></div>
      <div><b>${Math.round(stats.ngslCoverage * 100)}%</b><span>NGSL 覆蓋率</span></div>
      <div><b>${Math.round(stats.knownCoverage * 100)}%</b><span>已知字覆蓋率</span></div>`;
    main.querySelector('#diff').className = `tag ${stats.difficulty.key}`;
    main.querySelector('#diff').textContent = `難度：${stats.difficulty.label}`;
    main.querySelector('#article').innerHTML = paragraphs;
    main.querySelector('#targets').innerHTML = targets.length
      ? targets.map((l) => `<button class="chip${saved.has(l) ? ' s' : ''}" data-lemma="${esc(l)}">${esc(l)}</button>`).join('')
      : '<p class="muted">這個程度沒有目標字。</p>';
    main.querySelector('#targetCount').textContent = targets.length;
  }

  main.innerHTML = `
    <h1>${esc(article.title)}</h1>
    ${article.url ? `<p class="small"><a href="${esc(article.url)}" target="_blank" rel="noopener noreferrer">原文連結 ↗</a></p>` : ''}
    <div class="card">
      <div class="stats" id="stats"></div>
      <div class="row spread" style="margin-top:12px">
        <span id="diff"></span>
        <span class="row small">我的程度
          <select id="level">${LEVELS.map((l) => `<option value="${l}"${l === app.level ? ' selected' : ''}>NGSL 前 ${l}</option>`).join('')}</select>
        </span>
      </div>
      <p class="muted small" style="margin:8px 0 0">畫<span style="text-decoration:underline;text-decoration-color:var(--target);text-decoration-thickness:2px">底線</span>的是目標字，<span style="background:var(--saved)">黃底</span>是已收藏。任何字都可以點來查。</p>
    </div>
    <div class="card article" id="article"></div>
    <h2>目標字（<span id="targetCount"></span>）</h2>
    <div class="card chips" id="targets"></div>
    <button class="danger block" id="delArticle">刪除這篇文章</button>`;

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
    const i = analysis.tokens.findIndex((t) => t.lemma === chip.dataset.lemma && !t.proper);
    const span = main.querySelector(`.w[data-i="${i}"]`);
    span?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    showWord(analysis.tokens[i], span);
  };

  main.querySelector('#delArticle').onclick = async () => {
    if (!confirm('確定刪除這篇文章？（已收藏的字會保留）')) return;
    await db.del('articles', article.id);
    location.hash = '#/';
  };

  async function showWord(token, span) {
    main.querySelectorAll('.w.active').forEach((x) => x.classList.remove('active'));
    span?.classList.add('active');
    const entry = app.lex.lookup(token.lemma);
    const rank = app.lex.rankOf(token.lemma);
    const existing = await db.get('words', token.lemma);
    const body = openSheet(`
      <div class="word-head">
        <span class="lemma">${esc(token.lemma)}</span>
        ${entry?.[0] ? `<span class="phon">/${esc(entry[0])}/</span>` : ''}
        <button class="secondary" id="say" aria-label="發音">🔊</button>
      </div>
      <div class="small muted">${token.text.toLowerCase() !== token.lemma ? `原文：${esc(token.text)}・` : ''}${rank ? `NGSL 第 ${rank} 名` : '不在 NGSL 字表'}</div>
      ${defsHtml(entry)}
      <div id="collect"></div>`, () => span?.classList.remove('active'));

    body.querySelector('#say').onclick = () => speak(token.lemma);
    const box = body.querySelector('#collect');
    const showSaved = (w) => {
      box.innerHTML = `<p class="muted">✅ 已在單字本・遇見 ${w.encounters}/${ENCOUNTER_GOAL} 次</p>`;
    };
    if (existing) showSaved(existing);
    else {
      box.innerHTML = '<button class="block" id="add">＋ 加入複習</button>';
      box.querySelector('#add').onclick = async () => {
        const w = await collectWord(db, article, analysis, token, today());
        saved.add(w.lemma);
        main.querySelectorAll('.w').forEach((el) => {
          const t = analysis.tokens[Number(el.dataset.i)];
          if (!t.proper && t.lemma === w.lemma) el.classList.add('s');
        });
        main.querySelectorAll(`.chip[data-lemma="${CSS.escape(w.lemma)}"]`).forEach((c) => c.classList.add('s'));
        showSaved(w);
        toast(`已加入：${w.lemma}`);
        refreshBadge();
        setTimeout(closeSheet, 600);
      };
    }
  }
}
