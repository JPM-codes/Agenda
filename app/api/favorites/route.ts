import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "";
  const q = url.searchParams.get("q") ?? "";
  const userId = auth.user.id;

  const notes = db
    .prepare(
      `SELECT id, title, content, category, tags, created_at, updated_at, 'nota' AS type
       FROM notes WHERE user_id = ? AND is_favorite = 1
       ORDER BY updated_at DESC LIMIT 200`
    )
    .all(userId);

  const tips = db
    .prepare(
      `SELECT id, title, content, category, tags, created_at, updated_at, 'dica' AS type
       FROM tips WHERE user_id = ? AND is_favorite = 1
       ORDER BY updated_at DESC LIMIT 200`
    )
    .all(userId);

  const tasks = db
    .prepare(
      `SELECT id, title, description AS content, category, tags, created_at, updated_at, 'tarefa' AS type
       FROM tasks WHERE user_id = ? AND is_favorite = 1
       ORDER BY updated_at DESC LIMIT 200`
    )
    .all(userId);

  let items = [...notes, ...tips, ...tasks];
  if (type && ["nota", "dica", "tarefa"].includes(type)) {
    items = items.filter((i) => (i as { type: string }).type === type);
  }
  if (q) {
    const like = q.toLowerCase();
    items = items.filter((i) =>
      ((i as { title: string }).title || "").toLowerCase().includes(like) ||
      ((i as { content: string }).content || "").toLowerCase().includes(like) ||
      ((i as { category: string }).category || "").toLowerCase().includes(like)
    );
  }

  return NextResponse.json({ favorites: items });
}
