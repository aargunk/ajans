// Redis (Upstash) istemcisi.
// ÖNEMLİ: @vercel/kv varsayılan olarak cache: "default" kullanır; Next.js de bu
// yüzden sayfalardaki okumaları önbelleğe alıp eski veriyi gösterebilir.
// Burada her okumanın doğrudan veritabanından yapılmasını zorunlu kılıyoruz.
import { createClient } from "@vercel/kv";
import { unstable_noStore as noStore } from "next/cache";

export const kvConfigured = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
);

export const kv = kvConfigured
  ? createClient({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
      cache: "no-store",
    })
  : null;

export async function safeGet(key, fallback) {
  noStore(); // bu okumayı içeren sayfayı her istekte yeniden oluştur
  if (!kvConfigured) return fallback;
  try {
    const value = await kv.get(key);
    return value ?? fallback;
  } catch (err) {
    console.error("KV okuma hatası:", err);
    return fallback;
  }
}
