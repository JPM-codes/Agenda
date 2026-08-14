import { NextResponse } from "next/server";
import { requireUser, parseBody, str } from "@/lib/api";
import { db, type UserRow } from "@/lib/db";
import { hashPassword, verifyPassword, destroySession } from "@/lib/auth";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const parsed = await parseBody(request);
  if (!parsed.ok) return parsed.response;

  const current = str(parsed.body.current);
  const next = str(parsed.body.next);

  if (!current || !next) {
    return NextResponse.json({ error: "Informe a senha atual e a nova senha." }, { status: 400 });
  }
  if (next.length < 6) {
    return NextResponse.json({ error: "A nova senha deve ter pelo menos 6 caracteres." }, { status: 400 });
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(auth.user.id) as UserRow;
  if (!verifyPassword(current, user.password_hash)) {
    return NextResponse.json({ error: "Senha atual incorreta." }, { status: 401 });
  }

  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(
    hashPassword(next),
    user.id
  );

  await destroySession();
  return NextResponse.json({ ok: true });
}
