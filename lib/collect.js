// Haber ve seçme köşe yazısı toplama mantığı.
// Hem zamanlanmış cron (/api/cron) hem de Ayarlar sayfasındaki
// "Şimdi güncelle" düğmesi bu fonksiyonu çağırır.
import Parser from "rss-parser";
import { MAX_ITEMS_PER_FEED, MAX_STORED_ITEMS } from "../config/sources";
import { matchCategories } from "./match";
import { kv, safeGet } from "./kv-safe";
import { KEYS, getCategories, getColumnists, getFeeds, getHtmlSources } from "./settings";
import { fetchHtmlSource } from "./scrape";
import { translateItems } from "./translate";

const parser = new Parser({
  timeout: 15000,
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail"],
      ["dc:creator", "dcCreator"],
      ["image", "imageTag"],
      "enclosure",
    ],
  },
});

export { parser };

const dayFmt = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit",
});

// Tarih, Türkiye saatiyle bugüne mi ait?
export function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return dayFmt.format(d) === dayFmt.format(new Date());
}

function extractImage(item) {
  if (item.enclosure?.url) return item.enclosure.url;
  // CNN Türk gibi bazı siteler görseli düz bir <image> etiketinde veriyor.
  if (typeof item.imageTag === "string" && item.imageTag.startsWith("http")) return item.imageTag;
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
  if (Array.isArray(item.mediaContent) && item.mediaContent[0]?.$?.url) {
    return item.mediaContent[0].$.url;
  }
  const html = item.content || item["content:encoded"] || "";
  const match = html.match(/<img[^>]+src="([^"]+)"/i);
  return match ? match[1] : null;
}

const COLUMN_MAX_AGE_DAYS = 7;   // seçme köşe yazıları kaç gün görünsün
const COLUMN_PER_AUTHOR = 3;     // yazar başına en fazla kaç yazı
const COLUMN_MAX_STORED = 60;

async function collectColumns() {
  const columnists = await getColumnists();
  const out = [];
  const errors = [];
  const minTime = Date.now() - COLUMN_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const norm = (s) => (s || "").toLocaleLowerCase("tr-TR");

  for (const c of columnists) {
    try {
      const parsed = await parser.parseURL(c.url);
      let items = parsed.items || [];
      if (c.filterByName) {
        const n = norm(c.name);
        items = items.filter((it) =>
          [it.creator, it.dcCreator, it.author, it.title].some((f) => norm(f).includes(n))
        );
      }
      items
        .filter((it) => {
          const d = new Date(it.isoDate || it.pubDate || 0).getTime();
          return !d || d >= minTime;
        })
        .slice(0, COLUMN_PER_AUTHOR)
        .forEach((it) => {
          const link = it.link || it.guid;
          if (!link) return;
          out.push({
            title: it.title || "(başlıksız)",
            link,
            author: c.name,
            source: c.source || "",
            pubDate: it.isoDate || it.pubDate || null,
          });
        });
    } catch (err) {
      errors.push({ yazar: c.name, error: String(err) });
    }
  }

  const unique = [...new Map(out.map((i) => [i.link, i])).values()]
    .sort((a, b) => new Date(b.pubDate || 0) - new Date(a.pubDate || 0))
    .slice(0, COLUMN_MAX_STORED);

  await kv.set(KEYS.columnItems, unique);
  return { toplam: unique.length, errors };
}

// RSS'siz sitelerden kazıma. Bu sayfalarda yayın tarihi güvenilir biçimde
// okunamadığı için, bir bağlantıyı İLK gördüğümüz an onun tarihi sayılır;
// böylece eski haberler sürekli "bugünkü" gibi görünmez.
const SEEN_MAX_AGE_DAYS = 10;

