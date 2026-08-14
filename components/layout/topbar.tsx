"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Search, X, Loader2 } from "lucide-react";
import { api, type Reminder, type Task } from "@/lib/client";
import { formatDateBR, toDateKey } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type SearchResult = {
  id: number;
  title: string;
  content: string;
  category: string;
  date: string | null;
  module: "nota" | "dica" | "tarefa" | "lembrete";
};

const MODULE_ROUTES: Record<SearchResult["module"], string> = {
  nota: "/anotacoes",
  dica: "/dicas",
  tarefa: "/tarefas",
  lembrete: "/lembretes",
};

export function TopBar({ userName }: { userName: string }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [bellItems, setBellItems] = useState<{ reminders: Reminder[]; lateTasks: Task[] }>({
    reminders: [],
    lateTasks: [],
  });
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      inputRef.current?.focus();
      setQuery("");
      setResults([]);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!loaded) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSearchOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [loaded, searchOpen]);

  useEffect(() => {
    let ignore = false;
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        if (!query.trim()) {
          setResults([]);
          return;
        }
        const data = await api<{ results: SearchResult[] }>(`/api/search?q=${encodeURIComponent(query)}`);
        if (!ignore) setResults(data.results);
      } catch {
        if (!ignore) setResults([]);
      } finally {
        if (!ignore) setSearching(false);
      }
    }, 300);
    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const today = toDateKey(new Date());
    (async () => {
      try {
        const [rem, tasks] = await Promise.all([
          api<{ reminders: Reminder[] }>("/api/reminders?upcoming=1"),
          api<{ tasks: Task[] }>("/api/tasks?status=pendente"),
        ]);
        setBellItems({
          reminders: rem.reminders.slice(0, 8),
          lateTasks: tasks.tasks.filter((t) => t.due_date && t.due_date < today).slice(0, 8),
        });
      } catch {
        /* silencioso */
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const badge = useCallback((m: SearchResult["module"]) => {
    if (m === "nota") return <Badge value="none" label="Anotação" />;
    if (m === "dica") return <Badge value="none" label="Dica" />;
    if (m === "tarefa") return <Badge value="media" label="Tarefa" />;
    return <Badge value="agendado" label="Lembrete" />;
  }, []);

  const hasNotifications = bellItems.reminders.length > 0 || bellItems.lateTasks.length > 0;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
        <span className="text-base font-bold text-slate-900 md:hidden dark:text-white">Minha Agenda</span>
        <span className="hidden md:block" />

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Pesquisar"
          >
            <Search className="h-[18px] w-[18px]" />
            <span className="hidden lg:inline">Pesquisar…</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setBellOpen((v) => !v)}
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Notificações"
            >
              <Bell className="h-[18px] w-[18px]" />
              {hasNotifications && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
            {bellOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
                <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <p className="px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-100">Notificações</p>
                  {!loaded && <p className="px-3 py-2 text-sm text-slate-400">Carregando…</p>}
                  {loaded && !hasNotifications && (
                    <p className="px-3 py-2 text-sm text-slate-400">Você está em dia. Nenhuma pendência.</p>
                  )}
                  {bellItems.lateTasks.length > 0 && (
                    <>
                      <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-red-500">Tarefas atrasadas</p>
                      {bellItems.lateTasks.map((t) => (
                        <Link
                          key={`t${t.id}`}
                          href="/tarefas"
                          onClick={() => setBellOpen(false)}
                          className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <span className="font-medium text-slate-800 dark:text-slate-100">{t.title}</span>
                          <span className="block text-xs text-slate-400">Prazo: {formatDateBR(t.due_date ?? "")}</span>
                        </Link>
                      ))}
                    </>
                  )}
                  {bellItems.reminders.length > 0 && (
                    <>
                      <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-indigo-500">Próximos lembretes</p>
                      {bellItems.reminders.map((r) => (
                        <Link
                          key={`r${r.id}`}
                          href="/lembretes"
                          onClick={() => setBellOpen(false)}
                          className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <span className="font-medium text-slate-800 dark:text-slate-100">{r.title}</span>
                          <span className="block text-xs text-slate-400">
                            {formatDateBR(r.reminder_date)} às {r.reminder_time.slice(0, 5)}
                          </span>
                        </Link>
                      ))}
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <span className="hidden h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white md:flex">
            {userName.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-[95] flex items-start justify-center bg-slate-950/40 p-4 pt-[10vh] backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-700">
            <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              {searching ? (
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-slate-400" />
              ) : (
                <Search className="h-5 w-5 shrink-0 text-slate-400" />
              )}
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pesquisar em anotações, dicas, tarefas e lembretes…"
                className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 dark:text-slate-100"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Fechar busca"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {!query.trim() && (
                <p className="px-3 py-6 text-center text-sm text-slate-400">
                  Digite para pesquisar em todos os módulos.
                </p>
              )}
              {query.trim() && !searching && results.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-slate-400">Nenhum resultado para “{query}”.</p>
              )}
              {results.map((r) => (
                <Link
                  key={`${r.module}-${r.id}`}
                  href={`${MODULE_ROUTES[r.module]}?id=${r.id}`}
                  onClick={() => setSearchOpen(false)}
                  className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {r.title || "Sem título"}
                    </p>
                    <p className="truncate text-xs text-slate-400">{r.content || r.category}</p>
                  </div>
                  {badge(r.module)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
