import "server-only";
import { db, type WorkDayRow } from "@/lib/db";
import { computeTotalMinutes } from "@/lib/utils";

export function getWorkDay(userId: number, date: string): WorkDayRow | null {
  const row = db
    .prepare("SELECT * FROM work_days WHERE user_id = ? AND date = ?")
    .get(userId, date) as WorkDayRow | undefined;
  return row ?? null;
}

export function listWorkDays(userId: number, limit = 90): WorkDayRow[] {
  const rows = db
    .prepare("SELECT * FROM work_days WHERE user_id = ? ORDER BY date DESC LIMIT ?")
    .all(userId, limit) as unknown as WorkDayRow[];
  return rows;
}

function recalc(id: number) {
  const row = db.prepare("SELECT * FROM work_days WHERE id = ?").get(id) as WorkDayRow;
  const total = computeTotalMinutes(row);
  db.prepare("UPDATE work_days SET total_minutes = ?, updated_at = datetime('now') WHERE id = ?").run(total, id);
  return total;
}

type Field = "check_in" | "lunch_start" | "lunch_end" | "check_out";

export function recordEvent(userId: number, date: string, field: Field, time: string) {
  const existing = getWorkDay(userId, date);

  if (!existing) {
    const result = db
      .prepare(`INSERT INTO work_days (user_id, date, ${field}) VALUES (?, ?, ?)`)
      .run(userId, date, time);
    const id = Number(result.lastInsertRowid);
    recalc(id);
    return getWorkDay(userId, date);
  }

  db.prepare(`UPDATE work_days SET ${field} = ?, updated_at = datetime('now') WHERE id = ?`).run(time, existing.id);
  recalc(existing.id);
  return getWorkDay(userId, date);
}

export function recordWorkEvent(
  userId: number,
  date: string,
  field: Field,
  time: string
): { ok: true; workDay: WorkDayRow | null } | { ok: false; error: string } {
  const existing = getWorkDay(userId, date);

  if (field === "check_in" && existing?.check_in) {
    return { ok: false, error: "Já existe um expediente aberto para esta data (RN-003)." };
  }
  if (field !== "check_in" && !existing) {
    return { ok: false, error: "Nenhum expediente iniciado nesta data." };
  }
  if (field === "lunch_start" && !existing!.check_in) {
    return { ok: false, error: "Inicie o expediente antes de registrar o almoço." };
  }
  if (field === "lunch_end" && !existing!.lunch_start) {
    return { ok: false, error: "Inicie o almoço antes de registrar o retorno." };
  }
  if (field === "check_out" && existing!.check_out) {
    return { ok: false, error: "O expediente desta data já foi encerrado." };
  }

  return { ok: true, workDay: recordEvent(userId, date, field, time) };
}

export function listWorkDayMonths(userId: number): { month: string; count: number; minutes: number }[] {
  const rows = db
    .prepare(
      `SELECT substr(date, 1, 7) as month, COUNT(*) as count, SUM(total_minutes) as minutes
       FROM work_days WHERE user_id = ? AND check_out IS NOT NULL
       GROUP BY substr(date, 1, 7) ORDER BY month DESC`
    )
    .all(userId) as unknown as { month: string; count: number; minutes: number }[];
  return rows;
}
