# 資料來源與授權

## NGSL 1.2 → `data/ngsl.json`
- New General Service List 1.2，作者 Charles Browne、Brent Culligan、Joseph Phillips
- 官方：https://www.newgeneralservicelist.com/
- 授權：CC BY-SA 4.0（https://creativecommons.org/licenses/by-sa/4.0/）
- 原始檔（`data/raw/ngsl/`）取自 GitHub 副本 https://github.com/Ryuya-dot-com/LexicalDiversity/tree/HEAD/data/ngsl ，
  並和另一個副本 Huangphoux/ay_gogh 比對過，排名內容一致。
  - `NGSL_1.2_stats.csv`：欄位 Lemma、SFI Rank、SFI、Adjusted Frequency per Million (U)，2,809 個詞頭
    SHA-256 `2098bab8955a120a9766c6282a51d7d578c6cb0a7d946600d2ffb73ba25a0b44`
  - `NGSL_1.2_lemmatized_for_research.csv`：每行「詞頭,字形,字形…」
    SHA-256 `d814f2a0a3c61479a2c5ad037661719a0cc6e7dbcde31f181b54f12d0f1e11a4`
  - `NGSL_1.2_with_English_definitions.csv`：每行「詞頭:英英定義」（學習者定義），
    取自 https://github.com/Huangphoux/ay_gogh/tree/HEAD/read/ngsl ，並和 tomovicj/spelly 的 JSON 版比對過一致
    SHA-256 `27ff5d3dc9b9174e3b788d218298ad284326b1552378680e6a2c34071acf864d`
- 注意：antdurrant/word.lists 套件裡的是 NGSL **1.01**，所以沒有採用。
- 修改：轉小寫、整理成 JSON；官方註明的同形字 found、left、mine、rose、wound
  預設對應較常用的原形（如 rose → rise），wound 例外保留。
- `data/ngsl.json` 是 NGSL 的衍生作品，同樣以 CC BY-SA 4.0 授權。

## 英英／中文解釋 → `data/dict.json`、`data/dict-zh.json`
- `dict.json`：音標＋英英解釋。NGSL 字用 NGSL 學習者定義（CC BY-SA 4.0），其他字用 ECDICT 的
  `definition` 欄（源自 WordNet，Princeton University，WordNet License），最多 2 行。
- `dict-zh.json`：中文解釋，只有使用者按「中文」時才下載。

## ECDICT
- https://github.com/skywind3000/ECDICT ，MIT License，Copyright (c) 2025 Linwei
- 修改：只保留 NGSL 字與詞頻（frq 或 bnc）前 20,000 的常見字；每字最多 3 行解釋；
  去掉 [网络] 等標註行；用 OpenCC（s2twp，Apache 2.0）轉成台灣繁體；
  `forms` 欄位來自 ECDICT 的 exchange 變化形資料。`online` 改用 `on-line` 條目的解釋。

## 重新建置
```
pip install opencc-python-reimplemented
python3 scripts/build_data.py            # 會自動下載 ECDICT 到 /tmp
```

## 每日新聞 → `data/news/`
政府資料開放授權條款－第1版（https://data.gov.tw/license），只使用文字、不使用照片：
- 行政院，行政院英文網新聞稿：https://data.gov.tw/dataset/9500
  （資料：https://www.ey.gov.tw/NewOpenData/JSON/157）
- 外交部，外交部全球資訊網-英文版-最新消息(News and Events)：https://data.gov.tw/dataset/86238
  （資料：https://en.mofa.gov.tw/OpenData.aspx?SN=07564A7F01D47BAD）

`scripts/fetch_news.mjs` 由 GitHub Actions 每天台灣時間 07:17 執行：下載 → 清理 HTML → 存成
`data/news/items/<id>.json`（含顯名）→ 重建 `data/news/index.json`（最近 90 天，含各程度難度）。
不採用的來源：中央社 Focus Taiwan、Taipei Times（有著作權）、Taiwan Today（常轉載其他媒體）。
