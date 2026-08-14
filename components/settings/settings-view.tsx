"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Moon, Sun, User, Shield } from "lucide-react";
import { Input, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/cn";

type Profile = { id: number; name: string; email: string; theme: string };

export function SettingsView({ initialProfile }: { initialProfile: Profile }) {
  const { toast } = useToast();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(initialProfile.name);
  const [email, setEmail] = useState(initialProfile.email);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [nextPw, setNextPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwOk, setPwOk] = useState(false);

  useEffect(() => {
    if (initialProfile.theme === "light" || initialProfile.theme === "dark") {
      setTheme(initialProfile.theme);
    }
  }, [initialProfile.theme, setTheme]);

  async function saveProfile() {
    if (name.trim().length < 2) {
      toast("Informe seu nome.", "error");
      return;
    }
    setSavingProfile(true);
    try {
      const data = await api<{ user: Profile }>("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ name, email }),
      });
      setTheme(data.user.theme === "dark" ? "dark" : "light");
      toast("Perfil atualizado.");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao salvar perfil.", "error");
    } finally {
      setSavingProfile(false);
    }
  }

  async function changeTheme(next: "light" | "dark") {
    setTheme(next);
    try {
      await api("/api/profile", { method: "PATCH", body: JSON.stringify({ theme: next }) });
    } catch {
      /* o tema local permanece aplicado */
    }
  }

  async function savePassword() {
    setPwError("");
    setPwOk(false);
    if (!currentPw || !nextPw) {
      setPwError("Informe a senha atual e a nova senha.");
      return;
    }
    if (nextPw.length < 6) {
      setPwError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (nextPw !== confirmPw) {
      setPwError("A confirmação da nova senha não confere.");
      return;
    }
    setSavingPw(true);
    try {
      await api("/api/profile/password", {
        method: "POST",
        body: JSON.stringify({ current: currentPw, next: nextPw }),
      });
      setPwOk(true);
      toast("Senha alterada. Faça login novamente.");
      window.setTimeout(() => {
        router.push("/login");
        router.refresh();
      }, 1200);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Erro ao alterar a senha.");
    } finally {
      setSavingPw(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Configurações</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie seu perfil e preferências.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <User className="h-4 w-4 text-indigo-500" /> Perfil
        </h2>
        <div className="space-y-4">
          <div>
            <FieldLabel>Nome</FieldLabel>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <FieldLabel>E-mail</FieldLabel>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button onClick={saveProfile} disabled={savingProfile}>
              {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar alterações
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {theme === "dark" ? <Moon className="h-4 w-4 text-indigo-500" /> : <Sun className="h-4 w-4 text-indigo-500" />}
          Tema
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => changeTheme("light")}
            className={cn(
              "rounded-xl border px-4 py-3 text-sm font-medium transition",
              theme === "light"
                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            )}
          >
            <Sun className="mb-1 h-4 w-4" /> Claro
          </button>
          <button
            onClick={() => changeTheme("dark")}
            className={cn(
              "rounded-xl border px-4 py-3 text-sm font-medium transition",
              theme === "dark"
                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            )}
          >
            <Moon className="mb-1 h-4 w-4" /> Escuro
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <Shield className="h-4 w-4 text-indigo-500" /> Alterar senha
        </h2>
        <div className="space-y-4">
          <div>
            <FieldLabel>Senha atual</FieldLabel>
            <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} autoComplete="current-password" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Nova senha</FieldLabel>
              <Input type="password" value={nextPw} onChange={(e) => setNextPw(e.target.value)} autoComplete="new-password" />
            </div>
            <div>
              <FieldLabel>Confirmar nova senha</FieldLabel>
              <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" />
            </div>
          </div>
          {pwError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{pwError}</p>
          )}
          {pwOk && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Senha alterada com sucesso. Você será redirecionado para o login.
            </p>
          )}
          <div className="flex justify-end">
            <Button onClick={savePassword} disabled={savingPw}>
              {savingPw && <Loader2 className="h-4 w-4 animate-spin" />}
              Alterar senha
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
