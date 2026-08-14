"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea, Select, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { api, type Reminder } from "@/lib/client";
import { toDateKey } from "@/lib/utils";
import { useToast } from "@/components/toast";

const empty = {
  title: "",
  description: "",
  reminder_date: "",
  reminder_time: "",
  recurrence: "none",
  priority: "media",
};

export function ReminderFormModal({
  open,
  onClose,
  reminder,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  reminder: Reminder | null;
  onSaved: (r: Reminder) => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({ ...empty });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(
        reminder
          ? {
              title: reminder.title,
              description: reminder.description,
              reminder_date: reminder.reminder_date,
              reminder_time: reminder.reminder_time,
              recurrence: reminder.recurrence,
              priority: reminder.priority,
            }
          : { ...empty, reminder_date: toDateKey(new Date()) }
      );
      setError("");
    }
  }, [open, reminder]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      setError("Informe o título do lembrete.");
      return;
    }
    if (!form.reminder_date || !form.reminder_time) {
      setError("Informe data e horário (RN-015).");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const saved = await api<{ reminder: Reminder }>(
        reminder ? `/api/reminders/${reminder.id}` : "/api/reminders",
        { method: reminder ? "PATCH" : "POST", body: JSON.stringify(form) }
      );
      onSaved(saved.reminder);
      toast(reminder ? "Lembrete atualizado." : "Lembrete criado.");
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
      title={reminder ? "Editar lembrete" : "Novo lembrete"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {reminder ? "Salvar" : "Criar"}
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
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex.: Ligar para proprietário" autoFocus />
        </div>
        <div>
          <FieldLabel>Observação</FieldLabel>
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Detalhes do lembrete" rows={3} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Data *</FieldLabel>
            <Input type="date" value={form.reminder_date} onChange={(e) => set("reminder_date", e.target.value)} />
          </div>
          <div>
            <FieldLabel>Horário *</FieldLabel>
            <Input type="time" value={form.reminder_time} onChange={(e) => set("reminder_time", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Repetição</FieldLabel>
            <Select value={form.recurrence} onChange={(e) => set("recurrence", e.target.value)}>
              <option value="none">Não repetir</option>
              <option value="daily">Diariamente</option>
              <option value="weekly">Semanalmente</option>
              <option value="monthly">Mensalmente</option>
              <option value="yearly">Anualmente</option>
            </Select>
          </div>
          <div>
            <FieldLabel>Prioridade</FieldLabel>
            <Select value={form.priority} onChange={(e) => set("priority", e.target.value)}>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </Select>
          </div>
        </div>
      </div>
    </Modal>
  );
}
