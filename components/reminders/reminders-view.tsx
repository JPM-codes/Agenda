"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, AlarmClock, Pencil, Trash2, Check } from "lucide-react";
import { api, type Reminder } from "@/lib/client";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { EmptyState, Spinner } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { ReminderFormModal } from "@/components/reminders/reminder-form";
import { formatDateBR, toDateKey } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/cn";

export function RemindersView({ initialNova, initialId }: { initialNova: boolean; initialId: number | null }) {
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [formOpen, setFormOpen] = useState(initialNova);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [deleting, setDeleting] = useState<Reminder | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      const data = await api<{ reminders: Reminder[] }>(`/api/reminders?${params.toString()}`);
      setReminders(data.reminders);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao carregar lembretes.", "error");
    } finally {
      setLoading(false);
    }
  }, [q, status, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (initialId) {
      api<{ reminders: Reminder[] }>("/api/reminders").then((d) => {
        const found = d.reminders.find((r) => r.id === initialId);
        if (found) {
          setEditing(found);
          setFormOpen(true);
        }
      });
    }
  }, [initialId]);

  const today = toDateKey(new Date());
  const sorted = useMemo(
    () =>
      [...reminders].sort((a, b) => {
        if (a.status === "arquivado" && b.status !== "arquivado") return 1;
        if (b.status === "arquivado" && a.status !== "arquivado") return -1;
        return `${a.reminder_date}${a.reminder_time}`.localeCompare(`${b.reminder_date}${b.reminder_time}`);
      }),
    [reminders]
  );

  function replace(updated: Reminder) {
    setReminders((list) => {
      const exists = list.some((r) => r.id === updated.id);
      return exists ? list.map((r) => (r.id === updated.id ? updated : r)) : [updated, ...list];
    });
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await api(`/api/reminders/${deleting.id}`, { method: "DELETE" });
      setReminders((list) => list.filter((r) => r.id !== deleting.id));
      toast("Lembrete excluído.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao excluir.", "error");
    }
  }

  async function updateStatus(r: Reminder, next: string) {
    try {
      const data = await api<{ reminder: Reminder }>(`/api/reminders/${r.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      replace(data.reminder);
      toast(next === "concluido" ? "Lembrete concluído." : "Lembrete atualizado.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao atualizar.", "error");
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Lembretes</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Não perca prazos e compromissos importantes.</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Novo lembrete
        </Button>
      </div>

      <div className="mb-5 grid gap-2 sm:grid-cols-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar lembretes…" className="pl-9" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="agendado">Agendado</option>
          <option value="concluido">Concluído</option>
          <option value="arquivado">Arquivado</option>        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7" />
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          title={q || status ? "Nenhum lembrete encontrado" : "Você ainda não possui lembretes"}
          message={q || status ? "Ajuste os filtros da busca." : "Crie seu primeiro lembrete para receber alertas."}
          action={!q && !status && <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Criar lembrete</Button>}
        />
      ) : (
        <div className="space-y-2">
          {sorted.map((r) => (
            <div
              key={r.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900",
                r.status === "arquivado" && "opacity-60"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                  r.status === "concluido"
                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                    : "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                )}
              >
                <AlarmClock className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-medium text-slate-800 dark:text-slate-100", r.status === "concluido" && "line-through text-slate-400")}>
                  {r.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDateBR(r.reminder_date)} às {r.reminder_time.slice(0, 5)}
                  {r.recurrence !== "none" && <> · <Badge value={r.recurrence} /></>}
                  {r.reminder_date < today && r.status === "agendado" && <span className="ml-1 text-red-500">· vencido</span>}
                </p>
              </div>
              <Badge value={r.status} />
              <div className="flex shrink-0 items-center gap-0.5">
                {r.status !== "concluido" && (
                  <button
                    onClick={() => updateStatus(r, "concluido")}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
                    aria-label="Concluir"
                    title="Concluir"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => { setEditing(r); setFormOpen(true); }}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label="Editar"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleting(r)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800 dark:hover:text-red-400"
                  aria-label="Excluir"
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ReminderFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        reminder={editing}
        onSaved={replace}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Excluir lembrete"
        message="Tem certeza que deseja excluir este lembrete? Esta ação não poderá ser desfeita."
        confirmLabel="Excluir"
      />
    </div>
  );
}
