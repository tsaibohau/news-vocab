#!/usr/bin/env python3
"""建置 data/ngsl.json 與 data/dict.json。

用法（在 repo 根目錄）：
    pip install opencc-python-reimplemented
    python3 scripts/build_data.py [ecdict.csv 路徑]

沒給 ECDICT 路徑時，會自動從 GitHub 下載到 /tmp（約 66MB，不進 repo）。
"""
import csv
import hashlib
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "data", "raw", "ngsl")
STATS = os.path.join(RAW, "NGSL_1.2_stats.csv")
FORMS = os.path.join(RAW, "NGSL_1.2_lemmatized_for_research.csv")
ECDICT_URL = "https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv"

# 原始檔的 SHA-256，確保來源沒變
SHA = {
    STATS: "2098bab8955a120a9766c6282a51d7d578c6cb0a7d946600d2ffb73ba25a0b44",
    FORMS: "d814f2a0a3c61479a2c5ad037661719a0cc6e7dbcde31f181b54f12d0f1e11a4",
}

COMMON_LIMIT = 20000  # ECDICT 詞頻（frq 或 bnc）前幾名算「常見字」
MAX_SENSES = 3        # 每個字最多留幾行解釋
WORD_RE = re.compile(r"^[a-z]+$")
# NGSL 字在 ECDICT 裡沒有可用中文時，改用這個拼法的條目
ALIASES = {"online": "on-line"}
KEEP_HEADWORD = {"wound"}


def sha256(path):
    with open(path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()


def build_ngsl():
    for path, digest in SHA.items():
        if sha256(path) != digest:
            sys.exit(f"SHA-256 不符：{path}")

    lemmas = []
    with open(STATS, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            lemmas.append((int(row["SFI Rank"]), row["Lemma"].strip().lower()))
    lemmas.sort()
    order = [w for _, w in lemmas]
    rank = {w: i + 1 for i, w in enumerate(order)}

    forms = {}
    with open(FORMS, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = [p.strip().lower() for p in line.split(",") if p.strip()]
            head = parts[0]
            if head not in rank:
                sys.exit(f"字形檔的詞頭不在排名表：{head}")
            for form in parts[1:]:
                if form == head:
                    continue
                if form in rank:
                    # NGSL 註明的同形字（found、left、mine、rose、wound）：
                    # 預設對應較常用的原形（rose → rise），wound 例外保留「傷口」
                    if form not in KEEP_HEADWORD and rank[head] < rank[form]:
                        forms[form] = head
                    continue
                old = forms.get(form)
                if old is None or rank[head] < rank[old]:
                    forms[form] = head  # 衝突時取較常用的詞頭（如 leaves → leave）
    return order, rank, forms


def clean_translation(text, cc):
    lines = []
    for line in text.replace("\\n", "\n").split("\n"):
        line = line.strip()
        if not line or line.startswith("["):  # 去掉 [网络]、[医] 等
            continue
        lines.append(line)
        if len(lines) >= MAX_SENSES:
            break
    return cc.convert("\n".join(lines))


def build_dict(path, rank, ngsl_forms):
    from opencc import OpenCC
    cc = OpenCC("s2twp")
    csv.field_size_limit(10**9)

    rows = {}
    alias_rows = {}
    wanted_alias = {v: k for k, v in ALIASES.items()}
    with open(path, encoding="utf-8") as f:
        for r in csv.DictReader(f):
            word = r["word"].strip()
            if word in wanted_alias:
                alias_rows[wanted_alias[word]] = r
            key = word.lower()
            if not WORD_RE.match(key):
                continue
            frq = int(r["frq"] or 0)
            bnc = int(r["bnc"] or 0)
            common = (0 < frq <= COMMON_LIMIT) or (0 < bnc <= COMMON_LIMIT)
            if not (common or key in rank or key in ngsl_forms):
                continue
            if not r["translation"].strip():
                continue
            # 同一字有大小寫兩種時，優先小寫那筆
            if key in rows and word != key:
                continue
            rows[key] = r

    for key, r in alias_rows.items():
        if key not in rows or not clean_translation(rows[key]["translation"], cc):
            rows[key] = r

    entries = {}
    extra_forms = {}
    for key, r in rows.items():
        trans = clean_translation(r["translation"], cc)
        if not trans:
            continue
        entries[key] = [r["phonetic"].strip(), trans]
    def add_form(form, lemma):
        form = form.strip().lower()
        if WORD_RE.match(form) and form != lemma and lemma in entries \
                and form not in rank and form not in ngsl_forms:
            extra_forms.setdefault(form, lemma)

    # exchange 欄位：p 過去式 d 過去分詞 i 現在分詞 3 第三人稱 s 複數 r 比較級 t 最高級
    # 0 表示「這個字是某原形的變化形」
    for key, r in rows.items():
        for item in r["exchange"].split("/"):
            if ":" not in item:
                continue
            kind, form = item.split(":", 1)
            if kind == "0":
                add_form(key, form.strip().lower())
            elif kind in "pdi3srt":
                add_form(form, key)
    # 本身是變化形的條目（例如 tariffs）就不必另存解釋
    for form in list(extra_forms) + [f for f in ngsl_forms if f not in rank]:
        entries.pop(form, None)
    return entries, extra_forms


def main():
    order, rank, forms = build_ngsl()
    path = sys.argv[1] if len(sys.argv) > 1 else "/tmp/ecdict.csv"
    if not os.path.exists(path):
        print("下載 ECDICT…")
        urllib.request.urlretrieve(ECDICT_URL, path)
    entries, extra_forms = build_dict(path, rank, forms)

    missing = [w for w in order if w not in entries]
    out = os.path.join(ROOT, "data")
    with open(os.path.join(out, "ngsl.json"), "w", encoding="utf-8") as f:
        json.dump({"version": "NGSL 1.2", "lemmas": order, "forms": forms},
                  f, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(out, "dict.json"), "w", encoding="utf-8") as f:
        json.dump({"source": "ECDICT (MIT)", "entries": entries, "forms": extra_forms},
                  f, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    print(f"NGSL 詞頭 {len(order)}，字形 {len(forms)}")
    print(f"字典 {len(entries)} 筆，額外字形 {len(extra_forms)}")
    print(f"NGSL 字沒有中文解釋：{len(missing)} {missing[:20]}")


if __name__ == "__main__":
    main()
