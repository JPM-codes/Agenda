import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { listWorkDays, getWorkDay } from "@/lib/workdays";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const date = url.searchParams.get("date") ?? "";

  if (date) {
    return NextResponse.json({ workDays: [getWorkDay(auth.user.id, date)].filter(Boolean) });
  }

  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 90) || 90, 1), 365);

  return NextResponse.json({ workDays: listWorkDays(auth.user.id, limit) });
}
