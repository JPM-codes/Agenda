import { NextResponse } from "next/server";
import { requireUser, parseBody, str, int } from "@/lib/api";
import { db } from "@/lib/db";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const tipId = Number(id);
  if (!Number.isInteger(tipId)) {
    return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
  }

  const existing = db.prepare("SELECT * FROM tips WHERE id = ? AND user_id = ?").get(tipId, auth.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Dica não encontrada." }, { status: 404 });
  }

  const parsed = await parseBody(request);
  if (!parsed.ok) return parsed.response;

  const fields = existing as Record<string, string | number | null>;
  if (parsed.body.title !== undefined) fields.title = str(parsed.body.title);
  if (parsed.body.content !== undefined) fields.content = str(parsed.body.content);
  if (parsed.body.category !== undefined) fields.category = str(parsed.body.category);
  if (parsed.body.tags !== undefined) fields.tags = str(parsed.body.tags);
  if (parsed.body.is_favorite !== undefined) fields.is_favorite = int(parsed.body.is_favorite) ?? 0;
  if (parsed.body.is_pinned !== undefined) fields.is_pinned = int(parsed.body.is_pinned) ?? 0;

  if (!str(fields.title)) {
    return NextResponse.json({ error: "Informe o título da dica." }, { status: 400 });
  }

  db.prepare(
    `UPDATE tips SET title = ?, content = ?, category = ?, tags = ?, is_favorite = ?, is_pinned = ?,
     updated_at = datetime('now') WHERE id = ? AND user_id = ?`
  ).run(
    fields.title,
    fields.content,
    fields.category,
    fields.tags,
    fields.is_favorite,
    fields.is_pinned,
    tipId,
    auth.user.id
  );

  const tip = db.prepare("SELECT * FROM tips WHERE id = ? AND user_id = ?").get(tipId, auth.user.id);
  return NextResponse.json({ tip });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const tipId = Number(id);
  if (!Number.isInteger(tipId)) {
    return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
  }

  const result = db.prepare("DELETE FROM tips WHERE id = ? AND user_id = ?").run(tipId, auth.user.id);
  if (result.changes === 0) {
    return NextResponse.json({ error: "Dica não encontrada." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
