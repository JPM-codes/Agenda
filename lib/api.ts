import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser, safeUser } from "@/lib/auth";

export async function requireUser(): Promise<
  { ok: true; user: ReturnType<typeof safeUser> } | { ok: false; response: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Não autorizado." }, { status: 401 }) };
  }
  return { ok: true, user: safeUser(user) };
}

export async function parseBody(request: Request): Promise<
  { ok: true; body: Record<string, unknown> } | { ok: false; response: NextResponse }
> {
  try {
    const body = await request.json();
    return { ok: true, body: body as Record<string, unknown> };
  } catch {
    return { ok: false, response: NextResponse.json({ error: "Dados inválidos." }, { status: 400 }) };
  }
}

export function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function int(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}
