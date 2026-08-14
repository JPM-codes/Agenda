import { NextResponse } from "next/server";
import { requireUser, parseBody, str, int } from "@/lib/api";
import { db } from "@/lib/db";
import { nowLocalDateTime } from "@/lib/utils";

const PRIORITIES = ["alta", "media", "baixa"];
const STATUSES = ["pendente", "em_andamento", "concluida", "cancelada"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId)) {
    return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
  }

  const existing = db.prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?").get(taskId, auth.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Tarefa não encontrada." }, { status: 404 });
  }

  const parsed = await parseBody(request);
  if (!parsed.ok) return parsed.response;

  const fields = existing as Record<string, string | number | null>;
  if (parsed.body.title !== undefined) fields.title = str(parsed.body.title);
  if (parsed.body.description !== undefined) fields.description = str(parsed.body.description);
  if (parsed.body.due_date !== undefined) fields.due_date = str(parsed.body.due_date) || null;
  if (parsed.body.due_time !== undefined) fields.due_time = str(parsed.body.due_time) || null;
  if (parsed.body.priority !== undefined) fields.priority = PRIORITIES.includes(str(parsed.body.priority)) ? str(parsed.body.priority) : fields.priority;
  if (parsed.body.category !== undefined) fields.category = str(parsed.body.category);
  if (parsed.body.tags !== undefined) fields.tags = str(parsed.body.tags);
  if (parsed.body.is_favorite !== undefined) fields.is_favorite = int(parsed.body.is_favorite) ?? 0;

  let status = fields.status;
  if (parsed.body.status !== undefined) {
    status = STATUSES.includes(str(parsed.body.status)) ? str(parsed.body.status) : status;
  }
  const completedAt =
    status === "concluida" && fields.completed_at == null
      ? str(parsed.body.completedAt) || nowLocalDateTime()
      : undefined;
  if (parsed.body.status === "concluida" && fields.completed_at == null) {
    fields.completed_at = completedAt ?? null;
  }
  if (parsed.body.status !== undefined && status !== "concluida") {
    fields.completed_at = null;
  }
  fields.status = status;

  if (!str(fields.title)) {
    return NextResponse.json({ error: "Informe o título da tarefa (RN-010)." }, { status: 400 });
  }

  db.prepare(
    `UPDATE tasks SET title = ?, description = ?, due_date = ?, due_time = ?, priority = ?,
     status = ?, category = ?, tags = ?, is_favorite = ?, completed_at = ?, updated_at = datetime('now')
     WHERE id = ? AND user_id = ?`
  ).run(
    fields.title,
    fields.description,
    fields.due_date,
    fields.due_time,
    fields.priority,
    fields.status,
    fields.category,
    fields.tags,
    fields.is_favorite,
    fields.completed_at,
    taskId,
    auth.user.id
  );

  const task = db.prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?").get(taskId, auth.user.id);
  return NextResponse.json({ task });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const taskId = Number(id);
  if (!Number.isInteger(taskId)) {
    return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
  }

  const result = db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").run(taskId, auth.user.id);
  if (result.changes === 0) {
    return NextResponse.json({ error: "Tarefa não encontrada." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
