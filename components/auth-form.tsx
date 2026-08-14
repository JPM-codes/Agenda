"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2 } from "lucide-react";
import { Input, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";
import { useToast } from "@/components/toast";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "register" && form.password !== form.confirm) {
      setError("A confirmação de senha não confere.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "register") {
        await api("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
        });
        toast("Conta criada. Bem-vindo!");
      } else {
        await api("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        toast("Login realizado.");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center text-white">
          <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
            <CalendarDays className="h-8 w-8" />
          </span>
          <h1 className="text-2xl font-bold">Minha Agenda</h1>
          <p className="mt-1 text-sm text-indigo-100">
            Registre, organize e encontre rapidamente sua rotina.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-6 shadow-xl sm:p-8 dark:bg-slate-900 dark:ring-1 dark:ring-slate-700"
        >
          <h2 className="mb-5 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </h2>

          <div className="space-y-4">
            {mode === "register" && (
              <div>
                <FieldLabel>Nome</FieldLabel>
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Seu nome"
                  autoComplete="name"
                  required
                />
              </div>
            )}
            <div>
              <FieldLabel>E-mail</FieldLabel>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="voce@exemplo.com"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <FieldLabel>Senha</FieldLabel>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />
            </div>
            {mode === "register" && (
              <div>
                <FieldLabel>Confirmar senha</FieldLabel>
                <Input
                  type="password"
                  value={form.confirm}
                  onChange={(e) => set("confirm", e.target.value)}
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  required
                />
              </div>
            )}
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <Button type="submit" className="mt-5 w-full" size="lg" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "login" ? "Entrar" : "Criar conta"}
          </Button>

          <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            {mode === "login" ? (
              <>
                Não tem conta?{" "}
                <Link href="/register" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                  Cadastre-se
                </Link>
              </>
            ) : (
              <>
                Já tem conta?{" "}
                <Link href="/login" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                  Entrar
                </Link>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
