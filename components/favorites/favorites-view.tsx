"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Star, StickyNote, Lightbulb, ListChecks, Search } from "lucide-react";
import { api } from "@/lib/client";
import { Input } from "@/components/ui/field";
import { EmptyState, Spinner } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDateTimeBR } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/cn";

type Favorite = {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string;
  created_at: string;
  updated_at: string;
  type: "nota" | "dica" | "tarefa";
};

const TYPE_ROUTE: Record<Favorite["type"], string> = {
  nota: "/anotacoes",
  dica: "/dicas",
  tarefa: "/tarefas",
};

const TYPE_LABEL: Record<Favorite["type"], string> = {
  nota: "Anotação",
  dica: "Dica",
  tarefa: "Tarefa",
};

const TYPE_ICON: Record<Favorite["type"], typeof Star> = {
  nota: StickyNote,
  dica: Lightbulb,
  tarefa: ListChecks,
};

export function FavoritesView() {
  const { toast } = useToast();
  const [items, setItems] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (q) params.set("q", q);
      const data = await api<{ favorites: Favorite[] }>(`/api/favorites?${params.toString()}`);
      setItems(data.favorites);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao carregar favoritos.", "error");
    } finally {
      setLoading(false);
    }
  }, [type, q, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const tabs = [
    { value: "", label: "Todos" },
    { value: "nota", label: "Anotações" },
    { value: "dica", label: "Dicas" },
    { value: "tarefa", label: "Tarefas" },
  ];

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Favoritos</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Itens marcados para acesso rápido.</p>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar favoritos…" className="pl-9" />
        </div>
        <div className="flex gap-1 rounded-lg bg-slate-200/70 p-1 dark:bg-slate-800">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={cn(
                "flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition",
                type === t.value
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-7 w-7" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title={q || type ? "Nenhum favorito encontrado" : "Você ainda não possui favoritos"}
          message={
            q || type
              ? "Ajuste os filtros da busca."
              : "Marque anotações, dicas e tarefas com a estrela ⭐ para encontrá-las aqui."
          }
          icon={<Star className="h-6 w-6" />}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const Icon = TYPE_ICON[item.type];
            return (
              <Link
                key={`${item.type}-${item.id}`}
                href={`${TYPE_ROUTE[item.type]}?id=${item.id}`}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                      <Icon className="h-4 w-4" />
                    </span>
                    <Badge value="none" label={TYPE_LABEL[item.type]} />
                  </span>
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                </div>
                <h3 className="mt-3 line-clamp-1 text-sm font-semibold text-slate-800 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400">
                  {item.title || "Sem título"}
                </h3>
                <p className="mt-1 line-clamp-3 flex-1 whitespace-pre-wrap text-sm text-slate-500 dark:text-slate-400">
                  {item.content || "—"}
                </p>
                <p className="mt-3 text-[11px] text-slate-400">{formatDateTimeBR(item.updated_at)}</p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
