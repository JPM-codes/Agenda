import { NextResponse } from "next/server";
import { requireUser, parseBody, str, int } from "@/lib/api";
import { db } from "@/lib/db";
import { nowLocalDateTime } from "@/lib/utils";

const PRIORITIES = ["alta", "media", "baixa"];
const STATUSES = ["pendente", "em_andamento", "concluida", "cancelada"];

export async function GET(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "";
  const priority = url.searchParams.get("priority") ?? "";
  const q = url.searchParams.get("q") ?? "";
  const date = url.searchParams.get("date") ?? "";
  const favorite = url.searchParams.get("favorite") === "1";
  const category = url.searchParams.get("category") ?? "";

  const where: string[] = ["user_id = ?"];
  const params: (string | number)[] = [auth.user.id];

  if (status && STATUSES.includes(status)) {
    where.push("status = ?");
    params.push(status);
  }
  if (priority && PRIORITIES.includes(priority)) {
    where.push("priority = ?");
    params.push(priority);
  }
  if (q) {
    where.push("(title LIKE ? OR description LIKE ? OR category LIKE ? OR tags LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  if (date) {
    where.push("due_date = ?");
    params.push(date);
  }
  if (favorite) {
    where.push("is_favorite = 1");
  }
  if (category) {
    where.push("category = ?");
    params.push(category);
  }

  const rows = db
    .prepare(`SELECT * FROM tasks WHERE ${where.join(" AND ")} ORDER BY
      CASE status WHEN 'pendente' THEN 0 WHEN 'em_andamento' THEN 1 WHEN 'concluida' THEN 2 ELSE 3 END,
      CASE priority WHEN 'alta' THEN 0 WHEN 'media' THEN 1 ELSE 2 END,
      due_date IS NULL, due_date ASC, due_time ASC, created_at DESC`)
    .all(...params);

  return NextResponse.json({ tasks: rows });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const parsed = await parseBody(request);
  if (!parsed.ok) return parsed.response;

  const title = str(parsed.body.title);
  if (!title) {
    return NextResponse.json({ error: "Informe o título da tarefa (RN-010)." }, { status: 400 });
  }

  const priority = PRIORITIES.includes(str(parsed.body.priority)) ? str(parsed.body.priority) : "media";
  const status = STATUSES.includes(str(parsed.body.status)) ? str(parsed.body.status) : "pendente";
  const completedAt = status === "concluida" ? nowLocalDateTime() : null;

  const result = db
    .prepare(
      `INSERT INTO tasks (user_id, title, description, due_date, due_time, priority, status, category, tags, is_favorite, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      auth.user.id,
      title,
      str(parsed.body.description),
      str(parsed.body.due_date) || null,
      str(parsed.body.due_time) || null,
      priority,
      status,
      str(parsed.body.category),
      str(parsed.body.tags),
      int(parsed.body.is_favorite) ?? 0,
      completedAt ?? null
    );

  const task = db
    .prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
    .get(Number(result.lastInsertRowid), auth.user.id);
  return NextResponse.json({ task });
}
