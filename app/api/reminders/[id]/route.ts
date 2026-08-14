import { NextResponse } from "next/server";
import { requireUser, parseBody, str } from "@/lib/api";
import { db } from "@/lib/db";

const RECURRENCES = ["none", "daily", "weekly", "monthly", "yearly"];
const STATUSES = ["agendado", "concluido", "arquivado"];
const PRIORITIES = ["alta", "media", "baixa"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const reminderId = Number(id);
  if (!Number.isInteger(reminderId)) {
    return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
  }

  const existing = db
    .prepare("SELECT * FROM reminders WHERE id = ? AND user_id = ?")
    .get(reminderId, auth.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Lembrete não encontrado." }, { status: 404 });
  }

  const parsed = await parseBody(request);
  if (!parsed.ok) return parsed.response;

  const fields = existing as Record<string, string | number | null>;
  if (parsed.body.title !== undefined) fields.title = str(parsed.body.title);
  if (parsed.body.description !== undefined) fields.description = str(parsed.body.description);
  if (parsed.body.reminder_date !== undefined) fields.reminder_date = str(parsed.body.reminder_date);
  if (parsed.body.reminder_time !== undefined) fields.reminder_time = str(parsed.body.reminder_time);
  if (parsed.body.recurrence !== undefined)
    fields.recurrence = RECURRENCES.includes(str(parsed.body.recurrence)) ? str(parsed.body.recurrence) : fields.recurrence;
  if (parsed.body.priority !== undefined)
    fields.priority = PRIORITIES.includes(str(parsed.body.priority)) ? str(parsed.body.priority) : fields.priority;
  if (parsed.body.status !== undefined)
    fields.status = STATUSES.includes(str(parsed.body.status)) ? str(parsed.body.status) : fields.status;

  if (!str(fields.title)) {
    return NextResponse.json({ error: "Informe o título do lembrete." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str(fields.reminder_date))) {
    return NextResponse.json({ error: "Informe a data do lembrete (RN-015)." }, { status: 400 });
  }
  if (!/^\d{2}:\d{2}/.test(str(fields.reminder_time))) {
    return NextResponse.json({ error: "Informe o horário do lembrete (RN-015)." }, { status: 400 });
  }

  db.prepare(
    `UPDATE reminders SET title = ?, description = ?, reminder_date = ?, reminder_time = ?,
     recurrence = ?, priority = ?, status = ?, updated_at = datetime('now')
     WHERE id = ? AND user_id = ?`
  ).run(
    fields.title,
    fields.description,
    fields.reminder_date,
    fields.reminder_time,
    fields.recurrence,
    fields.priority,
    fields.status,
    reminderId,
    auth.user.id
  );

  const reminder = db
    .prepare("SELECT * FROM reminders WHERE id = ? AND user_id = ?")
    .get(reminderId, auth.user.id);
  return NextResponse.json({ reminder });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const reminderId = Number(id);
  if (!Number.isInteger(reminderId)) {
    return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
  }

  const result = db
    .prepare("DELETE FROM reminders WHERE id = ? AND user_id = ?")
    .run(reminderId, auth.user.id);
  if (result.changes === 0) {
    return NextResponse.json({ error: "Lembrete não encontrado." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
