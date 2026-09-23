// Ayarlar sayfası için basit şifre koruması.
// Şifre Vercel'de ADMIN_PASSWORD ortam değişkeninde durur; tarayıcıya
// şifrenin kendisi değil, ondan türetilmiş bir anahtar çerez olarak yazılır.
import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE = "hp_admin";

export function adminConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function sessionToken() {
  return crypto
    .createHash("sha256")
    .update("haber-panosu-oturum:" + process.env.ADMIN_PASSWORD)
    .digest("hex");
}

function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function isAdmin() {
  if (!adminConfigured()) return false;
  const v = cookies().get(COOKIE)?.value;
  return Boolean(v) && safeEqual(v, sessionToken());
}

export function checkPassword(password) {
  if (!adminConfigured() || typeof password !== "string") return false;
  return safeEqual(password, process.env.ADMIN_PASSWORD);
}

export function setAdminCookie() {
  cookies().set(COOKIE, sessionToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 gün
  });
}

export function clearAdminCookie() {
  cookies().delete(COOKIE);
}
