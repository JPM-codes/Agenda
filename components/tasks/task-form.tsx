"use client";

import { useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea, Select, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { api, type Task } from "@/lib/client";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/cn";

const empty = {
  title: "",
  description: "",
  due_date: "",
  due_time: "",
  priority: "media",
  status: "pendente",
  category: "",
  tags: "",
  is_favorite: 0,
};

export function TaskFormModal({
  open,
  onClose,
  task,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  onSaved: (task: Task) => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({ ...empty });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(
        task
          ? {
              title: task.title,
              description: task.description,
              due_date: task.due_date ?? "",
              due_time: task.due_time ?? "",
              priority: task.priority,
              status: task.status,
              category: task.category,
              tags: task.tags,
              is_favorite: task.is_favorite,
            }
          : { ...empty }
      );
      setError("");
    }
  }, [open, task]);

  function set<K extends keyof typeof form>(key: K, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      setError("Informe o título da tarefa.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const saved = await api<{ task: Task }>(
        task ? `/api/tasks/${task.id}` : "/api/tasks",
        {
          method: task ? "PATCH" : "POST",
          body: JSON.stringify({
            ...form,
            due_date: form.due_date || null,
            due_time: form.due_time || null,
          }),
        }
      );
      onSaved(saved.task);
      toast(task ? "Tarefa atualizada." : "Tarefa criada.");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? "Editar tarefa" : "Nova tarefa"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {task ? "Salvar" : "Criar"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>
        )}
        <div>
          <FieldLabel>Título *</FieldLabel>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex.: Retornar cliente" autoFocus />
        </div>
        <div>
          <FieldLabel>Descrição</FieldLabel>
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Detalhes da tarefa" rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Prazo</FieldLabel>
            <Input type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} />
          </div>
          <div>
            <FieldLabel>Horário</FieldLabel>
            <Input type="time" value={form.due_time} onChange={(e) => set("due_time", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Prioridade</FieldLabel>
            <Select value={form.priority} onChange={(e) => set("priority", e.target.value)}>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </Select>
          </div>
          <div>
            <FieldLabel>Status</FieldLabel>
            <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="pendente">Pendente</option>
              <option value="em_andamento">Em andamento</option>
              <option value="concluida">Concluída</option>
              <option value="cancelada">Cancelada</option>
            </Select>
          </div>
        </div>
        <div>
          <FieldLabel>Categoria</FieldLabel>
          <Input
            list="ma-categories"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            placeholder="Ex.: Atendimento"
          />
        </div>
        <div>
          <FieldLabel>Tags</FieldLabel>
          <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="Separadas por vírgula" />
        </div>
        <button
          type="button"
          onClick={() => set("is_favorite", form.is_favorite ? 0 : 1)}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition",
            form.is_favorite
              ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
              : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          )}
        >
          <Star className={cn("h-4 w-4", form.is_favorite && "fill-amber-400 text-amber-400")} />
          {form.is_favorite ? "Marcada como favorita" : "Marcar como favorita"}
        </button>
      </div>
    </Modal>
  );
}
