// 每日新聞的清理與顯名
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { cleanEy, cleanHtml, rocToIso, rssDateToTaipei, parseRss, decodeEntities } from '../scripts/news/clean.mjs';
import { attributionFor, SOURCES } from '../scripts/news/sources.mjs';

test('行政院：實體字元與黏在一起的段落', () => {
  const raw = 'Taiwan&rsquo;s premier said the plan works.The ministry agreed &mdash; and the U.S. too. Growth was 3.5%.Next year';
  assert.equal(cleanEy(raw), 'Taiwan’s premier said the plan works.\n\nThe ministry agreed — and the U.S. too. Growth was 3.5%.\n\nNext year');
});

test('外交部：去掉 HTML、日期行與編號', () => {
  const html = '<p id="isPasted">October 9, 2026&nbsp;&nbsp;</p><p>No. 503&nbsp;</p><p>&nbsp;</p><p style="x">First <b>para</b>.</p><p>&nbsp;</p><p>Second&nbsp;para.<img src="a.jpg"></p>';
  assert.equal(cleanHtml(html), 'First para.\n\nSecond para.');
});

test('日期轉換', () => {
  assert.equal(rocToIso('115-10-29'), '2026-10-29');
  assert.equal(rssDateToTaipei('Wed, 14 Oct 2026 20:00:00 GMT'), '2026-10-15');
});

test('RSS 解析', () => {
  const xml = '<rss><channel><item><title><![CDATA[A &amp; B]]></title><link>https://x.tw/a?n=1&amp;s=2</link><description><![CDATA[<p>Hi</p>]]></description><pubDate>Wed, 14 Oct 2026 08:57:00 GMT</pubDate></item></channel></rss>';
  const [it] = parseRss(xml);
  assert.equal(decodeEntities(it.title), 'A & B');
  assert.equal(it.link, 'https://x.tw/a?n=1&s=2');
  assert.equal(it.description, '<p>Hi</p>');
});

test('顯名包含機關、年份、資料集與授權條款', () => {
  for (const key of Object.keys(SOURCES)) {
    const a = attributionFor(key, '2026');
    assert.match(a.text, /2026/);
    assert.match(a.text, /Open Government Data License, version 1\.0/);
    assert.match(a.text, /data\.gov\.tw\/license/);
    assert.ok(a.text.includes(SOURCES[key].provider));
  }
});

test('新聞索引與文章檔一致', () => {
  const index = JSON.parse(fs.readFileSync(new URL('../data/news/index.json', import.meta.url)));
  assert.ok(index.items.length > 0);
  for (const it of index.items) {
    const item = JSON.parse(fs.readFileSync(new URL(`../data/news/items/${it.id}.json`, import.meta.url)));
    assert.equal(item.title, it.title);
    assert.ok(item.attribution.text.includes('Open Government Data License'));
    assert.ok(!/<[a-z][^>]*>/i.test(item.text), `含 HTML：${it.id}`);
    assert.ok(!/&[a-z]+;/.test(item.text), `含實體字元：${it.id}`);
  }
});