async function collectHtmlSources(categories) {
  const sources = await getHtmlSources();
  if (sources.length === 0) return { items: [], errors: [] };

  const seen = (await safeGet("scrape:seen", {})) || {};
  const now = new Date().toISOString();
  const items = [];
  const errors = [];

  for (const src of sources) {
    try {
      const found = await fetchHtmlSource(src);
      for (const f of found) {
        if (seen[f.link]) continue; // daha önce görüldü
        seen[f.link] = now;

        let cats = matchCategories(f.title, categories);
        if (cats.length === 0 && src.defaultCategory) {
          if (categories.some((c) => c.id === src.defaultCategory)) cats = [src.defaultCategory];
        }
        if (cats.length === 0) continue;

        items.push({
          title: f.title,
          link: f.link,
          source: src.name,
          pubDate: now,
          categories: cats,
          image: f.image || null,
          excerpt: "",
          foreign: Boolean(src.foreign),
        });
      }
    } catch (err) {
      errors.push({ site: src.name, error: String(err) });
    }
  }

  // Eski kayıtları temizle ki liste sonsuza kadar büyümesin.
  const cutoff = Date.now() - SEEN_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const pruned = {};
  for (const [link, at] of Object.entries(seen)) {
    if (new Date(at).getTime() >= cutoff) pruned[link] = at;
  }
  await kv.set("scrape:seen", pruned);

  return { items, errors };
}

export async function runCollect() {
  const [categories, feeds] = await Promise.all([getCategories(), getFeeds()]);
  const existing = (await safeGet("news:items", [])) || [];
  const existingLinks = new Set(existing.map((i) => i.link));

  const collected = [];
  const errors = [];

  for (const feed of feeds) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const items = (parsed.items || []).slice(0, MAX_ITEMS_PER_FEED);

      for (const item of items) {
        const link = item.link || item.guid;
        if (!link || existingLinks.has(link)) continue;

        const pubDate = item.isoDate || item.pubDate || new Date().toISOString();
        if (!isToday(pubDate)) continue; // bugüne ait olmayan haberleri hiç alma

        const excerpt = (item.contentSnippet || "").slice(0, 160);
        const cats = matchCategories(`${item.title || ""} ${excerpt}`, categories);
        if (cats.length === 0) continue;

        collected.push({
          title: item.title || "(başlıksız)",
          link,
          source: feed.name,
          pubDate,
          categories: cats,
          image: extractImage(item),
          excerpt,
          foreign: Boolean(feed.foreign),
        });
        existingLinks.add(link);
      }
    } catch (err) {
      errors.push({ feed: feed.name, error: String(err) });
    }
  }

  const scraped = await collectHtmlSources(categories);
  collected.push(...scraped.items);
  errors.push(...scraped.errors);

  // Yabancı dildeki YENİ haberleri Türkçeye çevir (eskiler zaten çevrilmişti).
  const toTranslate = collected.filter((i) => i.foreign && !i.titleTr);
  const translation = await translateItems(toTranslate);
  errors.push(...translation.hatalar.map((h) => ({ ceviri: h })));

  // Eski günlerin haberlerini at; kalanları GÜNCEL kategori listesiyle yeniden
  // etiketle (Ayarlar'dan yeni kategori eklenince mevcut haberler de ona düşsün).
  const stillToday = existing
    .filter((i) => isToday(i.pubDate))
    .map((i) => ({ ...i, categories: matchCategories(`${i.title} ${i.excerpt || ""}`, categories) }))
    .filter((i) => i.categories.length > 0);

  const merged = [...collected, ...stillToday]
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, MAX_STORED_ITEMS);

  await kv.set("news:items", merged);
  await kv.set("news:lastRun", new Date().toISOString());

  const columns = await collectColumns();

  return {
    ok: true,
    yeniHaber: collected.length,
    kazinanSite: scraped.items.length,
    cevrilen: translation.cevrilen,
    toplamHaber: merged.length,
    secmeKoseYazisi: columns.toplam,
    hatalar: [...errors, ...columns.errors],
  };
}
