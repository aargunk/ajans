// "Eğitim şablonu": Ayarlar sayfasındaki tek düğmeyle uygulanan
// hazır kaynak ve kategori listesi. Köşe yazıları ve yazarlar etkilenmez.

export const EDUCATION_FEEDS = [
  // --- Türkiye ---
  { name: "Hürriyet - Eğitim", url: "https://www.hurriyet.com.tr/rss/egitim", foreign: false },
  { name: "Sözcü - Eğitim", url: "https://www.sozcu.com.tr/feeds-rss-category-egitim", foreign: false },
  { name: "Milliyet - Gündem", url: "https://www.milliyet.com.tr/rss/rssnew/gundemrss.xml", foreign: false },
  { name: "NTV - Gündem", url: "https://www.ntv.com.tr/gundem.rss", foreign: false },
  { name: "CNN Türk", url: "https://www.cnnturk.com/feed/rss/news", foreign: false },

  // --- Uluslararası (başlıkları Türkçeye çevrilir) ---
  { name: "Inside Higher Ed", url: "https://www.insidehighered.com/rss.xml", foreign: true },
  { name: "EdSurge", url: "https://www.edsurge.com/articles_rss", foreign: true },
  { name: "eSchool News", url: "https://www.eschoolnews.com/feed/", foreign: true },
  { name: "The PIE News", url: "https://thepienews.com/feed/", foreign: true },
  { name: "THE Journal", url: "https://thejournal.com/rss-feeds/news.aspx", foreign: true },
];

export const EDUCATION_HTML_SOURCES = [
  {
    name: "Times Higher Education",
    url: "https://www.timeshighereducation.com/academic/news",
    linkPattern: "/news/, /depth/",
    defaultCategory: "yuksekogretim-politika",
    foreign: true,
  },
];

export const EDUCATION_CATEGORIES = [
  {
    id: "edtech-yapay-zeka",
    label: "EdTech & Yapay Zekâ",
    keywords: [
      // Sınıfta AI ve uyarlamalı öğrenme
      "yapay zeka", "yapay zekâ", "uyarlamalı öğrenme", "akıllı tahta", "eğitim teknolojisi", "edtech",
      "öğrenme yönetim sistemi", "uzaktan eğitim", "çevrimiçi ders", "dijital içerik",
      "sanal gerçeklik", "artırılmış gerçeklik", "veri gizliliği", "siber güvenlik", "okul altyapısı",
      "artificial intelligence", "generative ai", "chatgpt", "adaptive learning", "ai tutor",
      "learning management system", "lms", "ed tech", "online learning", "digital learning",
      "virtual reality", "augmented reality", "cybersecurity", "data privacy", "student data",
      "school infrastructure", "broadband", "device rollout",
    ],
  },
  {
    id: "sinif-ici-pedagoji",
    label: "Sınıf İçi Pedagoji & Uygulama",
    keywords: [
      "öğretim stratejisi", "müfredat tasarımı", "ders tasarımı", "ölçme ve değerlendirme", "sınav güvenliği",
      "öğrenci katılımı", "motivasyon", "sosyo-duygusal öğrenme", "sınıf yönetimi",
      "stem", "proje tabanlı öğrenme", "disiplinlerarası", "okuma yazma", "matematik başarısı",
      "teaching strategy", "pedagogy", "curriculum design", "assessment", "grading", "exam integrity",
      "academic integrity", "student engagement", "motivation", "social emotional learning", "sel",
      "classroom management", "project based learning", "literacy", "numeracy", "stem education",
    ],
  },
  {
    id: "yuksekogretim-politika",
    label: "Yükseköğretim & Politika",
    keywords: [
      "üniversite", "yök", "rektör", "dekan", "senato", "akreditasyon", "üniversite bütçesi",
      "akademik özgürlük", "yükseköğretim reformu", "kampüs", "araştırma politikası", "teşvik",
      "mevzuat", "yönetmelik", "harç", "burs", "öğretim üyesi", "kadro",
      "higher education", "university", "college", "provost", "chancellor", "board of trustees",
      "accreditation", "academic freedom", "tenure", "campus", "endowment", "budget cut",
      "federal funding", "department of education", "policy", "legislation", "regulation", "tuition",
    ],
  },
  {
    id: "kuresel-egitim-mobilite",
    label: "Küresel Eğitim & Mobilite",
    keywords: [
      "uluslararası öğrenci", "öğrenci vizesi", "yurt dışında eğitim", "erasmus", "değişim programı",
      "üniversite sıralaması", "dünya sıralaması", "sıralama", "yurt dışı kampüs", "ortak program",
      "çift diploma", "akademisyen değişimi", "göç politikası",
      "international student", "student visa", "study abroad", "student mobility", "visa policy",
      "world university rankings", "qs ranking", "the rankings", "branch campus", "transnational education",
      "joint programme", "dual degree", "immigration policy", "recruitment agent", "enrolment decline",
    ],
  },
  {
    id: "edtech-pazari-kariyer",
    label: "EdTech Pazarı & Kariyer",
    keywords: [
      "yatırım turu", "girişim sermayesi", "satın alma", "birleşme", "pazar payı", "eğitim yatırımı",
      "mesleki eğitim", "meslek lisesi", "okul sanayi iş birliği", "istihdam", "kariyer", "beceri açığı",
      "staj", "mezun istihdamı", "hibe",
      "funding round", "venture capital", "series a", "acquisition", "merger", "market size",
      "edtech market", "valuation", "layoffs", "workforce development", "career technical education",
      "cte", "apprenticeship", "skills gap", "employability", "graduate employment", "grant",
    ],
  },
];

// Haber akışının dışında, elle yazılan araştırma ve inceleme içerikleri.
export const REPORT_CATEGORIES = [
  {
    id: "trend-raporlari",
    label: "Sektörel Trend Raporları",
    description: "Yıllık ve beş yıllık eğitim teknolojisi öngörüleri, geleceğin meslekleri, dijital dönüşüm raporlarının Türkçe özetleri.",
  },
  {
    id: "altyapi-rehberleri",
    label: "Altyapı & Satın Alma Rehberleri",
    description: "Okul ve üniversitelerin donanım, yazılım ve teknoloji seçimlerinde kullanabileceği teknik incelemeler ve karşılaştırmalar.",
  },
  {
    id: "kuresel-endeksler",
    label: "Küresel Endeks & Analizler",
    description: "THE, QS ve Dünya Bankası gibi kurumların eğitim performansı, sürdürülebilirlik ve kalite sıralamalarının özetleri.",
  },
  {
    id: "pazar-bultenleri",
    label: "Pazar & Yatırım Bültenleri",
    description: "EdTech sektöründeki finansal gelişmeler, devlet hibeleri ve pazar payı analizleri.",
  },
];
