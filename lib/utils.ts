export const PRIORITIES = ["alta", "media", "baixa"] as const;
export const TASK_STATUSES = ["pendente", "em_andamento", "concluida", "cancelada"] as const;
export const RECURRENCES = ["none", "daily", "weekly", "monthly", "yearly"] as const;

export const DEFAULT_CATEGORIES = [
  "Trabalho",
  "Atendimento",
  "Imobiliário",
  "Contratos",
  "Locação",
  "Vendas",
  "Sistemas",
  "Tecnologia",
  "Procedimentos",
  "Pessoal",
  "Outros",
];

export function todayISO(): string {
  return toDateKey(new Date());
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function toTimeHM(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function formatDateBR(dateKey: string): string {
  if (!dateKey) return "";
  const [y, m, d] = dateKey.split("-");
  return `${d}/${m}/${y}`;
}

export function formatDateTimeBR(sql: string): string {
  if (!sql) return "";
  const date = new Date(sql);
  if (Number.isNaN(date.getTime())) return sql;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateLongBR(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function weekdayShortBR(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(new Date(y, m - 1, d));
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

export function minutesBetween(start: string, end: string): number {
  return toMinutes(end) - toMinutes(start);
}

export function formatMinutes(total: number): string {
  if (!total || total < 0) return "00h 00min";
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}min`;
}

export type WorkDayState = "nao_iniciado" | "em_expediente" | "em_intervalo" | "encerrado";

export function computeWorkDayState(wd: {
  check_in: string | null;
  lunch_start: string | null;
  lunch_end: string | null;
  check_out: string | null;
}): WorkDayState {
  if (wd.check_out) return "encerrado";
  if (wd.lunch_start && !wd.lunch_end) return "em_intervalo";
  if (wd.check_in) return "em_expediente";
  return "nao_iniciado";
}

export function computeTotalMinutes(wd: {
  check_in: string | null;
  lunch_start: string | null;
  lunch_end: string | null;
  check_out: string | null;
}): number {
  const { check_in, lunch_start, lunch_end, check_out } = wd;
  if (!check_in) return 0;

  if (lunch_start && lunch_end) {
    const before = minutesBetween(check_in, lunch_start);
    const after = check_out ? minutesBetween(lunch_end, check_out) : 0;
    return Math.max(before, 0) + Math.max(after, 0);
  }

  if (check_out) {
    const total = minutesBetween(check_in, check_out);
    if (lunch_start) {
      // intervalo iniciado mas não finalizado: desconsidera o trecho do almoço
      return Math.max(total, 0);
    }
    return Math.max(total, 0);
  }

  return 0;
}

export function nextDay(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return toDateKey(new Date(y, m - 1, d + 1));
}

export function prevDay(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return toDateKey(new Date(y, m - 1, d - 1));
}

export function addDays(dateKey: string, amount: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return toDateKey(new Date(y, m - 1, d + amount));
}

export function weekDays(dateKey: string): string[] {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const monday = new Date(date);
  const dow = (date.getDay() + 6) % 7; // segunda = 0
  monday.setDate(date.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => toDateKey(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)));
}

export function monthGrid(dateKey: string): string[] {
  const [y, m] = dateKey.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(y, m - 1, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) =>
    toDateKey(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
  );
}

export function monthLabel(dateKey: string): string {
  const [y, m] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1));
}

export function parseTags(tags: string): string[] {
  return (tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function nowLocalDateTime(): string {
  const d = new Date();
  return `${toDateKey(d)} ${toTimeHM(d)}:${String(d.getSeconds()).padStart(2, "0")}`;
}
