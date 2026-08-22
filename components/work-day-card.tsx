"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, LogIn, Utensils, RotateCcw, LogOut, CalendarCheck2, Pencil } from "lucide-react";
import { api, type WorkDay } from "@/lib/client";
import { toDateKey, toTimeHM, computeWorkDayState, formatMinutes, type WorkDayState } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, FieldLabel } from "@/components/ui/field";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/cn";

const STATE_LABELS: Record<WorkDayState, string> = {
  nao_iniciado: "Expediente não iniciado",
  em_expediente: "Em expediente",
  em_intervalo: "Em intervalo",
  encerrado: "Expediente encerrado",
};

function liveMinutes(wd: WorkDay, now: Date): number {
  if (wd.check_out) return wd.total_minutes;
  if (!wd.check_in) return 0;
  const toM = (t: string) => {
    const [h, m, s] = t.split(":").map(Number);
    return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
  };
  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const checkIn = toM(wd.check_in!);
  if (!wd.lunch_start) return Math.max(0, Math.floor((nowSec - checkIn) / 60));
  if (!wd.lunch_end) return Math.max(0, Math.floor((toM(wd.lunch_start) - checkIn) / 60));
  const lunch = toM(wd.lunch_start);
  const after = Math.max(0, Math.floor((nowSec - toM(wd.lunch_end)) / 60));
  return Math.max(0, Math.floor((lunch - checkIn) / 60)) + after;
}

type EditForm = {
  date: string;
  check_in: string;
  lunch_start: string;
  lunch_end: string;
  check_out: string;
};

const EMPTY_FORM = (date: string): EditForm => ({ date, check_in: "", lunch_start: "", lunch_end: "", check_out: "" });

function formFromWorkDay(date: string, wd: WorkDay | null | undefined): EditForm {
  return {
    date,
    check_in: wd?.check_in?.slice(0, 5) ?? "",
    lunch_start: wd?.lunch_start?.slice(0, 5) ?? "",
    lunch_end: wd?.lunch_end?.slice(0, 5) ?? "",
    check_out: wd?.check_out?.slice(0, 5) ?? "",
  };
}

