"use client";

import { CalendarClock, Pencil, Star, Trash2 } from "lucide-react";
import { api, type Task } from "@/lib/client";
import { formatDateBR, parseTags, weekdayShortBR, toDateKey } from "@/lib/utils";
import { Badge, TagChip } from "@/components/ui/badge";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/cn";

export function TaskItem({
  task,
  onToggle,
  onEdit,
  onDelete,
  compact = false,
}: {
  task: Task;
  onToggle: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  compact?: boolean;
}) {
  const { toast } = useToast();
  const today = toDateKey(new Date());
  const overdue =
    task.status === "pendente" && task.due_date && task.due_date < today;

  async function toggleFavorite() {
    try {
      const data = await api<{ task: Task }>(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_favorite: task.is_favorite ? 0 : 1 }),
      });
      onToggle(data.task);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao favoritar.", "error");
    }
  }

  async function toggleComplete() {
    const nextStatus = task.status === "concluida" ? "pendente" : "concluida";
    try {
      const data = await api<{ task: Task }>(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      onToggle(data.task);
      toast(nextStatus === "concluida" ? "Tarefa concluída." : "Tarefa reaberta.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao atualizar tarefa.", "error");
    }
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700",
        overdue && "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30"
      )}
    >
      <button
        onClick={toggleComplete}
        aria-label={task.status === "concluida" ? "Reabrir tarefa" : "Concluir tarefa"}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition",
          task.status === "concluida"
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-slate-300 hover:border-emerald-500 dark:border-slate-600"
        )}
      >
        {task.status === "concluida" && (
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2.5">
            <path d="M3 8.5 6.5 12 13 4.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium text-slate-800 dark:text-slate-100",
            task.status === "concluida" && "line-through text-slate-400 dark:text-slate-500"
          )}
        >
          {task.title}
          {task.is_favorite === 1 && <Star className="ml-1.5 inline h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
        </p>
        {task.description && !compact && (
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{task.description}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {task.due_date && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-medium",
                overdue ? "text-red-600 dark:text-red-400" : "text-slate-400"
              )}
            >
              <CalendarClock className="h-3 w-3" />
              {weekdayShortBR(task.due_date)} · {formatDateBR(task.due_date)}
              {task.due_time ? ` ${task.due_time.slice(0, 5)}` : ""}
              {overdue && " · atrasada"}
            </span>
          )}
          <Badge value={task.priority} />
          {task.category && <Badge value="none" label={task.category} />}
          {parseTags(task.tags).map((t) => (
            <TagChip key={t} label={t} />
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          onClick={toggleFavorite}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-500 dark:hover:bg-slate-800"
          aria-label="Favoritar"
          title="Favoritar"
        >
          <Star className={cn("h-4 w-4", task.is_favorite === 1 && "fill-amber-400 text-amber-400")} />
        </button>
        {!compact && (
          <>
            <button
              onClick={() => onEdit(task)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Editar"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(task)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800 dark:hover:text-red-400"
              aria-label="Excluir"
              title="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
