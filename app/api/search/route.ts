import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const userId = auth.user.id;
  const like = `%${q}%`;

  const notes = db
    .prepare(
      `SELECT id, title, content, category, updated_at AS date, 'nota' AS module
       FROM notes WHERE user_id = ? AND (title LIKE ? OR content LIKE ? OR category LIKE ? OR tags LIKE ?)
       ORDER BY updated_at DESC LIMIT 15`
    )
    .all(userId, like, like, like, like);

  const tips = db
    .prepare(
      `SELECT id, title, content, category, updated_at AS date, 'dica' AS module
       FROM tips WHERE user_id = ? AND (title LIKE ? OR content LIKE ? OR category LIKE ? OR tags LIKE ?)
       ORDER BY updated_at DESC LIMIT 15`
    )
    .all(userId, like, like, like, like);

  const tasks = db
    .prepare(
      `SELECT id, title, description AS content, category, due_date AS date, 'tarefa' AS module
       FROM tasks WHERE user_id = ? AND (title LIKE ? OR description LIKE ? OR category LIKE ? OR tags LIKE ?)
       ORDER BY created_at DESC LIMIT 15`
    )
    .all(userId, like, like, like, like);

  const reminders = db
    .prepare(
      `SELECT id, title, description AS content, '' AS category, reminder_date AS date, 'lembrete' AS module
       FROM reminders WHERE user_id = ? AND (title LIKE ? OR description LIKE ?)
       ORDER BY reminder_date DESC LIMIT 15`
    )
    .all(userId, like, like);

  return NextResponse.json({ results: [...notes, ...tips, ...tasks, ...reminders] });
}
