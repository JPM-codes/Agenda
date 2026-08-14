"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { MoreHorizontal, X, LogOut, Moon, Sun, Plus } from "lucide-react";
import { NAV_ITEMS } from "@/components/layout/nav";
import { QuickActionsSheet } from "@/components/layout/quick-actions";
import { useTheme } from "@/components/theme-provider";
import { api } from "@/lib/client";
import { cn } from "@/lib/cn";

const PRIMARY = ["/dashboard", "/agenda", "/tarefas"];

export function MobileNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [quickOpen, setQuickOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const primary = NAV_ITEMS.filter((i) => PRIMARY.includes(i.href));
  const secondary = NAV_ITEMS.filter((i) => !PRIMARY.includes(i.href));

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto grid max-w-lg grid-cols-5 items-center px-2 py-1.5">
          {primary.map((item) => {
            const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium transition",
                  active
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}

          <button
            onClick={() => setQuickOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium text-slate-500"
            aria-label="Ações rápidas"
          >
            <span className="flex h-11 w-11 -translate-y-4 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
              <Plus className="h-6 w-6" />
            </span>
          </button>

          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-medium text-slate-500 dark:text-slate-400"
          >
            <MoreHorizontal className="h-5 w-5" />
            Mais
          </button>
        </div>
      </nav>

      <QuickActionsSheet open={quickOpen} onClose={() => setQuickOpen(false)} />

      {moreOpen && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center md:hidden">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setMoreOpen(false)} aria-hidden />
          <div className="relative z-10 w-full max-w-md rounded-t-2xl bg-white p-5 pb-10 shadow-2xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-700">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Menu</h2>
              <button
                onClick={() => setMoreOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-slate-800">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                {userName.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                {userName}
              </span>
              <button
                onClick={toggleTheme}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700"
                aria-label="Alternar tema"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button
                onClick={logout}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-200 hover:text-red-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-red-400"
                aria-label="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            <nav className="space-y-1">
              {secondary.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                      active
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
