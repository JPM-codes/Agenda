"use client";

export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (data as { error?: string }).error || "Não foi possível concluir a operação. Tente novamente.";
    throw new Error(message);
  }
  return data as T;
}

export type Note = {
  id: number;
  user_id: number;
  title: string;
  content: string;
  category: string;
  tags: string;
  is_favorite: number;
  is_pinned: number;
  source: string;
  created_at: string;
  updated_at: string;
};

export type Tip = {
  id: number;
  user_id: number;
  title: string;
  content: string;
  category: string;
  tags: string;
  is_favorite: number;
  is_pinned: number;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: number;
  user_id: number;
  title: string;
  description: string;
  due_date: string | null;
  due_time: string | null;
  priority: string;
  status: string;
  category: string;
  tags: string;
  is_favorite: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Reminder = {
  id: number;
  user_id: number;
  title: string;
  description: string;
  reminder_date: string;
  reminder_time: string;
  recurrence: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type WorkDay = {
  id: number;
  user_id: number;
  date: string;
  check_in: string | null;
  lunch_start: string | null;
  lunch_end: string | null;
  check_out: string | null;
  total_minutes: number;
  created_at: string;
  updated_at: string;
};
