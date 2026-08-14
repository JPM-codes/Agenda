"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Pin } from "lucide-react";
import { api, type Note } from "@/lib/client";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { EmptyState, Spinner } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { NoteCard } from "@/components/notes/note-card";
import { NoteFormModal } from "@/components/notes/note-form";
import { useToast } from "@/components/toast";

export function NotesView({ initialNova, initialId }: { initialNova: boolean; initialId: number | null }) {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [formOpen, setFormOpen] = useState(initialNova);
  const [editing, setEditing] = useState<Note | null>(null);
  const [deleting, setDeleting] = useState<Note | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (category) params.set("category", category);
      const data = await api<{ notes: Note[] }>(`/api/notes?${params.toString()}`);
      setNotes(data.notes);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao carregar anotações.", "error");
    } finally {
      setLoading(false);
    }
  }, [q, category, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (initialId) {
      api<{ notes: Note[] }>("/api/notes").then((d) => {
        const found = d.notes.find((n) => n.id === initialId);
        if (found) {
          setEditing(found);
          setFormOpen(true);
        }
      });
    }
  }, [initialId]);

  const categories = useMemo(
    () => Array.from(new Set(notes.map((n) => n.category).filter(Boolean))).sort(),
    [notes]
  );

  const pinned = useMemo(() => notes.filter((n) => n.is_pinned === 1), [notes]);
  const regular = useMemo(() => notes.filter((n) => n.is_pinned !== 1), [notes]);

  function replace(updated: Note) {
    setNotes((list) => {
      const exists = list.some((n) => n.id === updated.id);
      return exists ? list.map((n) => (n.id === updated.id ? updated : n)) : [updated, ...list];
    });
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await api(`/api/notes/${deleting.id}`, { method: "DELETE" });
      setNotes((list) => list.filter((n) => n.id !== deleting.id));
      toast("Anotação excluída.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao excluir.", "error");
    }
  }

  const grid = (items: Note[]) => (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((n) => (
        <NoteCard
          key={n.id}
          note={n}
          onChange={replace}
          onEdit={(n) => {
            setEditing(n);
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Anotações</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Registre informações e encontre-as rapidamente.</p>
        </div>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4" /> Nova anotação
        </Button>
      </div>

      <div className="mb-5 grid gap-2 sm:grid-cols-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar anotações…" className="pl-9" />
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
      ) : notes.length === 0 ? (
        <EmptyState
          title={q || category ? "Nenhuma anotação encontrada" : "Você ainda não possui anotações"}
          message={q || category ? "Ajuste os filtros da busca." : "Crie sua primeira anotação para começar."}
          action={!q && !category && <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Criar anotação</Button>}
        />
      ) : (
        <div className="space-y-6">
          {pinned.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Pin className="h-4 w-4 text-indigo-500" /> Notas fixadas
                <span className="text-xs font-normal text-slate-400">({pinned.length})</span>
              </h2>
              {grid(pinned)}
            </section>
          )}
          {regular.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Todas as anotações
              </h2>
              {grid(regular)}
            </section>
          )}
        </div>
      )}

      <NoteFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        note={editing}
        onSaved={replace}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Excluir anotação"
        message="Tem certeza que deseja excluir esta anotação? Esta ação não poderá ser desfeita."
        confirmLabel="Excluir"
      />
    </div>
  );
}
