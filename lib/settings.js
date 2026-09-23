// Ayarlar sayfasından yönetilen tüm veriler KV'de (Redis) saklanır.
// KV'de henüz kategori listesi yoksa config/sources.js'deki varsayılanlar kullanılır.
import { safeGet } from "./kv-safe";
import { CATEGORIES, FEEDS } from "../config/sources";

export const KEYS = {
  feeds: "settings:feeds",             // [{ id, name, url }]
  htmlSources: "settings:htmlSources", // [{ id, name, url, linkPattern, defaultCategory }] (RSS'siz siteler)           // [{ id, name, url }] (taranan haber kaynakları)
  categories: "settings:categories", // [{ id, label, keywords[] }]
  authors: "settings:authors",       // ["Argun", "Mehmet Yılmaz"]  (kendi yazarlarımız)
  columnists: "settings:columnists", // [{ id, name, source, url, filterByName }] (seçme köşe yazarları)
  posts: "posts:list",               // [{ id, author, title, body, createdAt, updatedAt }]
  columnItems: "columns:items",      // seçme köşe yazılarından toplanan başlıklar
};

export async function getFeeds() {
  const f = await safeGet(KEYS.feeds, null);
  if (!Array.isArray(f)) {
    // İlk kullanımda config/sources.js'deki varsayılan kaynaklar.
    return FEEDS.map((x, i) => ({ id: `f${i}`, name: x.name, url: x.url }));
  }
  return f;
}

export async function getHtmlSources() {
  const h = await safeGet(KEYS.htmlSources, []);
  return Array.isArray(h) ? h : [];
}

export async function getCategories() {
  const c = await safeGet(KEYS.categories, null);
  return Array.isArray(c) ? c : CATEGORIES;
}
export async function getAuthors() {
  const a = await safeGet(KEYS.authors, []);
  return Array.isArray(a) ? a : [];
}
export async function getColumnists() {
  const c = await safeGet(KEYS.columnists, []);
  return Array.isArray(c) ? c : [];
}
export async function getPosts() {
  const p = await safeGet(KEYS.posts, []);
  const list = Array.isArray(p) ? p : [];
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
export async function getColumnItems() {
  const c = await safeGet(KEYS.columnItems, []);
  return Array.isArray(c) ? c : [];
}

// Türkçe karakterleri sadeleştirip URL'ye uygun kimlik üretir: "Sağlık" -> "saglik"
export function slugify(text) {
  return (text || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
    .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "kategori";
}

export function excerptOf(body, len = 180) {
  const flat = (body || "").replace(/\s+/g, " ").trim();
  return flat.length > len ? flat.slice(0, len).trimEnd() + "…" : flat;
}
