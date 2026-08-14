"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pin, Lightbulb } from "lucide-react";
import { api, type Tip } from "@/lib/client";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { EmptyState, Spinner } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TipCard } from "@/components/tips/tip-card";
import { TipFormModal } from "@/components/tips/tip-form";
import { useToast } from "@/components/toast";

export function TipsView({ initialNova, initialId }: { initialNova: boolean; initialId: number | null }) {
  const { toast } = useToast();
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [formOpen, setFormOpen] = useState(initialNova);
  const [editing, setEditing] = useState<Tip | null>(null);
  const [deleting, setDeleting] = useState<Tip | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      const data = await api<{ tips: Tip[] }>(`/api/tips?${params.toString()}`);
      setTips(data.tips);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao carregar dicas.", "error");
    } finally {
      setLoading(false);
    }
  }, [q, category, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (initialId) {
      api<{ tips: Tip[] }>("/api/tips").then((d) => {
        const found = d.tips.find((t) => t.id === initialId);
        if (found) {
          setEditing(found);
          setFormOpen(true);
        }
      });
    }
  }, [initialId]);

  const categories = useMemo(
    () => Array.from(new Set(tips.map((t) => t.category).filter(Boolean))).sort(),
    [tips]
  );

  const pinned = useMemo(() => tips.filter((t) => t.is_pinned === 1), [tips]);
  const regular = useMemo(() => tips.filter((t) => t.is_pinned !== 1), [tips]);

  function replace(updated: Tip) {
    setTips((list) => {
      const exists = list.some((t) => t.id === updated.id);
      return exists ? list.map((t) => (t.id === updated.id ? updated : t)) : [updated, ...list];
    });
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await api(`/api/tips/${deleting.id}`, { method: "DELETE" });
      setTips((list) => list.filter((t) => t.id !== deleting.id));
      toast("Dica excluída.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao excluir.", "error");
    }
  }

  const grid = (items: Tip[]) => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((t) => (
        <TipCard
          key={t.id}
          tip={t}
          onChange={replace}
          onEdit={(t) => {
            setEditing(t);
            setFormOpen(true);
          }}
          onDelete={setDeleting}
        />
      ))}
    </div>
  );

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Dicas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Sua biblioteca pessoal de conhecimento.</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Nova dica
        </Button>
      </div>

      <div className="mb-5 grid gap-2 sm:grid-cols-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar dicas…" className="pl-9" />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7" />
        </div>
      ) : tips.length === 0 ? (
        <EmptyState
          title={q || category ? "Nenhuma dica encontrada" : "Você ainda não possui dicas"}
          message={q || category ? "Ajuste os filtros da busca." : "Crie sua primeira dica para começar sua biblioteca pessoal."}
          icon={<Lightbulb className="h-6 w-6" />}
          action={!q && !category && <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Criar dica</Button>}
        />
      ) : (
        <div className="space-y-6">
          {pinned.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Pin className="h-4 w-4 text-indigo-500" /> Dicas fixadas
                <span className="text-xs font-normal text-slate-400">({pinned.length})</span>
              </h2>
              {grid(pinned)}
            </section>
          )}
          {regular.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Todas as dicas</h2>
              {grid(regular)}
            </section>
          )}
        </div>
      )}

      <TipFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        tip={editing}
        onSaved={replace}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Excluir dica"
        message="Tem certeza que deseja excluir esta dica? Esta ação não poderá ser desfeita."
        confirmLabel="Excluir"
      />
    </div>
  );
}