export function WorkDayCard({
  workDay,
  onChange,
  date,
}: {
  workDay: WorkDay | null;
  onChange: (wd: WorkDay | null) => void;
  date?: string;
}) {
  const { toast } = useToast();
  const cardDate = date ?? toDateKey(new Date());
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditForm>(() => EMPTY_FORM(cardDate));

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(t);
  }, []);

  const state = computeWorkDayState(workDay ?? { check_in: null, lunch_start: null, lunch_end: null, check_out: null });
  const total = workDay ? liveMinutes(workDay, now) : 0;

  const record = useCallback(
    async (endpoint: string, label: string, success: string) => {
      if (busy) return;
      setBusy(true);
      try {
        const d = new Date();
        const data = await api<{ workDay: WorkDay | null }>(endpoint, {
          method: "POST",
          body: JSON.stringify({ date: toDateKey(d), time: `${toTimeHM(d)}:00` }),
        });
        onChange(data.workDay);
        toast(success);
      } catch (err) {
        toast(err instanceof Error ? err.message : "Não foi possível registrar.", "error");
      } finally {
        setBusy(false);
      }
    },
    [busy, onChange, toast]
  );

  const rows = [
    { label: "Entrada", value: workDay?.check_in?.slice(0, 5) },
    { label: "Almoço", value: workDay?.lunch_start ? `${workDay.lunch_start.slice(0, 5)} – ${workDay.lunch_end?.slice(0, 5) ?? "…"}` : undefined },
    { label: "Saída", value: workDay?.check_out?.slice(0, 5) },
  ];

  function openEdit() {
    setForm(workDay && workDay.date === cardDate ? formFromWorkDay(cardDate, workDay) : EMPTY_FORM(cardDate));
    setEditOpen(true);
  }

  async function pickEditDate(value: string) {
    if (!value) {
      setForm(EMPTY_FORM(""));
      return;
    }
    setForm({ ...EMPTY_FORM(value), check_in: form.check_in, lunch_start: form.lunch_start, lunch_end: form.lunch_end, check_out: form.check_out });
    try {
      const data = await api<{ workDays: WorkDay[] }>(`/api/work-days?date=${value}`);
      const row = data.workDays[0] ?? null;
      setForm((f) => (f.date === value ? formFromWorkDay(value, row) : f));
    } catch {
      // mantém os campos como estão se a busca falhar
    }
  }

  async function saveManual() {
    if (saving) return;
    setSaving(true);
    try {
      const data = await api<{ workDay: WorkDay }>("/api/work-days/manual", {
        method: "POST",
        body: JSON.stringify(form),
      });
      toast("Expediente atualizado.");
      setEditOpen(false);
      if (data.workDay.date === cardDate) onChange(data.workDay);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Não foi possível salvar.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              state === "encerrado"
                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                : state === "nao_iniciado"
                  ? "bg-slate-100 text-slate-400 dark:bg-slate-800"
                  : "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
            )}
          >
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Controle de expediente</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{STATE_LABELS[state]}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatMinutes(total)}</p>
            <p className="text-[11px] text-slate-400">trabalhado</p>
          </div>
          <Button variant="ghost" size="sm" onClick={openEdit} aria-label="Editar horários" title="Editar horários">
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        {rows.map((r) => (
          <div key={r.label} className="rounded-xl bg-slate-50 px-2 py-2.5 dark:bg-slate-800">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{r.label}</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
              {r.value ?? "—"}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {state === "nao_iniciado" && (
          <Button className="flex-1" onClick={() => record("/api/work-days/check-in", "in", "Entrada registrada.")} disabled={busy}>
            <LogIn className="h-4 w-4" /> Iniciar expediente
          </Button>
        )}
        {state === "em_expediente" && !workDay?.lunch_start && (
          <Button className="flex-1" variant="secondary" onClick={() => record("/api/work-days/lunch-start", "lunch-start", "Almoço iniciado.")} disabled={busy}>
            <Utensils className="h-4 w-4" /> Iniciar almoço
          </Button>
        )}
        {state === "em_intervalo" && (
          <Button className="flex-1" onClick={() => record("/api/work-days/lunch-end", "lunch-end", "Retorno registrado.")} disabled={busy}>
            <RotateCcw className="h-4 w-4" /> Retornar do almoço
          </Button>
        )}
        {(state === "em_expediente" || state === "em_intervalo") && (
          <Button
            className="flex-1"
            variant="secondary"
            onClick={() => record("/api/work-days/check-out", "check-out", "Expediente encerrado.")}
            disabled={busy}
          >
            <LogOut className="h-4 w-4" /> Encerrar expediente
          </Button>
        )}
        {state === "encerrado" && (
          <div className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CalendarCheck2 className="h-4 w-4" /> Expediente concluído
          </div>
        )}
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Editar expediente"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={saveManual} disabled={saving || !form.date}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Data</FieldLabel>
              <Input
                type="date"
                max={toDateKey(new Date())}
                value={form.date}
                onChange={(e) => pickEditDate(e.target.value)}
              />
            </div>
            <div />
            <div>
              <FieldLabel>Entrada</FieldLabel>
              <Input
                type="time"
                value={form.check_in}
                onChange={(e) => setForm((f) => ({ ...f, check_in: e.target.value }))}
              />
            </div>
            <div>
              <FieldLabel>Saída</FieldLabel>
              <Input
                type="time"
                value={form.check_out}
                onChange={(e) => setForm((f) => ({ ...f, check_out: e.target.value }))}
              />
            </div>
            <div>
              <FieldLabel>Início do almoço</FieldLabel>
              <Input
                type="time"
                value={form.lunch_start}
                onChange={(e) => setForm((f) => ({ ...f, lunch_start: e.target.value }))}
              />
            </div>
            <div>
              <FieldLabel>Fim do almoço</FieldLabel>
              <Input
                type="time"
                value={form.lunch_end}
                onChange={(e) => setForm((f) => ({ ...f, lunch_end: e.target.value }))}
              />
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Preencha os horários manualmente ou deixe em branco os que não ocorreram. Funciona para hoje e dias passados.
          </p>
        </div>
      </Modal>
    </section>
  );
}
