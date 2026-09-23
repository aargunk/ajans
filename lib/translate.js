// Yabancı dildeki haberlerin başlığını Türkçeye çevirir ve kısa bir özet yazar.
// Yalnızca yeni gelen haberler için, toplu halde (tek istekte 20 haber) çalışır.
// ANTHROPIC_API_KEY tanımlı değilse veya API hata verirse haberler
// özgün haliyle kalır — site çalışmaya devam eder.

const MODEL = "claude-haiku-4-5-20251001";
const BATCH = 20;

const SYSTEM = `Sen bir haber editörüsün. Sana yabancı dilde haber başlıkları ve varsa kısa açıklamaları verilecek.
Her haber için:
- "t": başlığın doğal, akıcı Türkçe karşılığı (haber başlığı üslubunda, tırnaksız)
- "s": iki-üç cümlelik Türkçe özet. SADECE sana verilen bilgiye dayan; bilgi azsa özeti kısa tut, asla uydurma.
Yanıtını YALNIZCA şu biçimde bir JSON dizisi olarak ver, başka hiçbir metin ekleme:
[{"i":0,"t":"...","s":"..."}]`;

async function translateBatch(batch, apiKey) {
  const payload = batch.map((item, i) => ({
    i,
    title: item.title,
    excerpt: (item.excerpt || "").slice(0, 300),
  }));

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    signal: AbortSignal.timeout(45000),
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4000,
      system: SYSTEM,
      messages: [{ role: "user", content: JSON.stringify(payload) }],
    }),
  });

  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 200)}`);

  const data = await res.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .replace(/```json|```/g, "")
    .trim();

  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error("beklenmeyen yanıt biçimi");

  for (const row of parsed) {
    const item = batch[row?.i];
    if (!item) continue;
    if (typeof row.t === "string" && row.t.trim()) item.titleTr = row.t.trim();
    if (typeof row.s === "string" && row.s.trim()) item.summaryTr = row.s.trim();
  }
}

// items dizisini yerinde günceller; { cevrilen, hatalar } döndürür.
export async function translateItems(items) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { cevrilen: 0, hatalar: items.length ? ["ANTHROPIC_API_KEY tanımlı değil, çeviri atlandı"] : [] };
  }
  if (items.length === 0) return { cevrilen: 0, hatalar: [] };

  const hatalar = [];
  let cevrilen = 0;

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    try {
      await translateBatch(batch, apiKey);
      cevrilen += batch.filter((x) => x.titleTr).length;
    } catch (err) {
      hatalar.push("çeviri: " + String(err).slice(0, 160));
    }
  }

  return { cevrilen, hatalar };
}
