import { cn } from "@/lib/cn";

const styles: Record<string, string> = {
  alta: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  media: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  baixa: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  pendente: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  em_andamento: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  concluida: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  concluido: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  cancelada: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  agendado: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  arquivado: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  none: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  daily: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  weekly: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  monthly: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  yearly: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
};

export function Badge({ value, label }: { value: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
        styles[value] ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
      )}
    >
      {label ?? pretty(value)}
    </span>
  );
}

const pretties: Record<string, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  concluido: "Concluído",
  cancelada: "Cancelada",
  agendado: "Agendado",
  arquivado: "Arquivado",
  none: "Não repetir",
  daily: "Diário",
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
};

export function pretty(value: string): string {
  return pretties[value] ?? value;
}

export function TagChip({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
      #{label}
    </span>
  );
}
