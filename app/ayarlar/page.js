"use client";

import { useEffect, useState } from "react";

async function api(action, payload = {}) {
  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || "Hata oluştu"), { status: res.status });
  return data;
}

const emptyPost = { id: null, author: "", title: "", body: "", type: "kose", reportCategory: "" };

const REPORT_CATS = [
  { id: "trend-raporlari", label: "Sektörel Trend Raporları" },
  { id: "altyapi-rehberleri", label: "Altyapı & Satın Alma Rehberleri" },
  { id: "kuresel-endeksler", label: "Küresel Endeks & Analizler" },
  { id: "pazar-bultenleri", label: "Pazar & Yatırım Bültenleri" },
];
const reportLabel = (id) => REPORT_CATS.find((r) => r.id === id)?.label || id;

export default function AyarlarPage() {
  const [phase, setPhase] = useState("loading"); // loading | login | ready | noconfig
  const [data, setData] = useState(null);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { type: "ok" | "err", text }

  const [newFeed, setNewFeed] = useState({ name: "", url: "", foreign: false });
  const [editFeed, setEditFeed] = useState(null); // { id, name }
  const [newHtml, setNewHtml] = useState({ name: "", url: "", linkPattern: "", defaultCategory: "", foreign: false });
  const [newCat, setNewCat] = useState({ label: "", keywords: "" });
  const [editCat, setEditCat] = useState(null); // { id, label, keywords }
  const [newAuthor, setNewAuthor] = useState("");
  const [newCol, setNewCol] = useState({ name: "", source: "", url: "", filterByName: false });
  const [post, setPost] = useState(emptyPost);

  async function load() {
    const res = await fetch("/api/admin");
    if (res.status === 401) return setPhase("login");
    if (res.status === 503) return setPhase("noconfig");
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg({ type: "err", text: d.error || "Yüklenemedi" });
      return setPhase("login");
    }
    setData(d);
    setPhase("ready");
  }

  useEffect(() => { load(); }, []);

  async function run(action, payload, okText, after) {
    setBusy(true);
    setMsg(null);
    try {
      const d = await api(action, payload);
      if (d.categories) setData(d);
      if (okText) setMsg({ type: "ok", text: typeof okText === "function" ? okText(d) : okText });
      after && after(d);
      return true;
    } catch (e) {
      if (e.status === 401) setPhase("login");
      setMsg({ type: "err", text: e.message });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function login(e) {
    e.preventDefault();
    const ok = await run("login", { password }, null);
    if (ok) { setPassword(""); setPhase("loading"); load(); }
  }

  if (phase === "loading") return <main className="page"><p style={{ color: "var(--muted)" }}>Yükleniyor…</p></main>;

  if (phase === "noconfig") {
    return (
      <main className="page" style={{ maxWidth: 560 }}>
        <h1 className="headline-font">Ayarlar</h1>
        <div className="panel">
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            Ayarlar sayfası için henüz şifre belirlenmemiş. Vercel'de projenin
            <strong> Settings → Environment Variables</strong> bölümüne <code>ADMIN_PASSWORD</code> adında
            bir değişken ekle, sonra <strong>Redeploy</strong> yap.
          </p>
        </div>
      </main>
    );
  }

  if (phase === "login") {
    return (
      <main className="page" style={{ maxWidth: 420 }}>
        <a href="/" style={{ fontSize: 13, color: "var(--muted)" }}>← Haber Panosu</a>
        <h1 className="headline-font" style={{ marginTop: 16 }}>Ayarlar</h1>
        {msg && <div className={`msg ${msg.type === "err" ? "msg-err" : "msg-ok"}`}>{msg.text}</div>}
        <form className="panel" onSubmit={login}>
          <p className="hint">🔒 Bu sayfa şifre ile korunuyor.</p>
          <input className="field" type="password" placeholder="Şifre" value={password}
            onChange={(e) => setPassword(e.target.value)} autoFocus style={{ marginBottom: 10 }} />
          <button className="btn" style={{ width: "100%" }} disabled={busy || !password}>Giriş Yap</button>
        </form>
      </main>
    );
  }

  const { feeds = [], htmlSources = [], categories, authors, columnists, posts } = data;

  return (
    <main className="page" style={{ maxWidth: 860 }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <a href="/" style={{ fontSize: 13, color: "var(--muted)" }}>← Haber Panosu</a>
        <button className="btn-ghost" onClick={() => run("logout", {}, null, () => setPhase("login"))}>Çıkış</button>
      </div>
      <header style={{ borderBottom: "3px solid var(--text)", paddingBottom: 12, marginBottom: 20 }}>
        <h1 className="headline-font" style={{ fontSize: 28, margin: "0 0 4px" }}>Ayarlar</h1>
        <div style={{ color: "var(--muted)", fontSize: 13 }}>Buradaki değişiklikler anında kaydedilir; koda dokunmana gerek yok.</div>
      </header>

      {msg && <div className={`msg ${msg.type === "err" ? "msg-err" : "msg-ok"}`}>{msg.text}</div>}

      {/* ---------------- GÜNCELLEME ---------------- */}
      <section className="panel">
        <h2 className="headline-font">Haberleri şimdi güncelle</h2>
        <p className="hint">
          Normalde günde iki kez (08:00 ve 18:00) otomatik çalışır. Yeni kategori ya da yazar ekledikten
          sonra sonucu hemen görmek istersen buna bas. 20-40 saniye sürebilir.
        </p>
        <button className="btn" disabled={busy} onClick={() =>
          run("runCollect", {}, (d) => {
            const r = d.collectResult || {};
            const errs = (r.hatalar || []).length;
            return `Güncellendi: ${r.yeniHaber ?? 0} yeni haber, toplam ${r.toplamHaber ?? 0}; ${r.secmeKoseYazisi ?? 0} seçme köşe yazısı; ${r.cevrilen ?? 0} haber Türkçeye çevrildi.${errs ? ` (${errs} kaynakta sorun var)` : ""}`;
          })
        }>{busy ? "Çalışıyor…" : "↻ Şimdi güncelle"}</button>
      </section>

      {/* ---------------- EĞİTİM ŞABLONU ---------------- */}
      <section className="panel">
        <h2 className="headline-font">Eğitim şablonu</h2>
        <p className="hint">
          Panoyu tamamen eğitim odaklı hale getirir: kaynakları Türkiye'nin eğitim servisleri ile
          Inside Higher Ed, EdSurge, eSchool News, The PIE News, THE Journal ve Times Higher Education
          olarak değiştirir; kategorileri de Yükseköğretim, Sınav ve Tercih, Eğitim Teknolojisi,
          Uluslararası Öğrenci, Eğitim Politikası, Sıralama ve Araştırma, Okullar olarak kurar.
          Mevcut kaynak ve kategori listelerinin yerine geçer; köşe yazıları ve yazarlar etkilenmez.
        </p>
        <button className="btn" disabled={busy} onClick={() => {
          if (confirm("Mevcut kaynak ve kategori listelerinin yerine eğitim şablonu kurulacak. Devam edilsin mi?")) {
            run("applyEducationPreset", {}, "Eğitim şablonu kuruldu. Haberleri çekmek için 'Şimdi güncelle'ye bas.");
          }
        }}>Eğitim şablonunu uygula</button>
      </section>

      {/* ---------------- HABER KAYNAKLARI ---------------- */}
      <section className="panel">
        <h2 className="headline-font">Haber Kaynakları</h2>
        <p className="hint">
          Taranacak siteler. Her biri bir RSS adresidir (genelde gazetenin "RSS servisleri" sayfasında bulunur).
          Adres eklenirken okunup okunmadığı kontrol edilir; ad boş bırakılırsa beslemenin kendi başlığı kullanılır.
        </p>
        {feeds.map((f) => (
          <div key={f.id} className="list-row">
            {editFeed?.id === f.id ? (
              <div className="row" style={{ flex: 1 }}>
                <input className="field" style={{ flex: 1, minWidth: 160 }} value={editFeed.name}
                  onChange={(e) => setEditFeed({ ...editFeed, name: e.target.value })} />
                <button className="btn" disabled={busy} onClick={() =>
                  run("renameFeed", editFeed, "Kaynak adı güncellendi", () => setEditFeed(null))}>Kaydet</button>
                <button className="btn-ghost" onClick={() => setEditFeed(null)}>Vazgeç</button>
              </div>
            ) : (
              <>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>
                    {f.name}{f.foreign && <span className="tag" style={{ marginLeft: 6 }}>çevrilecek</span>}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.url}</div>
                </div>
                <div className="row" style={{ flexShrink: 0 }}>
                  <button className="btn-ghost" onClick={() => setEditFeed({ id: f.id, name: f.name })}>Adını değiştir</button>
                  <button className="btn-ghost" disabled={busy} onClick={() => run("toggleFeedForeign", { id: f.id })}>
                    {f.foreign ? "Türkçe kaynak yap" : "Yabancı dil"}
                  </button>
                  <button className="btn-ghost btn-danger" disabled={busy} onClick={() => {
                    if (confirm(`"${f.name}" kaynağı kaldırılsın mı?`)) run("deleteFeed", { id: f.id }, "Kaynak kaldırıldı");
                  }}>Kaldır</button>
                </div>
              </>
            )}
          </div>
        ))}
        <h3 className="headline-font" style={{ fontSize: 15, margin: "20px 0 10px" }}>Yeni kaynak ekle</h3>
        <div style={{ display: "grid", gap: 8, maxWidth: 520 }}>
          <input className="field" placeholder="RSS adresi (https://…)" value={newFeed.url}
            onChange={(e) => setNewFeed({ ...newFeed, url: e.target.value })} />
          <input className="field" placeholder="Görünecek ad (boş bırakabilirsin, örn. Milliyet - Spor)" value={newFeed.name}
            onChange={(e) => setNewFeed({ ...newFeed, name: e.target.value })} />
          <label style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", color: "var(--muted)" }}>
            <input type="checkbox" checked={newFeed.foreign} onChange={(e) => setNewFeed({ ...newFeed, foreign: e.target.checked })} />
            Bu kaynak yabancı dilde: başlığı Türkçeye çevir ve kısa özet ekle
          </label>
          <button className="btn" style={{ justifySelf: "start" }} disabled={busy || !newFeed.url.trim()}
            onClick={() => run("addFeed", newFeed, "Kaynak eklendi. Haberlerini çekmek için 'Şimdi güncelle'ye bas.",
              () => setNewFeed({ name: "", url: "" }))}>
            {busy ? "Adres kontrol ediliyor…" : "+ Kaynak ekle"}
          </button>
        </div>
      </section>

      {/* ---------------- RSS'SİZ SİTELER ---------------- */}
      <section className="panel">
        <h2 className="headline-font">RSS'siz Siteler</h2>
        <p className="hint">
          RSS yayınlamayan siteler için. Sayfadaki bağlantılardan, adresinde belirttiğin kalıbı taşıyanlar
          haber olarak alınır (örn. Times Higher Education için adres
          <code> https://www.timeshighereducation.com/academic/news</code>, kalıp <code>/news/, /depth/</code>).
          Yayın tarihi okunamadığı için bir haber ilk görüldüğü gün listeye girer. Yalnızca başlık ve bağlantı alınır.
        </p>
        {htmlSources.map((h) => (
          <div key={h.id} className="list-row">
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {h.name}{h.foreign && <span className="tag" style={{ marginLeft: 6 }}>çevrilecek</span>}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {h.url}{h.linkPattern ? ` · kalıp: ${h.linkPattern}` : ""}
                {h.defaultCategory ? ` · varsayılan: ${categories.find((c) => c.id === h.defaultCategory)?.label || h.defaultCategory}` : ""}
              </div>
            </div>
            <div className="row" style={{ flexShrink: 0 }}>
              <button className="btn-ghost" disabled={busy} onClick={() => run("toggleHtmlForeign", { id: h.id })}>
                {h.foreign ? "Türkçe kaynak yap" : "Yabancı dil"}
              </button>
              <button className="btn-ghost btn-danger" disabled={busy} onClick={() => {
                if (confirm(`"${h.name}" kaldırılsın mı?`)) run("deleteHtmlSource", { id: h.id }, "Site kaldırıldı");
              }}>Kaldır</button>
            </div>
          </div>
        ))}
        <h3 className="headline-font" style={{ fontSize: 15, margin: "20px 0 10px" }}>Yeni site ekle</h3>
        <div style={{ display: "grid", gap: 8, maxWidth: 560 }}>
          <input className="field" placeholder="Site adı (örn. Times Higher Education)" value={newHtml.name}
            onChange={(e) => setNewHtml({ ...newHtml, name: e.target.value })} />
          <input className="field" placeholder="Haberlerin listelendiği sayfa adresi (https://…)" value={newHtml.url}
            onChange={(e) => setNewHtml({ ...newHtml, url: e.target.value })} />
          <input className="field" placeholder="Bağlantı kalıbı, virgülle ayır (örn. /news/, /depth/)" value={newHtml.linkPattern}
            onChange={(e) => setNewHtml({ ...newHtml, linkPattern: e.target.value })} />
          <select className="field" value={newHtml.defaultCategory} style={{ maxWidth: 320 }}
            onChange={(e) => setNewHtml({ ...newHtml, defaultCategory: e.target.value })}>
            <option value="">Anahtar kelime tutmazsa: alma</option>
            {categories.map((c) => <option key={c.id} value={c.id}>Tutmazsa şu kategoriye koy: {c.label}</option>)}
          </select>
          <label style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", color: "var(--muted)" }}>
            <input type="checkbox" checked={newHtml.foreign} onChange={(e) => setNewHtml({ ...newHtml, foreign: e.target.checked })} />
            Bu site yabancı dilde: başlığı Türkçeye çevir ve kısa özet ekle
          </label>
          <button className="btn" style={{ justifySelf: "start" }} disabled={busy || !newHtml.name.trim() || !newHtml.url.trim()}
            onClick={() => run("addHtmlSource", newHtml,
              (d) => `Site eklendi. ${d.testResult || ""}`,
              () => setNewHtml({ name: "", url: "", linkPattern: "", defaultCategory: "" }))}>
            {busy ? "Sayfa deneniyor…" : "+ Site ekle"}
          </button>
        </div>
      </section>

      {/* ---------------- KATEGORİLER ---------------- */}
      <section className="panel">
        <h2 className="headline-font">Kategoriler</h2>
        <p className="hint">
          Bir haberin başlığında veya özetinde anahtar kelimelerden biri geçerse o kategoriye düşer.
          Bir haber birden fazla kategoriye girebilir. Sıralama ana sayfadaki blok sırasını belirler.
        </p>

        {categories.map((c, idx) => (
          <div key={c.id} className="list-row" style={{ alignItems: "flex-start" }}>
            {editCat?.id === c.id ? (
              <div style={{ flex: 1, display: "grid", gap: 8 }}>
                <input className="field" value={editCat.label} onChange={(e) => setEditCat({ ...editCat, label: e.target.value })} />
                <input className="field" value={editCat.keywords} onChange={(e) => setEditCat({ ...editCat, keywords: e.target.value })}
                  placeholder="virgülle ayır" />
                <div className="row">
                  <button className="btn" disabled={busy} onClick={() =>
                    run("updateCategory", editCat, "Kategori güncellendi", () => setEditCat(null))}>Kaydet</button>
                  <button className="btn-ghost" onClick={() => setEditCat(null)}>Vazgeç</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 4 }}>{c.label}</div>
                  <div>{c.keywords.map((k) => <span key={k} className="tag">{k}</span>)}</div>
                </div>
                <div className="row" style={{ flexShrink: 0 }}>
                  <button className="btn-ghost" disabled={busy || idx === 0} onClick={() => run("moveCategory", { id: c.id, dir: "up" })} title="Yukarı">↑</button>
                  <button className="btn-ghost" disabled={busy || idx === categories.length - 1} onClick={() => run("moveCategory", { id: c.id, dir: "down" })} title="Aşağı">↓</button>
                  <button className="btn-ghost" onClick={() => setEditCat({ id: c.id, label: c.label, keywords: c.keywords.join(", ") })}>Düzenle</button>
                  <button className="btn-ghost btn-danger" disabled={busy} onClick={() => {
                    if (confirm(`"${c.label}" kategorisi silinsin mi?`)) run("deleteCategory", { id: c.id }, "Kategori silindi");
                  }}>Sil</button>
                </div>
              </>
            )}
          </div>
        ))}

        <h3 className="headline-font" style={{ fontSize: 15, margin: "20px 0 10px" }}>Yeni kategori ekle</h3>
        <div style={{ display: "grid", gap: 8, maxWidth: 480 }}>
          <input className="field" placeholder="Kategori adı (örn. Sağlık)" value={newCat.label}
            onChange={(e) => setNewCat({ ...newCat, label: e.target.value })} />
          <input className="field" placeholder="Anahtar kelimeler, virgülle ayır (örn. sağlık, hastane, aşı)" value={newCat.keywords}
            onChange={(e) => setNewCat({ ...newCat, keywords: e.target.value })} />
          <button className="btn" style={{ justifySelf: "start" }} disabled={busy || !newCat.label.trim() || !newCat.keywords.trim()}
            onClick={() => run("addCategory", newCat, "Kategori eklendi. Mevcut haberlere de uygulanması için 'Şimdi güncelle'ye basabilirsin.",
              () => setNewCat({ label: "", keywords: "" }))}>+ Kategori ekle</button>
        </div>
      </section>

      {/* ---------------- KENDİ YAZARLARIMIZ ---------------- */}
      <section className="panel">
        <h2 className="headline-font">Kendi Yazarlarımız</h2>
        <p className="hint">"Köşe Yazıları" bölümünde yazabilecek kişiler. Sadece isim listesi; yazıları sen bu sayfadan girersin.</p>
        <div style={{ marginBottom: 12 }}>
          {authors.length === 0 && <span className="hint">Henüz yazar yok.</span>}
          {authors.map((a) => (
            <span key={a} className="tag">{a}
              <button title="Kaldır" onClick={() => {
                if (confirm(`${a} yazar listesinden çıkarılsın mı? (Yazdığı yazılar silinmez.)`)) run("deleteAuthor", { name: a });
              }}>✕</button>
            </span>
          ))}
        </div>
        <div className="row" style={{ maxWidth: 420 }}>
          <input className="field" style={{ flex: 1 }} placeholder="Yeni yazar adı" value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)} />
          <button className="btn" disabled={busy || !newAuthor.trim()}
            onClick={() => run("addAuthor", { name: newAuthor }, "Yazar eklendi", () => setNewAuthor(""))}>Ekle</button>
        </div>
      </section>

      {/* ---------------- KENDİ YAZILARIMIZ ---------------- */}
      <section className="panel">
        <h2 className="headline-font">Kendi Yazılarımız ve Raporlar</h2>
        <p className="hint">
          Paragrafları boş bir satırla ayır. Köşe yazıları ana sayfadaki "Köşe Yazıları" bölümünde,
          raporlar ise "Raporlar, Trendler ve İncelemeler" bölümünde seçtiğin başlığın altında görünür.
          İkisi de kendi sayfasında tam metin açılır.
        </p>

        {posts.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            {posts.map((p) => (
              <div key={p.id} className="list-row">
                <div>
                  <a href={`/yazi/${p.id}`} target="_blank" rel="noreferrer" style={{ fontWeight: 700, fontSize: 14 }}>{p.title}</a>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>
                    {p.type === "rapor" ? `Rapor · ${reportLabel(p.reportCategory)}` : "Köşe yazısı"}
                    {" · "}{p.author} · {new Date(p.createdAt).toLocaleDateString("tr-TR")}
                  </div>
                </div>
                <div className="row" style={{ flexShrink: 0 }}>
                  <button className="btn-ghost" onClick={() => { setPost({ id: p.id, author: p.author, title: p.title, body: p.body, type: p.type || "kose", reportCategory: p.reportCategory || "" }); window.scrollTo({ top: document.getElementById("yazi-formu").offsetTop - 20, behavior: "smooth" }); }}>Düzenle</button>
                  <button className="btn-ghost btn-danger" disabled={busy} onClick={() => {
                    if (confirm(`"${p.title}" silinsin mi?`)) run("deletePost", { id: p.id }, "Yazı silindi");
                  }}>Sil</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <h3 id="yazi-formu" className="headline-font" style={{ fontSize: 15, margin: "10px 0" }}>
          {post.id ? "İçeriği düzenle" : "Yeni içerik"}
        </h3>
        {authors.length === 0 ? (
          <p className="hint">Yazı ekleyebilmek için önce yukarıdan en az bir yazar ekle.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            <div className="row">
              <select className="field" style={{ maxWidth: 200 }} value={post.type}
                onChange={(e) => setPost({ ...post, type: e.target.value, reportCategory: "" })}>
                <option value="kose">Köşe yazısı</option>
                <option value="rapor">Rapor / inceleme</option>
              </select>
              {post.type === "rapor" && (
                <select className="field" style={{ maxWidth: 320 }} value={post.reportCategory}
                  onChange={(e) => setPost({ ...post, reportCategory: e.target.value })}>
                  <option value="">Bölüm seç…</option>
                  {REPORT_CATS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              )}
            </div>
            <select className="field" value={post.author} onChange={(e) => setPost({ ...post, author: e.target.value })} style={{ maxWidth: 320 }}>
              <option value="">Yazar seç…</option>
              {authors.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <input className="field" placeholder="Başlık" value={post.title} onChange={(e) => setPost({ ...post, title: e.target.value })} />
            <textarea className="field" rows={12} placeholder="Yazının metni…" value={post.body}
              onChange={(e) => setPost({ ...post, body: e.target.value })} />
            <div className="row">
              <button className="btn" disabled={busy || !post.author || !post.title.trim() || !post.body.trim() || (post.type === "rapor" && !post.reportCategory)}
                onClick={() => run("savePost", post, post.id ? "İçerik güncellendi" : "İçerik yayınlandı", () => setPost(emptyPost))}>
                {post.id ? "Değişiklikleri kaydet" : "Yayınla"}
              </button>
              {post.id && <button className="btn-ghost" onClick={() => setPost(emptyPost)}>Vazgeç</button>}
            </div>
          </div>
        )}
      </section>

      {/* ---------------- SEÇME KÖŞE YAZARLARI ---------------- */}
      <section className="panel">
        <h2 className="headline-font">Seçme Köşe Yazarları</h2>
        <p className="hint">
          Dış kaynaklardan takip ettiğin yazarlar. Sadece yazı başlığı ve orijinal yazıya link alınır, metin kopyalanmaz.
          Son 7 günün en fazla 3 yazısı gösterilir. Adres eklenirken RSS'in okunabildiği kontrol edilir.
        </p>
        {columnists.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {columnists.map((c) => (
              <div key={c.id} className="list-row">
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}{c.source ? ` · ${c.source}` : ""}</div>
                  <div style={{ fontSize: 11.5, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.url}{c.filterByName ? " · isme göre süzülüyor" : ""}
                  </div>
                </div>
                <button className="btn-ghost btn-danger" disabled={busy} onClick={() => {
                  if (confirm(`${c.name} takipten çıkarılsın mı?`)) run("deleteColumnist", { id: c.id }, "Yazar takipten çıkarıldı");
                }}>Kaldır</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "grid", gap: 8, maxWidth: 520 }}>
          <div className="row">
            <input className="field" style={{ flex: 2, minWidth: 160 }} placeholder="Yazar adı" value={newCol.name}
              onChange={(e) => setNewCol({ ...newCol, name: e.target.value })} />
            <input className="field" style={{ flex: 1, minWidth: 120 }} placeholder="Gazete (örn. Hürriyet)" value={newCol.source}
              onChange={(e) => setNewCol({ ...newCol, source: e.target.value })} />
          </div>
          <input className="field" placeholder="RSS adresi (https://…)" value={newCol.url}
            onChange={(e) => setNewCol({ ...newCol, url: e.target.value })} />
          <label style={{ fontSize: 13, display: "flex", gap: 8, alignItems: "center", color: "var(--muted)" }}>
            <input type="checkbox" checked={newCol.filterByName} onChange={(e) => setNewCol({ ...newCol, filterByName: e.target.checked })} />
            Bu adres birçok yazarın ortak beslemesi; sadece bu yazarın adı geçenleri al
          </label>
          <button className="btn" style={{ justifySelf: "start" }} disabled={busy || !newCol.name.trim() || !newCol.url.trim()}
            onClick={() => run("addColumnist", newCol, "Yazar takibe alındı. Yazılarını görmek için 'Şimdi güncelle'ye bas.",
              () => setNewCol({ name: "", source: "", url: "", filterByName: false }))}>
            {busy ? "Adres kontrol ediliyor…" : "+ Yazarı takibe al"}
          </button>
        </div>
      </section>
    </main>
  );
}
