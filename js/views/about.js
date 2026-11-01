export default async function about(main) {
  main.innerHTML = `
    <h1>授權與出處</h1>
    <div class="card">
      <h2 style="margin-top:0">NGSL 1.2（New General Service List）</h2>
      <p>作者：Charles Browne、Brent Culligan、Joseph Phillips<br>
      官方網站：<a href="https://www.newgeneralservicelist.com/" target="_blank" rel="noopener">newgeneralservicelist.com</a><br>
      授權：<a href="https://creativecommons.org/licenses/by-sa/4.0/deed.zh-hant" target="_blank" rel="noopener">CC BY-SA 4.0</a></p>
      <p class="small muted">本站使用的檔案是 NGSL_1.2_stats.csv（排名）與 NGSL_1.2_lemmatized_for_research.csv（字形），
      取自 GitHub 上的副本 Ryuya-dot-com/LexicalDiversity。修改內容：轉成小寫、整理成 JSON（data/ngsl.json），
      並把官方註明的同形字（found、left、mine、rose、wound）預設對應到較常用的原形（wound 除外）。
      這份衍生檔同樣以 CC BY-SA 4.0 授權。</p>
    </div>
    <div class="card">
      <h2 style="margin-top:0">ECDICT 英漢字典</h2>
      <p>作者：skywind3000（Linwei）<br>
      來源：<a href="https://github.com/skywind3000/ECDICT" target="_blank" rel="noopener">github.com/skywind3000/ECDICT</a><br>
      授權：MIT License</p>
      <p class="small muted">修改內容：只保留 NGSL 字與常見字（詞頻前 20,000）、每個字最多 3 行解釋、去掉網路釋義，
      並用 OpenCC（Apache 2.0）把簡體轉成台灣繁體用語。</p>
      <details class="small"><summary>MIT License 全文</summary><pre style="white-space:pre-wrap">MIT License

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
SOFTWARE.</pre></details>
    </div>
    <div class="card">
      <h2 style="margin-top:0">發音</h2>
      <p class="small">使用瀏覽器內建的語音合成（speechSynthesis），聲音由你的手機系統提供。</p>
    </div>
    <div class="card">
      <h2 style="margin-top:0">隱私</h2>
      <p class="small">你貼上的文章與單字本只存在這個瀏覽器的 IndexedDB，不會上傳到任何伺服器。本站沒有使用任何 AI 或付費服務。</p>
    </div>
    <p><a href="#/settings">← 回設定</a></p>`;
}
