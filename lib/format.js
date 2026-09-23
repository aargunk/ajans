// Sunucu UTC saatinde çalıştığı için saat dilimini açıkça veriyoruz.
export function formatDate(iso, withTime = true) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      timeZone: "Europe/Istanbul",
      day: "2-digit",
      month: "2-digit",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : { year: "numeric" }),
    });
  } catch {
    return "";
  }
}

export function initials(name) {
  return (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toLocaleUpperCase("tr-TR"))
    .join("");
}
