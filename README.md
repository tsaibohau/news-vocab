# 新聞學單字（news-vocab）

用英文新聞學單字的手機網頁 App。全部在瀏覽器裡運算，不用 AI、不花錢；
你貼上的文章只存在自己手機的瀏覽器（IndexedDB）。

網址：https://tsaibohau.github.io/news-vocab/

## 功能（第 1 階段）
貼文章 → 分析 NGSL 覆蓋率與難度 → 依程度畫出目標字 → 點字看中文、發音、加入複習 →
間隔複習（1、3、7、16、35 天）→ 之後的文章自動累計遇見次數（目標 12 次）→ 單字本 → JSON 備份。

## 結構
```
index.html, css/        畫面
js/text/                斷詞、詞形還原、分析（純函式，可在 Node 測試）
js/srs.js               複習排程
js/encounters.js        遇見次數
js/actions.js           寫入資料的動作（瀏覽器用 IndexedDB，測試用記憶體）
js/db.js                IndexedDB
js/views/               各頁面
data/                   字表與字典（來源見 data/SOURCES.md）
scripts/build_data.py   重建字表與字典
tests/                  npm test
```

## 開發
```
python3 -m http.server   # 開 http://localhost:8000
npm test
```
推到 `main` 後，GitHub Actions 會先跑測試，通過才部署到 GitHub Pages。

## 資料授權
NGSL 1.2（CC BY-SA 4.0）、ECDICT（MIT），詳見 `data/SOURCES.md` 與 App 內「授權與出處」頁。
