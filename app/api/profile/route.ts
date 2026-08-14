import { NextResponse } from "next/server";
import { requireUser, parseBody, str } from "@/lib/api";
import { db, type UserRow } from "@/lib/db";

const THEMES = ["light", "dark"];

export async function PATCH(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const parsed = await parseBody(request);
  if (!parsed.ok) return parsed.response;

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(auth.user.id) as UserRow;
  const fields: Record<string, string> = {};

  if (parsed.body.name !== undefined) {
    const name = str(parsed.body.name);
    if (name.length < 2) {
      return NextResponse.json({ error: "Informe seu nome." }, { status: 400 });
    }
    fields.name = name;
  }

  if (parsed.body.email !== undefined) {
    const email = str(parsed.body.email).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }
    const taken = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(email, user.id);
    if (taken) {
      return NextResponse.json({ error: "Este e-mail já está em uso." }, { status: 409 });
    }
    fields.email = email;
  }

  if (parsed.body.theme !== undefined) {
    const theme = str(parsed.body.theme);
    if (!THEMES.includes(theme)) {
      return NextResponse.json({ error: "Tema inválido." }, { status: 400 });
    }
    fields.theme = theme;
  }

  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: "Nenhuma alteração informada." }, { status: 400 });
  }

  const sets = Object.keys(fields)
    .map((k) => `${k} = ?`)
    .join(", ");
  db.prepare(`UPDATE users SET ${sets}, updated_at = datetime('now') WHERE id = ?`).run(
    ...Object.values(fields),
    user.id
  );

  const updated = db.prepare("SELECT id, name, email, timezone, theme FROM users WHERE id = ?").get(user.id);
  return NextResponse.json({ user: updated });
}
