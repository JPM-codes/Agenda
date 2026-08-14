"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  StickyNote,
  ListChecks,
  BellPlus,
  Lightbulb,
  LogIn,
  Utensils,
  RotateCcw,
  LogOut,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/client";
import { toDateKey, toTimeHM } from "@/lib/utils";
import { useToast } from "@/components/toast";

export function QuickActionsSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const go = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router]
  );

  const record = useCallback(
    async (endpoint: string, label: string) => {
      if (busy) return;
      setBusy(endpoint);
      try {
        const now = new Date();
        await api(endpoint, {
          method: "POST",
          body: JSON.stringify({ date: toDateKey(now), time: `${toTimeHM(now)}:00` }),
        });
        toast(label);
      } catch (err) {
        toast(err instanceof Error ? err.message : "Não foi possível registrar.", "error");
      } finally {
        setBusy(null);
      }
    },
    [busy, toast]
  );

  if (!open) return null;

  const createItems = [
    { label: "Nova anotação", icon: StickyNote, href: "/anotacoes?nova=1" },
    { label: "Nova tarefa", icon: ListChecks, href: "/tarefas?nova=1" },
    { label: "Novo lembrete", icon: BellPlus, href: "/lembretes?nova=1" },
    { label: "Nova dica", icon: Lightbulb, href: "/dicas?nova=1" },
  ];

  const workItems = [
    { label: "Registrar entrada", icon: LogIn, key: "in", endpoint: "/api/work-days/check-in", toast: "Entrada registrada." },
    { label: "Iniciar almoço", icon: Utensils, key: "lunch-start", endpoint: "/api/work-days/lunch-start", toast: "Almoço iniciado." },
    { label: "Retornar do almoço", icon: RotateCcw, key: "lunch-end", endpoint: "/api/work-days/lunch-end", toast: "Retorno registrado." },
    { label: "Encerrar expediente", icon: LogOut, key: "check-out", endpoint: "/api/work-days/check-out", toast: "Expediente encerrado." },
  ];

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-t-2xl bg-white p-5 pb-8 shadow-2xl sm:rounded-2xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-700">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Ações rápidas</h2>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
            <Plus className="h-4 w-4" />
          </span>
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Criar</p>
        <div className="grid grid-cols-2 gap-2">
          {createItems.map((item) => (
            <button
              key={item.href}
              onClick={() => go(item.href)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/50"
            >
              <item.icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              {item.label}
            </button>
          ))}
        </div>

        <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">Expediente</p>
        <div className="grid grid-cols-2 gap-2">
          {workItems.map((item) => (
            <button
              key={item.key}
              onClick={() => record(item.endpoint, item.toast)}
              disabled={busy !== null}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/50"
            >
              {busy === item.endpoint ? (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              ) : (
                <item.icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              )}
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
