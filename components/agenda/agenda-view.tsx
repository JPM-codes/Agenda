"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Bell,
  StickyNote,
  Clock,
  Plus,
  Pin,
} from "lucide-react";
import { api, type Task, type Reminder, type Note, type WorkDay } from "@/lib/client";
import { WorkDayCard } from "@/components/work-day-card";
import { formatDayLabel, formatMinutes, monthGrid, monthLabel, toDateKey, weekdayShortBR } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/cn";

type View = "dia" | "semana" | "mes";

export function AgendaView() {
  const { toast } = useToast();
  const [view, setView] = useState<View>("dia");
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [wd, tk, rm, nt] = await Promise.all([
        api<{ workDays: WorkDay[] }>("/api/work-days?limit=365"),
        api<{ tasks: Task[] }>("/api/tasks"),
        api<{ reminders: Reminder[] }>("/api/reminders"),
        api<{ notes: Note[] }>("/api/notes?limit=500"),
      ]);
      setWorkDays(wd.workDays);
      setTasks(tk.tasks);
      setReminders(rm.reminders);
      setNotes(nt.notes);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao carregar agenda.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const byDate = useMemo(() => {
    const map: Record<string, { tasks: Task[]; reminders: Reminder[]; notes: Note[]; workDay: WorkDay | null }> = {};
    for (const t of tasks) {
      const d = t.due_date;
      if (!d) continue;
      (map[d] ??= { tasks: [], reminders: [], notes: [], workDay: null }).tasks.push(t);
    }
    for (const r of reminders) {
      const d = r.reminder_date;
      (map[d] ??= { tasks: [], reminders: [], notes: [], workDay: null }).reminders.push(r);
    }
    for (const n of notes) {
      const d = n.created_at.slice(0, 10);
      (map[d] ??= { tasks: [], reminders: [], notes: [], workDay: null }).notes.push(n);
    }
    for (const wd of workDays) {
      if (map[wd.date]) map[wd.date].workDay = wd;
      else map[wd.date] = { tasks: [], reminders: [], notes: [], workDay: wd };
    }
    for (const key of Object.keys(map)) {
      map[key].tasks.sort((a, b) => (a.due_time ?? "").localeCompare(b.due_time ?? ""));
      map[key].reminders.sort((a, b) => a.reminder_time.localeCompare(b.reminder_time));
    }
    return map;
  }, [tasks, reminders, notes, workDays]);

  const today = toDateKey(new Date());
  const current = byDate[date] ?? { tasks: [], reminders: [], notes: [], workDay: null };

  function shift(days: number) {
    const [y, m, d] = date.split("-").map(Number);
    setDate(toDateKey(new Date(y, m - 1, d + days)));
  }

  const tabs: { key: View; label: string }[] = [
    { key: "dia", label: "Dia" },
    { key: "semana", label: "Semana" },
    { key: "mes", label: "Mês" },
  ];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Agenda</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {view === "mes" ? monthLabel(date) : formatDayLabel(date)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-lg bg-slate-200/70 p-1 dark:bg-slate-800">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setView(t.key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition",
                  view === t.key
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => shift(-(view === "mes" ? 30 : view === "semana" ? 7 : 1))}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDate(today)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
            >
              Hoje
            </button>
            <button
              onClick={() => shift(view === "mes" ? 30 : view === "semana" ? 7 : 1)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Próximo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
        </div>
      ) : view === "mes" ? (
        <MonthView date={date} byDate={byDate} onSelect={setDate} today={today} />
      ) : view === "semana" ? (
        <WeekView date={date} byDate={byDate} onSelect={setDate} today={today} />
      ) : (
        <DayView date={date} current={current} onWorkDayChange={(wd) => setWorkDays((l) => [...l.filter((w) => w.date !== date), ...(wd ? [wd] : [])])} />
      )}
    </div>
  );
}

type DayBundle = { tasks: Task[]; reminders: Reminder[]; notes: Note[]; workDay: WorkDay | null };

