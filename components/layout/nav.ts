import {
  Home,
  CalendarDays,
  ListChecks,
  Bell,
  Lightbulb,
  StickyNote,
  Star,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/tarefas", label: "Tarefas", icon: ListChecks },
  { href: "/lembretes", label: "Lembretes", icon: Bell },
  { href: "/dicas", label: "Dicas", icon: Lightbulb },
  { href: "/anotacoes", label: "Anotações", icon: StickyNote },
  { href: "/favoritos", label: "Favoritos", icon: Star },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export const MOBILE_PRIMARY = ["/dashboard", "/agenda", "/tarefas"];
