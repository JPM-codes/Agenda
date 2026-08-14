import { NextResponse } from "next/server";
import { requireUser, parseBody, str, int } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const pinned = url.searchParams.get("pinned") === "1";
  const favorite = url.searchParams.get("favorite") === "1";
  const category = url.searchParams.get("category") ?? "";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 200) || 200, 1), 500);

  const where: string[] = ["user_id = ?"];
  const params: (string | number)[] = [auth.user.id];

  if (q) {
    where.push("(title LIKE ? OR content LIKE ? OR category LIKE ? OR tags LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  if (pinned) {
    where.push("is_pinned = 1");
  }
  if (favorite) {
    where.push("is_favorite = 1");
  }
  if (category) {
    where.push("category = ?");
    params.push(category);
  }

  const rows = db
    .prepare(
      `SELECT * FROM notes WHERE ${where.join(" AND ")}
       ORDER BY is_pinned DESC, updated_at DESC LIMIT ?`
    )
    .all(...params, limit);

  return NextResponse.json({ notes: rows });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const parsed = await parseBody(request);
  if (!parsed.ok) return parsed.response;

  const title = str(parsed.body.title);
  const content = str(parsed.body.content);
  if (!title && !content) {
    return NextResponse.json({ error: "A anotação precisa de um título ou conteúdo." }, { status: 400 });
  }

  const result = db
    .prepare(
      `INSERT INTO notes (user_id, title, content, category, tags, is_favorite, is_pinned, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      auth.user.id,
      title,
      content,
      str(parsed.body.category),
      str(parsed.body.tags),
      int(parsed.body.is_favorite) ?? 0,
      int(parsed.body.is_pinned) ?? 0,
      str(parsed.body.source) || "digitacao"
    );

  const note = db
    .prepare("SELECT * FROM notes WHERE id = ? AND user_id = ?")
    .get(Number(result.lastInsertRowid), auth.user.id);
  return NextResponse.json({ note });
}
