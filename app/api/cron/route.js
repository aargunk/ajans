import { kvConfigured } from "../../../lib/kv-safe";
import { runCollect } from "../../../lib/collect";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request) {
  if (!kvConfigured) {
    return Response.json(
      { error: "KV bağlı değil: KV_REST_API_URL / KV_REST_API_TOKEN eksik." },
      { status: 500 }
    );
  }

  const expected = process.env.CRON_SECRET;
  if (expected) {
    const authHeader = request.headers.get("authorization");
    const secretParam = new URL(request.url).searchParams.get("secret");
    if (authHeader !== `Bearer ${expected}` && secretParam !== expected) {
      return Response.json({ error: "yetkisiz" }, { status: 401 });
    }
  }

  const result = await runCollect();
  return Response.json(result);
}
