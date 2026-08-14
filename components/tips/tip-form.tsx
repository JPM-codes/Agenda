"use client";

import { useEffect, useState } from "react";
import { Loader2, Pin, Star, Lightbulb } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { api, type Tip } from "@/lib/client";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/cn";

const empty = {
  title: "",
  content: "",
  category: "",
  tags: "",
  is_favorite: 0,
  is_pinned: 0,
};

export function TipFormModal({
  open,
  onClose,
  tip,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  tip: Tip | null;
  onSaved: (t: Tip) => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({ ...empty });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(
        tip
          ? {
              title: tip.title,
              content: tip.content,
              category: tip.category,
              tags: tip.tags,
              is_favorite: tip.is_favorite,
              is_pinned: tip.is_pinned,
            }
          : { ...empty }
      );
      setError("");
    }
  }, [open, tip]);

  function set<K extends keyof typeof form>(key: K, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      setError("Informe o título da dica.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const saved = await api<{ tip: Tip }>(tip ? `/api/tips/${tip.id}` : "/api/tips", {
        method: tip ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });
      onSaved(saved.tip);
      toast(tip ? "Dica atualizada." : "Dica criada.");
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
      title={tip ? "Editar dica" : "Nova dica"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {tip ? "Salvar" : "Criar"}
          </Button>
        </>
      }
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>
        )}
        <div>
          <FieldLabel>Título *</FieldLabel>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex.: Como abordar um cliente" autoFocus />
        </div>
        <div>
          <FieldLabel>Conteúdo</FieldLabel>
          <Textarea value={form.content} onChange={(e) => set("content", e.target.value)} placeholder="O passo a passo da dica…" rows={7} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Categoria</FieldLabel>
            <Input list="ma-categories" value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Ex.: Atendimento" />
          </div>
          <div>
            <FieldLabel>Tags</FieldLabel>
            <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="Separadas por vírgula" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => set("is_pinned", form.is_pinned ? 0 : 1)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition",
              form.is_pinned
                ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            )}
          >
            <Pin className={cn("h-4 w-4", form.is_pinned && "fill-indigo-500 text-indigo-500")} />
            {form.is_pinned ? "Dica fixada" : "Fixar dica"}
          </button>
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
            {form.is_favorite ? "Favorita" : "Favoritar"}
          </button>
        </div>
        <p className="flex items-center gap-2 text-xs text-slate-400">
          <Lightbulb className="h-3.5 w-3.5" /> As dicas formam sua biblioteca pessoal de conhecimento.
        </p>
      </div>
    </Modal>
  );
}
