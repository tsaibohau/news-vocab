import { lang } from '../i18n.js';

const MIT = `<pre style="white-space:pre-wrap">MIT License

Copyright (c) 2025 Linwei

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.</pre>`;

const EN = `
    <h1>Licenses and sources</h1>
    <div class="card">
      <h2 style="margin-top:0">Daily news</h2>
      <p>Daily news comes from two Taiwan government open datasets. Both are released under the
      <a href="https://data.gov.tw/license" target="_blank" rel="noopener">Open Government Data License, version 1.0</a>,
      which allows reuse and redistribution with attribution. Only the article text is used, no photos.</p>
      <ul class="small">
        <li>Executive Yuan, Executive Yuan English Website News Release —
          <a href="https://data.gov.tw/dataset/9500" target="_blank" rel="noopener">data.gov.tw/dataset/9500</a></li>
        <li>Ministry of Foreign Affairs, MOFA English Website News and Events —
          <a href="https://data.gov.tw/dataset/86238" target="_blank" rel="noopener">data.gov.tw/dataset/86238</a></li>
      </ul>
      <p class="small muted">Each article shows its source, year, dataset name and the license. Changes: HTML removed, paragraphs restored.</p>
    </div>
    <div class="card">
      <h2 style="margin-top:0">NGSL 1.2 (New General Service List)</h2>
      <p>By Charles Browne, Brent Culligan and Joseph Phillips.
      <a href="https://www.newgeneralservicelist.com/" target="_blank" rel="noopener">newgeneralservicelist.com</a>.
      License: <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>.</p>
      <p class="small muted">Files used: NGSL_1.2_stats.csv (ranks), NGSL_1.2_lemmatized_for_research.csv (word forms)
      and NGSL_1.2_with_English_definitions.csv (learner definitions), from the GitHub copies in
      Ryuya-dot-com/LexicalDiversity and Huangphoux/ay_gogh. Changes: lower-cased and converted to JSON; the homographs
      found, left, mine and rose map to the more common headword. The derived files are also CC BY-SA 4.0.</p>
    </div>
    <div class="card">
      <h2 style="margin-top:0">ECDICT</h2>
      <p>By skywind3000 (Linwei), <a href="https://github.com/skywind3000/ECDICT" target="_blank" rel="noopener">github.com/skywind3000/ECDICT</a>. MIT License.
      Its English definitions come from WordNet (Princeton University, WordNet License).</p>
      <p class="small muted">Changes: kept NGSL words and the 20,000 most common words; up to 2 English and 3 Chinese senses;
      Chinese converted to Taiwan Traditional with OpenCC (Apache 2.0).</p>
      <details class="small"><summary>MIT License</summary>${MIT}</details>
    </div>
    <div class="card">
      <h2 style="margin-top:0">Sound</h2>
      <p class="small">Pronunciation uses your browser's built-in speech (speechSynthesis).</p>
    </div>
    <div class="card">
      <h2 style="margin-top:0">Privacy</h2>
      <p class="small">Articles you paste and your word book stay in this browser (IndexedDB). Nothing is uploaded. No AI or paid services are used.</p>
    </div>`;

const ZH = `
    <h1>授權與出處</h1>
    <div class="card">
      <h2 style="margin-top:0">每日新聞</h2>
      <p>每日新聞來自兩個政府開放資料集，皆依
      <a href="https://data.gov.tw/license" target="_blank" rel="noopener">政府資料開放授權條款－第1版</a>
      釋出，標示出處即可再利用與散布。只使用文字，不使用照片。</p>
      <ul class="small">
        <li>行政院，行政院英文網新聞稿 —
          <a href="https://data.gov.tw/dataset/9500" target="_blank" rel="noopener">data.gov.tw/dataset/9500</a></li>
        <li>外交部，外交部全球資訊網-英文版-最新消息(News and Events) —
          <a href="https://data.gov.tw/dataset/86238" target="_blank" rel="noopener">data.gov.tw/dataset/86238</a></li>
      </ul>
      <p class="small muted">每篇文章都標示提供機關、年份、資料集名稱與授權條款。修改內容：去除 HTML、還原段落。</p>
    </div>
    <div class="card">
      <h2 style="margin-top:0">NGSL 1.2（New General Service List）</h2>
      <p>作者：Charles Browne、Brent Culligan、Joseph Phillips。
      <a href="https://www.newgeneralservicelist.com/" target="_blank" rel="noopener">newgeneralservicelist.com</a>。
      授權：<a href="https://creativecommons.org/licenses/by-sa/4.0/deed.zh-hant" target="_blank" rel="noopener">CC BY-SA 4.0</a></p>
      <p class="small muted">使用 NGSL_1.2_stats.csv（排名）、NGSL_1.2_lemmatized_for_research.csv（字形）、
      NGSL_1.2_with_English_definitions.csv（英英定義），取自 GitHub 副本 Ryuya-dot-com/LexicalDiversity 與 Huangphoux/ay_gogh。
      修改：轉小寫、整理成 JSON；同形字 found、left、mine、rose 對應到較常用的原形。衍生檔同樣以 CC BY-SA 4.0 授權。</p>
    </div>
    <div class="card">
      <h2 style="margin-top:0">ECDICT 英漢字典</h2>
      <p>作者：skywind3000（Linwei），<a href="https://github.com/skywind3000/ECDICT" target="_blank" rel="noopener">github.com/skywind3000/ECDICT</a>，MIT License。
      其中英文解釋來自 WordNet（Princeton University，WordNet License）。</p>
      <p class="small muted">修改：只保留 NGSL 字與常見字（前 20,000）；英文最多 2 行、中文最多 3 行；
      用 OpenCC（Apache 2.0）把簡體轉成台灣繁體。</p>
      <details class="small"><summary>MIT License 全文</summary>${MIT}</details>
    </div>
    <div class="card">
      <h2 style="margin-top:0">發音</h2>
      <p class="small">使用瀏覽器內建的語音合成（speechSynthesis）。</p>
    </div>
    <div class="card">
      <h2 style="margin-top:0">隱私</h2>
      <p class="small">你貼上的文章與單字本只存在這個瀏覽器的 IndexedDB，不會上傳。本站沒有使用任何 AI 或付費服務。</p>
    </div>`;

export default async function about(main) {
  main.innerHTML = (lang() === 'zh' ? ZH : EN) + `<p><a href="#/settings">${lang() === 'zh' ? '← 回設定' : '← Back to settings'}</a></p>`;
}
