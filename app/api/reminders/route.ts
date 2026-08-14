import { NextResponse } from "next/server";
import { requireUser, parseBody, str } from "@/lib/api";
import { db } from "@/lib/db";

const RECURRENCES = ["none", "daily", "weekly", "monthly", "yearly"];
const STATUSES = ["agendado", "concluido", "arquivado"];
const PRIORITIES = ["alta", "media", "baixa"];

export async function GET(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "";
  const q = url.searchParams.get("q") ?? "";
  const date = url.searchParams.get("date") ?? "";
  const upcoming = url.searchParams.get("upcoming") === "1";

  const where: string[] = ["user_id = ?"];
  const params: (string | number)[] = [auth.user.id];

  if (status && STATUSES.includes(status)) {
    where.push("status = ?");
    params.push(status);
  }
  if (q) {
    where.push("(title LIKE ? OR description LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like);
  }
  if (date) {
    where.push("reminder_date = ?");
    params.push(date);
  }

  let sql = `SELECT * FROM reminders WHERE ${where.join(" AND ")}`;
  if (upcoming) {
    sql += ` AND status = 'agendado' AND (reminder_date > date('now') OR (reminder_date = date('now') AND reminder_time >= time('now')))`;
  }
  sql += " ORDER BY reminder_date ASC, reminder_time ASC";

  const rows = db.prepare(sql).all(...params);
  return NextResponse.json({ reminders: rows });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const parsed = await parseBody(request);
  if (!parsed.ok) return parsed.response;

  const title = str(parsed.body.title);
  const reminderDate = str(parsed.body.reminder_date);
  const reminderTime = str(parsed.body.reminder_time);

  if (!title) {
    return NextResponse.json({ error: "Informe o título do lembrete." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(reminderDate)) {
    return NextResponse.json({ error: "Informe a data do lembrete (RN-015)." }, { status: 400 });
  }
  if (!/^\d{2}:\d{2}/.test(reminderTime)) {
    return NextResponse.json({ error: "Informe o horário do lembrete (RN-015)." }, { status: 400 });
  }

  const recurrence = RECURRENCES.includes(str(parsed.body.recurrence)) ? str(parsed.body.recurrence) : "none";
  const priority = PRIORITIES.includes(str(parsed.body.priority)) ? str(parsed.body.priority) : "media";
  const status = STATUSES.includes(str(parsed.body.status)) ? str(parsed.body.status) : "agendado";

  const result = db
    .prepare(
      `INSERT INTO reminders (user_id, title, description, reminder_date, reminder_time, recurrence, priority, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(auth.user.id, title, str(parsed.body.description), reminderDate, reminderTime, recurrence, priority, status);

  const reminder = db
    .prepare("SELECT * FROM reminders WHERE id = ? AND user_id = ?")
    .get(Number(result.lastInsertRowid), auth.user.id);
  return NextResponse.json({ reminder });
}
