// 把開放資料的 HTML／實體字元整理成純文字段落（不含圖片）
const ENTITIES = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: '’', lsquo: '‘',
  ldquo: '“', rdquo: '”', mdash: '—', ndash: '–', hellip: '…', middot: '·', bull: '•',
  deg: '°', times: '×', copy: '©', reg: '®', trade: '™', yen: '¥', euro: '€', pound: '£',
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', agrave: 'à', egrave: 'è',
  auml: 'ä', ouml: 'ö', uuml: 'ü', ntilde: 'ñ', ccedil: 'ç', ocirc: 'ô', ecirc: 'ê', acirc: 'â',
  Aacute: 'Á', Eacute: 'É', Uuml: 'Ü', Ouml: 'Ö', szlig: 'ß', shy: '',
};

export function decodeEntities(s) {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-zA-Z]+);/g, (m, name) => (name in ENTITIES ? ENTITIES[name] : m));
}

function tidy(lines) {
  return lines
    .map((l) => l.replace(/[ \t ​]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n');
}

// 行政院：純文字但段落黏在一起（"years.The premier"），在句尾與大寫開頭之間補分段
export function cleanEy(content) {
  const text = decodeEntities(content)
    .replace(/([a-z0-9%)][.!?][”"’]?)(?=[A-Z“"][a-z])/g, '$1\n');
  return tidy(text.split('\n'));
}

// 外交部：HTML，去掉開頭的日期與「No. 503」編號行
export function cleanHtml(html) {
  const text = decodeEntities(
    html
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h\d|tr)>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  );
  const lines = text.split('\n').map((l) => l.replace(/[ \t ​]+/g, ' ').trim()).filter(Boolean);
  while (lines.length && (/^[A-Z][a-z]+ \d{1,2}, \d{4}$/.test(lines[0]) || /^No\.\s*\d+$/.test(lines[0]))) lines.shift();
  return tidy(lines);
}

// 民國年 '115-10-29' → '2026-10-29'
export function rocToIso(s) {
  const m = String(s).match(/^(\d{2,3})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (!m) return null;
  const p = (n) => String(n).padStart(2, '0');
  return `${Number(m[1]) + 1911}-${p(m[2])}-${p(m[3])}`;
}

// RSS pubDate → 台灣日期 'YYYY-MM-DD'
export function rssDateToTaipei(s) {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getTime() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

export function parseRss(xml) {
  const items = [];
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const get = (tag) => {
      const r = m[1].match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`));
      return r ? r[1].trim() : '';
    };
    items.push({ title: get('title'), link: decodeEntities(get('link')), description: get('description'), pubDate: get('pubDate') });
  }
  return items;
}
