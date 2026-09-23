// RSS'i olmayan siteler için basit HTML kazıma.
// Sayfadaki bağlantıların içinden, adresinde istenen kalıbı taşıyan
// ve yeterince uzun bir başlık metni olanları haber olarak alır.
import * as cheerio from "cheerio";

const UA =
  "Mozilla/5.0 (compatible; HaberPanosu/1.0; +https://ajans-psi.vercel.app)";

// Bağlantının kendi içinde ya da en yakın kapsayıcısında bir görsel ara.
function findImage($, a, base) {
  const holders = [a, a.parent(), a.parent().parent(), a.closest("article, li, .card, div")];
  for (const holder of holders) {
    if (!holder || holder.length === 0) continue;
    const img = holder.find("img").first();
    if (img.length === 0) continue;

    let src =
      img.attr("src") ||
      img.attr("data-src") ||
      img.attr("data-lazy-src") ||
      (img.attr("srcset") || "").split(",")[0]?.trim().split(" ")[0] ||
      "";
    if (!src || src.startsWith("data:")) continue;
    try {
      return new URL(src, base).toString();
    } catch {
      continue;
    }
  }
  return null;
}

export async function fetchHtmlSource(src, max = 25) {
  const res = await fetch(src.url, {
    headers: { "user-agent": UA, accept: "text/html" },
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const patterns = String(src.linkPattern || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  const base = new URL(src.url);
  const out = new Map();

  // Menü, üstbilgi, altbilgi içindeki bağlantılar haber değildir.
  $("nav, header, footer, [role=navigation], .menu, .nav, .navigation, .breadcrumb").remove();

  $("a[href]").each((_, el) => {
    const a = $(el);
    let href = a.attr("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;

    let abs;
    try {
      abs = new URL(href, base).toString().split("#")[0];
    } catch {
      return;
    }
    if (patterns.length && !patterns.some((p) => abs.includes(p))) return;

    // Başlık: bağlantının içindeki başlık etiketi varsa onu, yoksa bağlantı metnini al.
    const heading = a.find("h1,h2,h3,h4,h5").first().text().trim();
    const title = (heading || a.text() || "").replace(/\s+/g, " ").trim();
    if (title.length < 20 || title.length > 220) return;

    if (!out.has(abs)) out.set(abs, { title, link: abs, image: findImage($, a, base) });
  });

  return [...out.values()].slice(0, max);
}
