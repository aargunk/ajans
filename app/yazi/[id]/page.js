import { notFound } from "next/navigation";
import { getPosts, excerptOf } from "../../../lib/settings";
import { formatDate, initials } from "../../../lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

async function findPost(id) {
  const posts = await getPosts();
  return posts.find((p) => p.id === id);
}

export async function generateMetadata({ params }) {
  const post = await findPost(params.id);
  if (!post) return { title: "Yazı bulunamadı · Haber Panosu" };
  return { title: `${post.title} · ${post.author}`, description: excerptOf(post.body, 160) };
}

export default async function PostPage({ params }) {
  const post = await findPost(params.id);
  if (!post) notFound();

  // Metin düz yazı olarak saklanır: boş satırlar paragrafı, tek satır sonları alt satırı belirler.
  const paragraphs = post.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <main className="page" style={{ maxWidth: 720 }}>
      <a href="/" style={{ fontSize: 13, color: "var(--muted)" }}>← Haber Panosu</a>
      <article style={{ marginTop: 24 }}>
        <div className="kicker">Köşe Yazısı</div>
        <h1 className="headline-font" style={{ fontSize: 34, lineHeight: 1.2, margin: "8px 0 18px" }}>{post.title}</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center", paddingBottom: 18, borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
          <div className="avatar avatar-own" style={{ width: 46, height: 46, fontSize: 15 }}>{initials(post.author)}</div>
          <div>
            <div style={{ fontWeight: 700 }}>{post.author}</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)" }}>
              {formatDate(post.createdAt, false)}
              {post.updatedAt && post.updatedAt !== post.createdAt ? ` · güncellendi ${formatDate(post.updatedAt, false)}` : ""}
            </div>
          </div>
        </div>
        <div className="headline-font" style={{ fontSize: 19, lineHeight: 1.75 }}>
          {paragraphs.map((para, i) => (
            <p key={i} style={{ margin: "0 0 1.1em", whiteSpace: "pre-line" }}>{para}</p>
          ))}
        </div>
      </article>
    </main>
  );
}
