// ============================================================
// Haber kaynakları (FEEDS) bu dosyada tanımlı.
// KATEGORİLER artık sitedeki /ayarlar sayfasından yönetiliyor.
// Aşağıdaki CATEGORIES listesi yalnızca ilk kurulumda, Ayarlar'da
// henüz hiç değişiklik yapılmamışken kullanılan varsayılan listedir.
// ============================================================

// 1) Taranacak RSS kaynakları.
export const FEEDS = [
  { name: "Hürriyet - Anasayfa", url: "https://www.hurriyet.com.tr/rss/anasayfa" },
  { name: "Hürriyet - Spor", url: "https://www.hurriyet.com.tr/rss/spor" },
  { name: "Hürriyet - Teknoloji", url: "https://www.hurriyet.com.tr/rss/teknoloji" },
  { name: "Hürriyet - Eğitim", url: "https://www.hurriyet.com.tr/rss/egitim" },
  { name: "Hürriyet - Ekonomi", url: "https://www.hurriyet.com.tr/rss/ekonomi" },
  { name: "Hürriyet - Gündem", url: "https://www.hurriyet.com.tr/rss/gundem" },
  { name: "Sözcü - Gündem", url: "https://www.sozcu.com.tr/feeds-rss-category-gundem" },
  { name: "Sözcü - Spor", url: "https://www.sozcu.com.tr/feeds-rss-category-spor" },
  { name: "Sözcü - Futbol", url: "https://www.sozcu.com.tr/feeds-rss-category-futbol" },
  { name: "Sözcü - Ekonomi", url: "https://www.sozcu.com.tr/feeds-rss-category-ekonomi" },
  { name: "Sözcü - Eğitim", url: "https://www.sozcu.com.tr/feeds-rss-category-egitim" },
  { name: "Sözcü - Bilim ve Teknoloji", url: "https://www.sozcu.com.tr/feeds-rss-category-bilim-teknoloji" },
  { name: "Milliyet - Anasayfa", url: "https://www.milliyet.com.tr/rss/rssnew/gundemrss.xml" },
  // Bilime, tenise veya belirli bir takıma özel kaynak eklemek istersen
  // buraya aynı formatta ekle, örn:
  // { name: "Fanatik - Galatasaray", url: "https://www.fanatik.com.tr/rss/galatasaray" },
  // { name: "Webrazzi", url: "https://webrazzi.com/feed/" },
];

// 2) Kategoriler. Her biri bağımsız bir anahtar kelime setiyle çalışır,
//    bir haber birden fazla kategoriye aynı anda düşebilir
//    (örn. "Galatasaray'ın Şampiyonlar Ligi maçı" hem "Galatasaray"
//    hem "Futbol" hem "Spor" kategorisine girer).
//    Yeni kategori eklemek için listeye aynı formatta bir obje ekle.
export const CATEGORIES = [
  { id: "spor", label: "Spor", keywords: ["spor", "şampiyon", "milli takım", "lig"] },
  { id: "galatasaray", label: "Galatasaray", keywords: ["galatasaray", "gs "] },
  { id: "futbol", label: "Futbol", keywords: ["futbol", "gol", "maç", "transfer", "süper lig"] },
  { id: "tenis", label: "Tenis", keywords: ["tenis", "grand slam", "wimbledon", "roland garros"] },
  { id: "teknoloji", label: "Teknoloji", keywords: ["teknoloji", "yazılım", "startup", "google", "openai", "chatgpt", "yapay zeka"] },
  { id: "bilim", label: "Bilim", keywords: ["bilim", "araştırma", "keşif", "nasa", "uzay", "bilim insanları"] },
  { id: "egitim", label: "Eğitim", keywords: ["eğitim", "üniversite", "yök", "yks", "okul", "öğrenci", "akademik"] },
  { id: "siyaset", label: "Siyaset", keywords: ["siyaset", "meclis", "cumhurbaşkanı", "bakanlık", "parti"] },
  { id: "tr-ekonomi", label: "Türkiye Ekonomisi", keywords: ["enflasyon", "dolar", "merkez bankası", "faiz", "ekonomi", "borsa"] },
  { id: "tr-siyaset", label: "Türkiye Siyaseti", keywords: ["ak parti", "chp", "mhp", "iyi parti", "tbmm", "türkiye siyaset"] },
  // Yeni kategori örneği:
  // { id: "saglik", label: "Sağlık", keywords: ["sağlık", "hastane", "aşı", "doktor"] },
];

// 3) Her taramada kaynak başına en fazla kaç haber işlensin.
export const MAX_ITEMS_PER_FEED = 30;

// 4) KV'de tutulan toplam haber sayısı üst sınırı.
export const MAX_STORED_ITEMS = 500;
