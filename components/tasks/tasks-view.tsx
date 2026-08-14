"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, CheckCircle2 } from "lucide-react";
import { api, type Task } from "@/lib/client";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { EmptyState, Spinner } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TaskItem } from "@/components/tasks/task-item";
import { TaskFormModal } from "@/components/tasks/task-form";
import { useToast } from "@/components/toast";

export function TasksView({ initialNova, initialId }: { initialNova: boolean; initialId: number | null }) {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [formOpen, setFormOpen] = useState(initialNova);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      if (priority) params.set("priority", priority);
      const data = await api<{ tasks: Task[] }>(`/api/tasks?${params.toString()}`);
      setTasks(data.tasks);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao carregar tarefas.", "error");
    } finally {
      setLoading(false);
    }
  }, [q, status, priority, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (initialId) {
      api<{ tasks: Task[] }>("/api/tasks").then((d) => {
        const found = d.tasks.find((t) => t.id === initialId);
        if (found) {
          setEditing(found);
          setFormOpen(true);
        }
      });
    }
  }, [initialId]);

  const pending = useMemo(() => tasks.filter((t) => !["concluida", "cancelada"].includes(t.status)), [tasks]);
  const done = useMemo(() => tasks.filter((t) => t.status === "concluida"), [tasks]);
  const cancelled = useMemo(() => tasks.filter((t) => t.status === "cancelada"), [tasks]);

  function replace(updated: Task) {
    setTasks((list) => {
      const exists = list.some((t) => t.id === updated.id);
      return exists ? list.map((t) => (t.id === updated.id ? updated : t)) : [updated, ...list];
    });
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await api(`/api/tasks/${deleting.id}`, { method: "DELETE" });
      setTasks((list) => list.filter((t) => t.id !== deleting.id));
      toast("Tarefa excluída.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao excluir.", "error");
    }
  }

  const group = (label: string, items: Task[]) =>
    items.length > 0 && (
      <div>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {label === "Concluídas" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          {label} <span className="text-xs font-normal text-slate-400">({items.length})</span>
        </h3>
        <div className="space-y-2">
          {items.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              onToggle={replace}
              onEdit={(t) => {
                setEditing(t);
                setFormOpen(true);
              }}
              onDelete={setDeleting}
            />
          ))}
        </div>
      </div>
    );

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Tarefas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Organize suas atividades e prazos.</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Nova tarefa
        </Button>
      </div>

      <div className="mb-5 grid gap-2 sm:grid-cols-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar tarefas…" className="pl-9" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="em_andamento">Em andamento</option>
          <option value="concluida">Concluída</option>
          <option value="cancelada">Cancelada</option>
        </Select>
        <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">Todas as prioridades</option>
          <option value="alta">Alta</option>
          <option value="media">Média</option>
          <option value="baixa">Baixa</option>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7" />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          title={q || status || priority ? "Nenhuma tarefa encontrada" : "Você ainda não possui tarefas"}
          message={q || status || priority ? "Ajuste os filtros da busca." : "Crie sua primeira tarefa para começar."}
          action={!q && !status && !priority && <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Criar tarefa</Button>}
        />
      ) : (
        <div className="space-y-5">
          {group("Pendentes", pending)}
          {group("Concluídas", done)}
          {group("Canceladas", cancelled)}
        </div>
      )}

      <TaskFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        task={editing}
        onSaved={replace}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Excluir tarefa"
        message="Tem certeza que deseja excluir esta tarefa? Esta ação não poderá ser desfeita."
        confirmLabel="Excluir"
      />
    </div>
  );
}
