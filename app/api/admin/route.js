// Ayarlar sayfasının konuştuğu tek API. Giriş dışındaki her işlem şifre ister.
import { kv, kvConfigured } from "../../../lib/kv-safe";
import { isAdmin, adminConfigured, checkPassword, setAdminCookie, clearAdminCookie } from "../../../lib/auth";
import {
  KEYS, getCategories, getAuthors, getColumnists, getPosts, getFeeds, getHtmlSources, slugify,
} from "../../../lib/settings";
import { runCollect, parser } from "../../../lib/collect";
import { fetchHtmlSource } from "../../../lib/scrape";
import { EDUCATION_FEEDS, EDUCATION_HTML_SOURCES, EDUCATION_CATEGORIES, REPORT_CATEGORIES } from "../../../config/education-preset";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const clean = (s, max = 200) => (typeof s === "string" ? s.trim().slice(0, max) : "");
const parseKeywords = (input) =>
  (Array.isArray(input) ? input : String(input || "").split(","))
    .map((k) => clean(k, 60))
    .filter(Boolean);

async function state() {
  const [feeds, htmlSources, categories, authors, columnists, posts] = await Promise.all([
    getFeeds(), getHtmlSources(), getCategories(), getAuthors(), getColumnists(), getPosts(),
  ]);
  return { feeds, htmlSources, categories, authors, columnists, posts };
}

const fail = (message, status = 400) => Response.json({ error: message }, { status });

