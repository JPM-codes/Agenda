"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, ChevronRight, ListChecks, Pin, StickyNote, Plus } from "lucide-react";
import { api, type Task, type Reminder, type Note, type WorkDay } from "@/lib/client";
import { WorkDayCard } from "@/components/work-day-card";
import { NoteCard } from "@/components/notes/note-card";
import { TaskItem } from "@/components/tasks/task-item";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState, Spinner } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateLongBR, greeting, toDateKey } from "@/lib/utils";
import { useToast } from "@/components/toast";

export function DashboardView({ userName }: { userName: string }) {
  const { toast } = useToast();
  const [today] = useState(() => toDateKey(new Date()));
  const [workDay, setWorkDay] = useState<WorkDay | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [pinned, setPinned] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Note | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [wd, tk, rm, nt, pn] = await Promise.all([
        api<{ workDays: WorkDay[] }>(`/api/work-days?date=${today}`),
        api<{ tasks: Task[] }>(`/api/tasks`),
        api<{ reminders: Reminder[] }>("/api/reminders?upcoming=1"),
        api<{ notes: Note[] }>("/api/notes?limit=6"),
        api<{ notes: Note[] }>("/api/notes?pinned=1&limit=6"),
      ]);
      setWorkDay(wd.workDays[0] ?? null);
      setTasks(tk.tasks);
      setReminders(rm.reminders.slice(0, 5));
      setNotes(nt.notes.filter((n) => n.is_pinned !== 1));
      setPinned(pn.notes);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao carregar o painel.", "error");
    } finally {
      setLoading(false);
    }
  }, [today, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const dayTasks = useMemo(
    () => tasks.filter((t) => t.due_date === today && t.status !== "cancelada"),
    [tasks, today]
  );
  const pendingDay = useMemo(() => dayTasks.filter((t) => t.status !== "concluida"), [dayTasks]);
  const doneDay = useMemo(() => dayTasks.filter((t) => t.status === "concluida"), [dayTasks]);
  const overdueCount = useMemo(
    () => tasks.filter((t) => t.status === "pendente" && t.due_date && t.due_date < today).length,
    [tasks, today]
  );

  function replaceTask(updated: Task) {
    setTasks((list) => {
      const exists = list.some((t) => t.id === updated.id);
      return exists ? list.map((t) => (t.id === updated.id ? updated : t)) : [updated, ...list];
    });
  }

  function replaceNote(updated: Note) {
    setNotes((list) => {
      const exists = list.some((n) => n.id === updated.id);
      return exists ? list.map((n) => (n.id === updated.id ? updated : n)) : [updated, ...list];
    });
    setPinned((list) => {
      const exists = list.some((n) => n.id === updated.id);
      if (updated.is_pinned === 1 && !exists) return [updated, ...list];
      return exists ? list.map((n) => (n.id === updated.id ? updated : n)) : list;
    });
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await api(`/api/notes/${deleting.id}`, { method: "DELETE" });
      setNotes((l) => l.filter((n) => n.id !== deleting.id));
      setPinned((l) => l.filter((n) => n.id !== deleting.id));
      toast("Anotação excluída.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao excluir.", "error");
    }
  }

  const firstName = userName.split(" ")[0];

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{formatDateLongBR(today)}</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
          {greeting()}, {firstName} 👋
        </h1>
        {overdueCount > 0 && (
          <Link
            href="/tarefas"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 dark:bg-red-950 dark:text-red-300"
          >
            {overdueCount} tarefa{overdueCount > 1 ? "s" : ""} atrasada{overdueCount > 1 ? "s" : ""}
          </Link>
        )}
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WorkDayCard workDay={workDay} onChange={setWorkDay} date={today} />
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Bell className="h-4 w-4 text-blue-500" /> Próximos lembretes
            </h2>
            <Link href="/lembretes" className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              Ver todos
            </Link>
          </div>
          {reminders.length === 0 ? (
            <EmptyState title="Nenhum lembrete próximo" message="Você está em dia!" />
          ) : (
            <ul className="space-y-2.5">
              {reminders.map((r) => (
                <li key={r.id} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                    <Bell className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{r.title}</p>
                    <p className="text-xs text-slate-400">
                      Hoje {r.reminder_time.slice(0, 5)}
                      {r.recurrence !== "none" && <> · <Badge value={r.recurrence} /></>}
                    </p>
                  </div>
                  <Badge value={r.priority} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <ListChecks className="h-4 w-4 text-indigo-500" /> Tarefas de hoje
            </h2>
            <Link href="/tarefas" className="flex items-center text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              Ver todas <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {dayTasks.length === 0 ? (
            <EmptyState
              title="Nenhuma tarefa para hoje"
              message="Você está em dia!"
              action={
                <Link href="/tarefas?nova=1">
                  <Button size="sm">
                    <Plus className="h-4 w-4" /> Criar tarefa
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-2">
              {pendingDay.map((t) => (
                <TaskItem key={t.id} task={t} onToggle={replaceTask} onEdit={() => {}} onDelete={() => {}} compact />
              ))}
              {doneDay.map((t) => (
                <TaskItem key={t.id} task={t} onToggle={replaceTask} onEdit={() => {}} onDelete={() => {}} compact />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Pin className="h-4 w-4 text-indigo-500" /> Notas fixadas
            </h2>
            <Link href="/anotacoes" className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              Ver todas
            </Link>
          </div>
          {pinned.length === 0 ? (
            <EmptyState title="Nenhuma nota fixada" message="Fixe informações importantes para mantê-las em destaque." />
          ) : (
            <div className="space-y-2">
              {pinned.slice(0, 4).map((n) => (
                <div
                  key={n.id}
                  className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2.5 dark:border-indigo-900 dark:bg-indigo-950/30"
                >
                  <p className="line-clamp-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                    {n.title || "Sem título"}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{n.content}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <StickyNote className="h-4 w-4 text-emerald-500" /> Notas recentes
            </h2>
            <Link href="/anotacoes" className="flex items-center text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              Ver todas <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {notes.length === 0 ? (
            <EmptyState
              title="Você ainda não possui anotações"
              message="Crie sua primeira anotação para começar."
              action={
                <Link href="/anotacoes?nova=1">
                  <Button size="sm">
                    <Plus className="h-4 w-4" /> Criar anotação
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {notes.slice(0, 6).map((n) => (
                <NoteCard
                  key={n.id}
                  note={n}
                  onChange={replaceNote}
                  onEdit={() => {}}
                  onDelete={setDeleting}
                  readonly
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Excluir anotação"
        message="Tem certeza que deseja excluir esta anotação? Esta ação não poderá ser desfeita."
        confirmLabel="Excluir"
      />
    </div>
  );
}