function DayView({
  date,
  current,
  onWorkDayChange,
}: {
  date: string;
  current: DayBundle;
  onWorkDayChange: (wd: WorkDay | null) => void;
}) {
  const wd = current.workDay;

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <WorkDayCard workDay={wd} onChange={onWorkDayChange} date={date} />
      </div>

      <div className="space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <ListChecks className="h-4 w-4 text-indigo-500" /> Tarefas
            </h2>
            <Link href={`/tarefas?nova=1`} className="rounded-lg p-1 text-slate-400 hover:text-indigo-600" aria-label="Nova tarefa">
              <Plus className="h-4 w-4" />
            </Link>
          </div>
          {current.tasks.length === 0 ? (
            <p className="py-3 text-center text-sm text-slate-400">Nenhuma tarefa nesta data.</p>
          ) : (
            <ul className="space-y-2">
              {current.tasks.map((t) => (
                <li key={t.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      t.priority === "alta" ? "bg-red-500" : t.priority === "media" ? "bg-amber-500" : "bg-emerald-500"
                    )}
                  />
                  <span className={cn("flex-1 truncate text-slate-700 dark:text-slate-200", t.status === "concluida" && "line-through text-slate-400")}>
                    {t.title}
                  </span>
                  {t.due_time && <span className="text-xs text-slate-400">{t.due_time.slice(0, 5)}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Bell className="h-4 w-4 text-blue-500" /> Lembretes
            </h2>
            <Link href={`/lembretes?nova=1`} className="rounded-lg p-1 text-slate-400 hover:text-indigo-600" aria-label="Novo lembrete">
              <Plus className="h-4 w-4" />
            </Link>
          </div>
          {current.reminders.length === 0 ? (
            <p className="py-3 text-center text-sm text-slate-400">Nenhum lembrete nesta data.</p>
          ) : (
            <ul className="space-y-2">
              {current.reminders.map((r) => (
                <li key={r.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
                  <Bell className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                  <span className="flex-1 truncate text-slate-700 dark:text-slate-200">{r.title}</span>
                  <span className="text-xs text-slate-400">{r.reminder_time.slice(0, 5)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <StickyNote className="h-4 w-4 text-emerald-500" /> Anotações
            </h2>
            <Link href={`/anotacoes?nova=1`} className="rounded-lg p-1 text-slate-400 hover:text-indigo-600" aria-label="Nova anotação">
              <Plus className="h-4 w-4" />
            </Link>
          </div>
          {current.notes.length === 0 ? (
            <p className="py-3 text-center text-sm text-slate-400">Nenhuma anotação criada nesta data.</p>
          ) : (
            <ul className="space-y-2">
              {current.notes.slice(0, 6).map((n) => (
                <li key={n.id}>
                  <Link
                    href={`/anotacoes?id=${n.id}`}
                    className="block rounded-lg bg-slate-50 px-3 py-2 text-sm hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                      {n.is_pinned === 1 && <Pin className="h-3 w-3 text-indigo-500" />}
                      <span className="truncate">{n.title || "Sem título"}</span>
                    </span>
                    <span className="line-clamp-1 text-xs text-slate-400">{n.content}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function WeekView({
  date,
  byDate,
  onSelect,
  today,
}: {
  date: string;
  byDate: Record<string, DayBundle>;
  onSelect: (d: string) => void;
  today: string;
}) {
  const [y, m, d] = date.split("-").map(Number);
  const anchor = new Date(y, m - 1, d);
  const dow = (anchor.getDay() + 6) % 7;
  anchor.setDate(anchor.getDate() - dow);
  const days = Array.from({ length: 7 }, (_, i) =>
    toDateKey(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + i))
  );

  return (
    <div className="grid grid-cols-7 gap-1.5 overflow-x-auto">
      {days.map((day) => {
        const bundle = byDate[day] ?? { tasks: [], reminders: [], notes: [], workDay: null };
        const count = bundle.tasks.length + bundle.reminders.length + bundle.notes.length;
        return (
          <button
            key={day}
            onClick={() => onSelect(day)}
            className={cn(
              "flex min-w-[90px] flex-col rounded-xl border p-2 text-left transition",
              day === today
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
            )}
          >
            <span className="text-[11px] font-semibold uppercase text-slate-400">{weekdayShortBR(day)}</span>
            <span className={cn("text-lg font-bold", day === today ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-200")}>
              {Number(day.slice(8))}
            </span>
            <div className="mt-2 space-y-1">
              {bundle.workDay && (
                <span className="flex items-center gap-1 rounded bg-emerald-100 px-1 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <Clock className="h-2.5 w-2.5" /> {formatMinutes(bundle.workDay.total_minutes)}
                </span>
              )}
              {bundle.tasks.slice(0, 2).map((t) => (
                <span
                  key={`t${t.id}`}
                  className={cn(
                    "block truncate rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                    t.status === "concluida" && "line-through opacity-60"
                  )}
                >
                  {t.title}
                </span>
              ))}
              {bundle.reminders.slice(0, 1).map((r) => (
                <span key={`r${r.id}`} className="block truncate rounded bg-blue-100 px-1 py-0.5 text-[10px] text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  🔔 {r.title}
                </span>
              ))}
              {count > 3 && <span className="block text-[10px] text-slate-400">+{count - 3} mais</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function MonthView({
  date,
  byDate,
  onSelect,
  today,
}: {
  date: string;
  byDate: Record<string, DayBundle>;
  onSelect: (d: string) => void;
  today: string;
}) {
  const grid = monthGrid(date);
  const month = date.slice(0, 7);
  const weekdays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
        {weekdays.map((w) => (
          <div key={w} className="px-2 py-2 text-center text-xs font-semibold text-slate-400">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {grid.map((day) => {
          const inMonth = day.slice(0, 7) === month;
          const bundle = byDate[day] ?? { tasks: [], reminders: [], notes: [], workDay: null };
          return (
            <button
              key={day}
              onClick={() => onSelect(day)}
              className={cn(
                "flex min-h-[72px] flex-col gap-1 border-b border-r border-slate-100 p-1.5 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60",
                !inMonth && "bg-slate-50/60 text-slate-300 dark:bg-slate-950/40 dark:text-slate-600"
              )}
            >
              <span
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  day === today
                    ? "bg-indigo-600 text-white"
                    : inMonth
                      ? "text-slate-700 dark:text-slate-200"
                      : "text-slate-300 dark:text-slate-600"
                )}
              >
                {Number(day.slice(8))}
              </span>
              <div className="flex flex-wrap gap-0.5">
                {bundle.workDay && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Expediente" />}
                {bundle.tasks.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" title={`${bundle.tasks.length} tarefa(s)`} />}
                {bundle.reminders.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" title={`${bundle.reminders.length} lembrete(s)`} />}
                {bundle.notes.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" title={`${bundle.notes.length} anotação(ões)`} />}
              </div>
              {bundle.tasks.length + bundle.reminders.length > 0 && (
                <span className="text-[10px] text-slate-400">
                  {bundle.tasks.length + bundle.reminders.length > 3 ? `${bundle.tasks.length + bundle.reminders.length} itens` : ""}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
