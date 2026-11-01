// 新聞來源。只收「政府資料開放授權條款第 1 版」且資料本身含全文的資料集。
// 條款：https://data.gov.tw/license
export const LICENSE = {
  name: 'Open Government Data License, version 1.0',
  nameZh: '政府資料開放授權條款－第1版',
  url: 'https://data.gov.tw/license',
};

export const SOURCES = {
  ey: {
    provider: 'Executive Yuan',
    providerZh: '行政院',
    dataset: 'Executive Yuan English Website News Release',
    datasetZh: '行政院英文網新聞稿',
    datasetUrl: 'https://data.gov.tw/dataset/9500',
    feed: 'https://www.ey.gov.tw/NewOpenData/JSON/157',
    format: 'ey-json',
  },
  mofa: {
    provider: 'Ministry of Foreign Affairs',
    providerZh: '外交部',
    dataset: 'MOFA English Website News and Events',
    datasetZh: '外交部全球資訊網-英文版-最新消息(News and Events)',
    datasetUrl: 'https://data.gov.tw/dataset/86238',
    feed: 'https://en.mofa.gov.tw/OpenData.aspx?SN=07564A7F01D47BAD',
    format: 'rss',
  },
};

// 依條款附件格式產生顯名文字：提供機關、年份、資料集名稱、授權條款版本與網址
export function attributionFor(sourceKey, year) {
  const s = SOURCES[sourceKey];
  return {
    text: `${s.provider}, ${year}, ${s.dataset}. ${LICENSE.name} (${LICENSE.url})`,
    textZh: `${s.providerZh}，${year}，${s.datasetZh}。此開放資料依${LICENSE.nameZh}（${LICENSE.url}）進行公眾釋出`,
    datasetUrl: s.datasetUrl,
  };
}
