import { safeGet, kvConfigured } from "../lib/kv-safe";
import { getCategories, getPosts, getColumnItems, excerptOf } from "../lib/settings";
import { formatDate, initials } from "../lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function Thumb({ src, alt, style }) {
  if (!src) {
    return (
      <div style={{ background: "linear-gradient(135deg, var(--ph1), var(--ph2))", borderRadius: 8, ...style }} />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} style={{ objectFit: "cover", borderRadius: 8, ...style }} />;
}

export default async function Page() {
  if (!kvConfigured) {
    return (
      <main style={{ maxWidth: 640, margin: "60px auto", padding: "0 20px" }}>
        <h1 style={{ fontSize: 22 }}>Veritabanı henüz bağlı değil</h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          Vercel projende Storage sekmesinden bir Upstash for Redis veritabanı oluşturup
          projeye bağla, sonra Deployments → Redeploy yap.
        </p>
      </main>
    );
  }

  const [items, lastRun, categories, posts, columnItems] = await Promise.all([
    safeGet("news:items", []).then((x) => x ?? []),
    safeGet("news:lastRun", null),
    getCategories(),
    getPosts(),
    getColumnItems(),
  ]);

  const hero = items[0];
  const leftList = items.slice(1, 4);
  const rightList = items.slice(4, 8);
  const ownPosts = posts.slice(0, 8);

  const hasOverflow = categories.some(
    (cat) => items.filter((i) => i.categories.includes(cat.id)).length > 10
  );

  return (
    <main className="page">
      <header className="masthead" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12 }}>
        <div>
          <h1 className="headline-font">Haber Panosu</h1>
          <div className="meta">
            {lastRun ? `Son güncelleme: ${formatDate(lastRun)}` : "Henüz güncelleme yapılmadı."}
            {" · "}Bugün {items.length} haber
          </div>
        </div>
        <a href="/ayarlar" style={{ fontSize: 12.5, color: "var(--muted)" }}>⚙ Ayarlar</a>
      </header>

      {items.length === 0 ? (
        <p style={{ color: "var(--muted)", marginBottom: 40 }}>
          Bugün için henüz haber toplanmadı. Cron çalıştığında burada görünecek.
        </p>
      ) : (
        <section className="hero-grid" style={{ marginBottom: 44 }}>
          <div>
            {leftList.map((item, i) => (
              <a key={item.link} href={item.link} target="_blank" rel="noreferrer">
                <div className={`story${i % 2 === 1 ? " tinted" : ""}`}>
                  <h3 className="headline-font">{item.title}</h3>
                  <div className="meta">{item.source} · {formatDate(item.pubDate)}</div>
                </div>
              </a>
            ))}
          </div>

          {hero && (
            <a href={hero.link} target="_blank" rel="noreferrer">
              <Thumb src={hero.image} alt={hero.title} style={{ width: "100%", height: 320 }} />
              <div className="headline-font" style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.18, marginTop: 16 }}>{hero.title}</div>
              {hero.excerpt && <p style={{ fontSize: 16, marginTop: 10, lineHeight: 1.55 }}>{hero.excerpt}</p>}
              <div className="meta" style={{ marginTop: 6 }}>
                {hero.source} · {formatDate(hero.pubDate)}
              </div>
            </a>
          )}

          <div>
            {rightList.map((item, i) => (
              <a key={item.link} href={item.link} target="_blank" rel="noreferrer">
                <div className={`story${i % 2 === 1 ? " tinted" : ""}`} style={{ display: "flex", gap: 12 }}>
                  <Thumb src={item.image} alt={item.title} style={{ width: 88, height: 66, flexShrink: 0, borderRadius: 2 }} />
                  <div className="headline-font" style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.28 }}>{item.title}</div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ---------- KÖŞE YAZILARI (yalnızca kendi yazarlarımız) ---------- */}
      {ownPosts.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h2 className="headline-font section-title">Köşe Yazıları</h2>
          <div className="cat-scroll">
            {ownPosts.map((p) => (
              <a key={p.id} href={`/yazi/${p.id}`} className="cat-card" style={{ flexBasis: 280 }}>
                <div style={{ background: "var(--col-bg)", border: "1px solid var(--col-border)", borderRadius: 2, padding: 18, height: "100%" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
                    <div className="avatar avatar-own" style={{ width: 48, height: 48, fontSize: 16 }}>{initials(p.author)}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14.5 }}>{p.author}</div>
                      <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Köşe Yazarımız · {formatDate(p.createdAt, false)}</div>
                    </div>
                  </div>
                  <div className="headline-font" style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>{p.title}</div>
                  <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>{excerptOf(p.body, 130)}</div>
                  <div className="kicker" style={{ marginTop: 12 }}>Devamını oku →</div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ---------- SEÇME KÖŞE YAZILARI (dış kaynaklar, sadece başlık + link) ---------- */}
      {columnItems.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h2 className="headline-font section-title">Seçme Köşe Yazıları</h2>
          <div className="cat-scroll">
            {columnItems.slice(0, 16).map((c) => (
              <a key={c.link} href={c.link} target="_blank" rel="noreferrer" className="cat-card" style={{ flexBasis: 240 }}>
                <div className="card" style={{ padding: 14, height: "100%" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                    <div className="avatar" style={{ width: 38, height: 38, fontSize: 13 }}>{initials(c.author)}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{c.author}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>
                        {c.source ? `${c.source} ↗` : "↗"}{c.pubDate ? ` · ${formatDate(c.pubDate, false)}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="headline-font" style={{ fontSize: 16, fontStyle: "italic", lineHeight: 1.32 }}>“{c.title}”</div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ---------- KATEGORİ BLOKLARI ---------- */}
      {categories.map((cat) => {
        const catItems = items.filter((i) => i.categories.includes(cat.id));
        if (catItems.length === 0) return null;
        return (
          <section key={cat.id} style={{ marginBottom: 36 }}>
            <h2 className="headline-font section-title">
              {cat.label} <span className="count">({catItems.length})</span>
            </h2>
            <div className="cat-scroll">
              {catItems.slice(0, 10).map((item) => (
                <a key={item.link + cat.id} href={item.link} target="_blank" rel="noreferrer" className="cat-card">
                  <div className="card">
                    <Thumb src={item.image} alt={item.title} style={{ width: "100%", height: 130, borderRadius: 0 }} />
                    <div style={{ padding: 12 }}>
                      <div className="headline-font" style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{item.title}</div>
                      <div className="meta" style={{ marginTop: 8, fontSize: 12 }}>
                        {item.source} · {formatDate(item.pubDate)}
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        );
      })}

      {/* ---------- DİĞER HABERLER (kategorik) ---------- */}
      {hasOverflow && (
        <section>
          <h2 className="headline-font section-title">Diğer Haberler</h2>
          {categories.map((cat) => {
            const overflow = items.filter((i) => i.categories.includes(cat.id)).slice(10);
            if (overflow.length === 0) return null;
            return (
              <div key={cat.id} style={{ marginBottom: 20 }}>
                <div className="kicker" style={{ marginBottom: 8 }}>{cat.label}</div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {overflow.map((item) => (
                    <li key={item.link + cat.id} style={{ padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
                      <a href={item.link} target="_blank" rel="noreferrer" className="headline-font u-hover" style={{ fontSize: 16, fontWeight: 700 }}>{item.title}</a>
                      <div className="meta" style={{ marginTop: 3, fontSize: 12 }}>
                        {item.source} · {formatDate(item.pubDate)}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}
