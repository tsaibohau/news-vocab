// 整個 App 共用的狀態（字表在 main.js 載入後放進來）
import * as db from './db.js';
import { today } from './clock.js';
import { dueWords } from './actions.js';

export const app = { lex: null, level: 1000 };

export async function setLevel(level) {
  app.level = level;
  await db.setMeta('level', level);
}

export async function refreshBadge() {
  const n = (await dueWords(db, today())).length;
  const b = document.getElementById('dueBadge');
  b.textContent = n;
  b.hidden = n === 0;
}