export async function GET() {
  if (!adminConfigured()) return fail("ADMIN_PASSWORD tanımlı değil", 503);
  if (!isAdmin()) return fail("giriş gerekli", 401);
  if (!kvConfigured) return fail("Veritabanı bağlı değil", 500);
  return Response.json(await state());
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return fail("geçersiz istek");
  }
  const { action } = body || {};

  if (action === "login") {
    if (!adminConfigured()) return fail("ADMIN_PASSWORD tanımlı değil", 503);
    if (!checkPassword(body.password)) return fail("Şifre hatalı", 401);
    setAdminCookie();
    return Response.json({ ok: true });
  }
  if (action === "logout") {
    clearAdminCookie();
    return Response.json({ ok: true });
  }

  if (!isAdmin()) return fail("giriş gerekli", 401);
  if (!kvConfigured) return fail("Veritabanı bağlı değil", 500);

  switch (action) {
    // ---------- HABER KAYNAKLARI ----------
    case "addFeed": {
      const url = clean(body.url, 500);
      let name = clean(body.name, 80);
      if (!url) return fail("RSS adresi gerekli");
      if (!/^https?:\/\//i.test(url)) return fail("Adres http:// veya https:// ile başlamalı");
      const feeds = await getFeeds();
      if (feeds.some((f) => f.url === url)) return fail("Bu adres zaten ekli");
      let parsed;
      try {
        parsed = await parser.parseURL(url);
      } catch {
        return fail("Bu adresten RSS okunamadı. Adresi kontrol et.");
      }
      if (!name) name = clean(parsed?.title, 80) || "Yeni kaynak";
      await kv.set(KEYS.feeds, [
        ...feeds,
        { id: Date.now().toString(36), name, url, foreign: Boolean(body.foreign) },
      ]);
      break;
    }
    case "renameFeed": {
      const name = clean(body.name, 80);
      if (!name) return fail("Kaynak adı boş olamaz");
      const feeds = await getFeeds();
      await kv.set(KEYS.feeds, feeds.map((f) => (f.id === body.id ? { ...f, name } : f)));
      break;
    }
    case "toggleFeedForeign": {
      const feeds = await getFeeds();
      await kv.set(KEYS.feeds, feeds.map((f) => (f.id === body.id ? { ...f, foreign: !f.foreign } : f)));
      break;
    }
    case "deleteFeed": {
      const feeds = await getFeeds();
      await kv.set(KEYS.feeds, feeds.filter((f) => f.id !== body.id));
      break;
    }

    // ---------- RSS'SİZ SİTELER ----------
    case "addHtmlSource": {
      const name = clean(body.name, 80);
      const url = clean(body.url, 500);
      const linkPattern = clean(body.linkPattern, 200);
      const defaultCategory = clean(body.defaultCategory, 60);
      if (!name || !url) return fail("Site adı ve adres gerekli");
      if (!/^https?:\/\//i.test(url)) return fail("Adres http:// veya https:// ile başlamalı");
      let found;
      try {
        found = await fetchHtmlSource({ url, linkPattern });
      } catch (err) {
        return fail("Sayfa okunamadı: " + String(err).slice(0, 120));
      }
      if (found.length === 0) {
        return fail("Sayfa okundu ama bu kalıba uyan haber bağlantısı bulunamadı. Bağlantı kalıbını kontrol et.");
      }
      const list = await getHtmlSources();
      await kv.set(KEYS.htmlSources, [
        ...list,
        { id: Date.now().toString(36), name, url, linkPattern, defaultCategory, foreign: Boolean(body.foreign) },
      ]);
      return Response.json({ ...(await state()), testResult: `${found.length} haber bağlantısı bulundu. Örnek: ${found[0].title}` });
    }
    case "toggleHtmlForeign": {
      const list = await getHtmlSources();
      await kv.set(KEYS.htmlSources, list.map((h) => (h.id === body.id ? { ...h, foreign: !h.foreign } : h)));
      break;
    }
    case "deleteHtmlSource": {
      const list = await getHtmlSources();
      await kv.set(KEYS.htmlSources, list.filter((h) => h.id !== body.id));
      break;
    }

    // ---------- KATEGORİLER ----------
    case "addCategory": {
      const label = clean(body.label, 60);
      const keywords = parseKeywords(body.keywords);
      if (!label) return fail("Kategori adı boş olamaz");
      if (keywords.length === 0) return fail("En az bir anahtar kelime gir");
      const cats = await getCategories();
      let id = slugify(label);
      while (cats.some((c) => c.id === id)) id += "-2";
      await kv.set(KEYS.categories, [...cats, { id, label, keywords }]);
      break;
    }
    case "updateCategory": {
      const cats = await getCategories();
      const label = clean(body.label, 60);
      const keywords = parseKeywords(body.keywords);
      if (!label || keywords.length === 0) return fail("Ad ve en az bir anahtar kelime gerekli");
      await kv.set(
        KEYS.categories,
        cats.map((c) => (c.id === body.id ? { ...c, label, keywords } : c))
      );
      break;
    }
    case "deleteCategory": {
      const cats = await getCategories();
      await kv.set(KEYS.categories, cats.filter((c) => c.id !== body.id));
      break;
    }
    case "moveCategory": {
      const cats = await getCategories();
      const i = cats.findIndex((c) => c.id === body.id);
      const j = i + (body.dir === "up" ? -1 : 1);
      if (i >= 0 && j >= 0 && j < cats.length) {
        [cats[i], cats[j]] = [cats[j], cats[i]];
        await kv.set(KEYS.categories, cats);
      }
      break;
    }

    // ---------- KENDİ YAZARLARIMIZ ----------
    case "addAuthor": {
      const name = clean(body.name, 80);
      if (!name) return fail("Yazar adı boş olamaz");
      const authors = await getAuthors();
      if (!authors.includes(name)) await kv.set(KEYS.authors, [...authors, name]);
      break;
    }
    case "deleteAuthor": {
      const authors = await getAuthors();
      await kv.set(KEYS.authors, authors.filter((a) => a !== body.name));
      break;
    }

    // ---------- SEÇME KÖŞE YAZARLARI ----------
    case "addColumnist": {
      const name = clean(body.name, 80);
      const source = clean(body.source, 60);
      const url = clean(body.url, 500);
      if (!name || !url) return fail("Yazar adı ve RSS adresi gerekli");
      if (!/^https?:\/\//i.test(url)) return fail("RSS adresi http:// veya https:// ile başlamalı");
      try {
        await parser.parseURL(url); // adres gerçekten okunabiliyor mu?
      } catch {
        return fail("Bu adresten RSS okunamadı. Adresi kontrol et.");
      }
      const list = await getColumnists();
      await kv.set(KEYS.columnists, [
        ...list,
        { id: Date.now().toString(36), name, source, url, filterByName: Boolean(body.filterByName) },
      ]);
      break;
    }
    case "deleteColumnist": {
      const list = await getColumnists();
      await kv.set(KEYS.columnists, list.filter((c) => c.id !== body.id));
      break;
    }

    // ---------- KENDİ YAZILARIMIZ ----------
    case "savePost": {
      const author = clean(body.author, 80);
      const title = clean(body.title, 200);
      const text = typeof body.body === "string" ? body.body.trim().slice(0, 50000) : "";
      if (!author || !title || !text) return fail("Yazar, başlık ve metin gerekli");
      const authors = await getAuthors();
      if (!authors.includes(author)) return fail("Önce bu yazarı 'Kendi Yazarlarımız' listesine ekle");
      const type = body.type === "rapor" ? "rapor" : "kose";
      const reportCategory = type === "rapor" ? clean(body.reportCategory, 60) : "";
      if (type === "rapor" && !REPORT_CATEGORIES.some((r) => r.id === reportCategory)) {
        return fail("Rapor için bir bölüm seç");
      }
      const posts = await getPosts();
      const now = new Date().toISOString();
      if (body.id) {
        await kv.set(
          KEYS.posts,
          posts.map((p) =>
            p.id === body.id ? { ...p, author, title, body: text, type, reportCategory, updatedAt: now } : p
          )
        );
      } else {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        await kv.set(KEYS.posts, [
          { id, author, title, body: text, type, reportCategory, createdAt: now, updatedAt: now },
          ...posts,
        ]);
      }
      break;
    }
    case "deletePost": {
      const posts = await getPosts();
      await kv.set(KEYS.posts, posts.filter((p) => p.id !== body.id));
      break;
    }

    // ---------- EĞİTİM ŞABLONU ----------
    case "applyEducationPreset": {
      const stamp = Date.now();
      await kv.set(
        KEYS.feeds,
        EDUCATION_FEEDS.map((f, i) => ({ id: `edu${stamp}-${i}`, ...f }))
      );
      await kv.set(
        KEYS.htmlSources,
        EDUCATION_HTML_SOURCES.map((h, i) => ({ id: `eduh${stamp}-${i}`, ...h }))
      );
      await kv.set(KEYS.categories, EDUCATION_CATEGORIES);
      break;
    }

    // ---------- ELLE GÜNCELLEME ----------
    case "runCollect": {
      const result = await runCollect();
      return Response.json({ ...(await state()), collectResult: result });
    }

    default:
      return fail("bilinmeyen işlem");
  }

  return Response.json(await state());
}
