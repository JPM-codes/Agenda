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
  if (field === "lunch_start" && existing!.lunch_start) {
    return { ok: false, error: "O almoço desta data já foi registrado." };
  }
  if (field === "lunch_end" && !existing!.lunch_start) {
    return { ok: false, error: "Inicie o almoço antes de registrar o retorno." };
  }
  if (field === "lunch_end" && existing!.lunch_end) {
    return { ok: false, error: "O retorno do almoço desta data já foi registrado." };
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

const MANUAL_TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const MANUAL_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toMinutes(t: string): number {
  return Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
}

export function saveWorkDayManual(
  userId: number,
  date: string,
  times: { check_in?: unknown; lunch_start?: unknown; lunch_end?: unknown; check_out?: unknown }
): { ok: true; workDay: WorkDayRow } | { ok: false; error: string } {
  if (!MANUAL_DATE_RE.test(date)) {
    return { ok: false, error: "Data inválida." };
  }
  if (date > localDateKey(new Date())) {
    return { ok: false, error: "Não é possível registrar expediente em uma data futura." };
  }

  const parsed: (string | null)[] = [];
  for (const raw of [times.check_in, times.lunch_start, times.lunch_end, times.check_out]) {
    if (raw == null || raw === "") {
      parsed.push(null);
      continue;
    }
    const s = String(raw).trim();
    if (!MANUAL_TIME_RE.test(s)) {
      return { ok: false, error: "Horário inválido (use HH:MM)." };
    }
    parsed.push(s.length === 5 ? `${s}:00` : s);
  }
  const [ci, ls, le, co] = parsed;

  const labels = ["Entrada", "Início do almoço", "Fim do almoço", "Saída"];
  for (let i = 0; i < 3; i++) {
    if (parsed[i] && parsed[i + 1] && toMinutes(parsed[i + 1]!) < toMinutes(parsed[i]!)) {
      return { ok: false, error: `${labels[i]} não pode ser depois de ${labels[i + 1].toLowerCase()}.` };
    }
  }

  const existing = getWorkDay(userId, date);
  let id: number;
  if (existing) {
    db.prepare(
      `UPDATE work_days SET check_in = ?, lunch_start = ?, lunch_end = ?, check_out = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(ci, ls, le, co, existing.id);
    id = existing.id;
  } else {
    const result = db
      .prepare(
        `INSERT INTO work_days (user_id, date, check_in, lunch_start, lunch_end, check_out) VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(userId, date, ci, ls, le, co);
    id = Number(result.lastInsertRowid);
  }
  recalc(id);
  return { ok: true, workDay: getWorkDay(userId, date)! };
}
