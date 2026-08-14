"use client";

import { Pencil, Pin, Star, Trash2, Lightbulb } from "lucide-react";
import { api, type Tip } from "@/lib/client";
import { formatDateTimeBR, parseTags } from "@/lib/utils";
import { TagChip } from "@/components/ui/badge";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/cn";

export function TipCard({
  tip,
  onChange,
  onEdit,
  onDelete,
}: {
  tip: Tip;
  onChange: (t: Tip) => void;
  onEdit: (t: Tip) => void;
  onDelete: (t: Tip) => void;
}) {
  const { toast } = useToast();

  async function toggle(field: "is_pinned" | "is_favorite") {
    try {
      const data = await api<{ tip: Tip }>(`/api/tips/${tip.id}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: tip[field] ? 0 : 1 }),
      });
      onChange(data.tip);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao atualizar.", "error");
    }
  }

  return (
    <div className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <Lightbulb className="h-4 w-4 shrink-0 text-amber-500" />
            <span className="line-clamp-1">{tip.title}</span>
          </h3>
          {tip.category && (
            <p className="mt-0.5 inline-flex rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {tip.category}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            onClick={() => toggle("is_pinned")}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
            aria-label="Fixar"
            title="Fixar"
          >
            <Pin className={cn("h-4 w-4", tip.is_pinned === 1 && "fill-indigo-500 text-indigo-500")} />
          </button>
          <button
            onClick={() => toggle("is_favorite")}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-500 dark:hover:bg-slate-800 dark:hover:text-amber-400"
            aria-label="Favoritar"
            title="Favoritar"
          >
            <Star className={cn("h-4 w-4", tip.is_favorite === 1 && "fill-amber-400 text-amber-400")} />
          </button>
        </div>
      </div>

      <p className="mt-2 line-clamp-4 flex-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">
        {tip.content || "—"}
      </p>

      {parseTags(tip.tags).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {parseTags(tip.tags).map((t) => (
            <TagChip key={t} label={t} />
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
        <p className="text-[11px] text-slate-400">{formatDateTimeBR(tip.updated_at)}</p>
        <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={() => onEdit(tip)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Editar"
            title="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(tip)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800 dark:hover:text-red-400"
            aria-label="Excluir"
            title="Excluir"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
