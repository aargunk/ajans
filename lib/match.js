// Türkçe karakterleri normalize edip büyük/küçük harf farkını kaldırır,
// böylece "Üniversite" de "üniversite" anahtar kelimesiyle eşleşir.
function normalize(text) {
  return (text || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[İI]/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Bir haber metninin hangi kategorilere girdiğini döndürür.
export function matchCategories(text, categories) {
  const normalized = normalize(text);
  return categories
    .filter((cat) =>
      cat.keywords.some((kw) => normalized.includes(normalize(kw)))
    )
    .map((cat) => cat.id);
}
