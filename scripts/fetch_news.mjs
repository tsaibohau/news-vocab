#!/usr/bin/env node
// 每日新聞：下載政府開放資料的英文新聞 → 存成 data/news/items/<id>.json
// → 重建 data/news/index.json（最近 90 天，含各程度難度）。
// 用法：node scripts/fetch_news.mjs [--offline 目錄]（--offline 用本機檔案測試）
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { SOURCES, LICENSE, attributionFor } from './news/sources.mjs';
import { cleanEy, cleanHtml, decodeEntities, rocToIso, rssDateToTaipei, parseRss } from './news/clean.mjs';
import { createLexicon } from '../js/text/lemmatize.js';
import { analyze, LEVELS } from '../js/text/analyze.js';
import { addDays } from '../js/clock.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const NEWS = path.join(ROOT, 'data', 'news');
const ITEMS = path.join(NEWS, 'items');
const KEEP_DAYS = 90;
const MIN_WORDS = 80;

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const todayTaipei = () => new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
const idFor = (source, url) => `${source}-${crypto.createHash('sha1').update(url).digest('hex').slice(0, 10)}`;

async function download(url, offlineFile) {
  if (offlineFile) return fs.readFileSync(offlineFile, 'utf8');
  const res = await fetch(url, { headers: { 'User-Agent': 'news-vocab (https://github.com/tsaibohau/news-vocab)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.text()).replace(/^﻿/, '');
}

function parseSource(key, raw) {
  const s = SOURCES[key];
  if (s.format === 'ey-json') {
    return JSON.parse(raw).map((x) => ({
      title: decodeEntities(x['標題'] || '').trim(),
      url: (x['來源網址'] || '').trim(),
      date: rocToIso(x['上版日期']),
      text: cleanEy(x['內容'] || ''),
    }));
  }
  return parseRss(raw).map((x) => ({
    title: decodeEntities(x.title).trim(),
    url: x.link,
    date: rssDateToTaipei(x.pubDate),
    text: cleanHtml(x.description),
  }));
}

async function main() {
  const offlineDir = process.argv.includes('--offline') ? process.argv[process.argv.indexOf('--offline') + 1] : null;
  const today = todayTaipei();
  const cutoff = addDays(today, -KEEP_DAYS);
  fs.mkdirSync(ITEMS, { recursive: true });

  let added = 0;
  const failures = [];
  for (const key of Object.keys(SOURCES)) {
    let list;
    try {
      const raw = await download(SOURCES[key].feed, offlineDir && path.join(offlineDir, `${key}.txt`));
      list = parseSource(key, raw);
    } catch (e) {
      failures.push(`${key}: ${e.message}`);
      continue;
    }
    for (const a of list) {
      if (!a.url || !a.title || !a.date || a.date < cutoff) continue;
      if (a.text.split(/\s+/).length < MIN_WORDS) continue;
      const id = idFor(key, a.url);
      const file = path.join(ITEMS, `${id}.json`);
      if (fs.existsSync(file)) continue;
      const item = { id, source: key, title: a.title, url: a.url, date: a.date, text: a.text,
        attribution: attributionFor(key, a.date.slice(0, 4)) };
      fs.writeFileSync(file, JSON.stringify(item, null, 1) + '\n');
      added++;
    }
  }

  // 重建索引（難度用和 App 相同的分析程式）
  const lex = createLexicon(readJson(path.join(ROOT, 'data/ngsl.json')), readJson(path.join(ROOT, 'data/dict.json')));
  const index = [];
  for (const f of fs.readdirSync(ITEMS).filter((n) => n.endsWith('.json'))) {
    const item = readJson(path.join(ITEMS, f));
    if (item.date < cutoff) continue;
    const known = {};
    let base;
    for (const level of LEVELS) {
      base = analyze(item.text, lex, level).stats;
      known[level] = Math.round(base.knownCoverage * 1000) / 10;
    }
    index.push({ id: item.id, source: item.source, title: item.title, date: item.date,
      words: base.words, ngsl: Math.round(base.ngslCoverage * 1000) / 10, known });
  }
  index.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));
  const sources = Object.fromEntries(Object.entries(SOURCES).map(([k, s]) => [k,
    { provider: s.provider, providerZh: s.providerZh, dataset: s.dataset, datasetZh: s.datasetZh, datasetUrl: s.datasetUrl }]));
  const out = { license: LICENSE, keepDays: KEEP_DAYS, sources, items: index };
  const indexFile = path.join(NEWS, 'index.json');
  const old = fs.existsSync(indexFile) ? fs.readFileSync(indexFile, 'utf8') : '';
  const next = JSON.stringify(out, null, 1) + '\n';
  if (old !== next) fs.writeFileSync(indexFile, next);

  console.log(`新增 ${added} 篇，索引 ${index.length} 篇（${cutoff} 之後）`);
  if (failures.length) {
    console.error(`下載失敗：\n${failures.join('\n')}`);
    if (failures.length === Object.keys(SOURCES).length) process.exit(1);
  }
}

main();
