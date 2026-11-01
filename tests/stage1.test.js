// 第 1 階段整合測試：貼文章 → 標字 → 收藏 → 複習排程 → 遇見次數
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createLexicon } from '../js/text/lemmatize.js';
import { analyze } from '../js/text/analyze.js';
import { splitSentences } from '../js/text/tokenize.js';
import { addDays } from '../js/clock.js';
import { saveArticle, collectWord, gradeWord, dueWords, exportData, validateBackup } from '../js/actions.js';
import { memoryStore } from './memory-store.js';

const load = (p) => JSON.parse(fs.readFileSync(new URL(p, import.meta.url)));
const lex = createLexicon(load('../data/ngsl.json'), load('../data/dict.json'));

const ARTICLE_1 = `Taiwan to strengthen energy resilience

TAIPEI (CNA) The Executive Yuan said on Monday that the government will strengthen the country's energy resilience. Officials were studying new policies, and exports rose 12.5 percent last year.
"We aren't worried," Premier Cho said. The U.S. has imposed tariffs on many countries.`;

const ARTICLE_2 = `Exports keep growing. The ministry will strengthen support for small firms, and it will strengthen it again next year.`;
const ARTICLE_3 = `The weather was nice and people went to the park.`;

const D0 = '2026-11-01';

test('詞形還原：規則與 NGSL 字形', () => {
  const cases = { studying: 'study', policies: 'policy', rose: 'rise', "isn't": 'be', "aren't": 'be',
    "won't": 'will', imposed: 'impose', exports: 'export', tariffs: 'tariff', "country's": 'country',
    better: 'good', children: 'child', went: 'go' };
  for (const [w, l] of Object.entries(cases)) assert.equal(lex.lemmatize(w), l, w);
});

test('斷句：U.S. 與 Mr. 不會切斷句子', () => {
  const t = 'Mr. Lee met U.S. officials. They talked.';
  assert.deepEqual(splitSentences(t).map((s) => t.slice(s.start, s.end)),
    ['Mr. Lee met U.S. officials.', 'They talked.']);
});

test('完整流程：標字、收藏、複習排程、遇見次數', async () => {
  const store = memoryStore();

  // 1. 貼上文章、分析
  const { article: a1, encountered: e1 } = await saveArticle(store, lex,
    { title: '能源韌性', url: 'https://example.com/a', text: ARTICLE_1 }, D0, 'a1');
  assert.deepEqual(e1, []);
  const an = analyze(a1.text, lex, 1000);

  // 2. 標字：程度 1000 時，排名 > 1000 的 NGSL 字才畫底線
  assert.ok(an.targets.includes('strengthen'));  // #2552
  assert.ok(an.targets.includes('impose'));      // #1723
  assert.ok(!an.targets.includes('government')); // #216，已知
  assert.ok(!an.targets.includes('rise'));       // rose → rise #462
  assert.ok(!an.targets.includes('resilience')); // 不在 NGSL，不打斷閱讀
  const proper = an.tokens.filter((t) => t.proper).map((t) => t.text);
  for (const p of ['TAIPEI', 'CNA', 'Executive', 'Yuan', 'Monday', 'Cho', 'U.S.']) assert.ok(proper.includes(p), p);
  assert.ok(an.tokens.every((t) => !t.target || t.rank > 1000));
  // 換成程度 2500 時 strengthen 仍是目標字，impose 不是
  const an2500 = analyze(a1.text, lex, 2500);
  assert.ok(an2500.targets.includes('strengthen') && !an2500.targets.includes('impose'));
  assert.ok(an.stats.ngslCoverage > 0.8 && an.stats.ngslCoverage <= 1);
  assert.ok(an.stats.knownCoverage < an.stats.ngslCoverage);

  // 3. 收藏：存下原句與粗體位置
  const tok = an.tokens.filter((t) => t.lemma === 'strengthen')[1]; // 內文那次，不是標題
  const w = await collectWord(store, a1, an, tok, D0);
  assert.equal(w.sentence, "TAIPEI (CNA) The Executive Yuan said on Monday that the government will strengthen the country's energy resilience.");
  assert.equal(w.sentence.slice(w.hlStart, w.hlEnd), 'strengthen');
  assert.equal(w.encounters, 1);
  assert.equal(w.due, D0);
  const imposeTok = an.tokens.find((t) => t.text === 'imposed');
  const w2 = await collectWord(store, a1, an, imposeTok, D0);
  assert.equal(w2.lemma, 'impose');
  assert.equal(w2.sentence.slice(w2.hlStart, w2.hlEnd), 'imposed');
  assert.equal((await dueWords(store, D0)).length, 2);

  // 4. 複習排程：記得 → 1、3、7、16、35 天，之後維持 35 天
  let cur = w;
  let day = D0;
  const gaps = [];
  for (let i = 0; i < 6; i++) {
    cur = await gradeWord(store, cur, 'remember', day);
    gaps.push(cur.due);
    day = cur.due;
  }
  let d = D0;
  const expect = [1, 3, 7, 16, 35, 35].map((n) => (d = addDays(d, n)));
  assert.deepEqual(gaps, expect);

  // 模糊 → 明天；階段不變
  const stepBefore = cur.step;
  cur = await gradeWord(store, cur, 'fuzzy', day);
  assert.equal(cur.due, addDays(day, 1));
  assert.equal(cur.step, stepBefore);
  // 忘了 → 今天重來，階段歸零；之後記得又從 1 天開始
  cur = await gradeWord(store, cur, 'forgot', day);
  assert.equal(cur.due, day);
  assert.equal(cur.step, 0);
  assert.ok((await dueWords(store, day)).some((x) => x.lemma === 'strengthen'));
  cur = await gradeWord(store, cur, 'remember', day);
  assert.equal(cur.due, addDays(day, 1));

  // 「跳到明天」：impose 今天沒複習，明天仍在待複習清單
  assert.ok((await dueWords(store, addDays(D0, 1))).some((x) => x.lemma === 'impose'));

  // 5. 遇見次數：之後的文章出現就 +1，同一篇只算一次
  const r2 = await saveArticle(store, lex, { title: '第二篇', url: '', text: ARTICLE_2 }, D0, 'a2');
  assert.deepEqual(r2.encountered, ['strengthen']); // 出現兩次也只算一次
  assert.equal((await store.get('words', 'strengthen')).encounters, 2);
  assert.equal((await store.get('words', 'impose')).encounters, 1);
  await saveArticle(store, lex, { title: '第三篇', url: '', text: ARTICLE_3 }, D0, 'a3');
  assert.equal((await store.get('words', 'strengthen')).encounters, 2);
  // 同一篇再處理一次不會重複累計
  await saveArticle(store, lex, { title: '第二篇', url: '', text: ARTICLE_2 }, D0, 'a2');
  assert.equal((await store.get('words', 'strengthen')).encounters, 2);

  // 6. 匯出／匯入格式
  const backup = validateBackup(JSON.parse(JSON.stringify(await exportData(store))));
  assert.equal(backup.words.length, 2);
  assert.equal(backup.articles.length, 3);
  assert.throws(() => validateBackup({ foo: 1 }));
});
