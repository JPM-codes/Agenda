import { NextResponse } from "next/server";
import { requireUser, parseBody } from "@/lib/api";
import { saveWorkDayManual } from "@/lib/workdays";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const parsed = await parseBody(request);
  if (!parsed.ok) return parsed.response;

  const result = saveWorkDayManual(auth.user.id, String(parsed.body.date ?? ""), {
    check_in: parsed.body.check_in,
    lunch_start: parsed.body.lunch_start,
    lunch_end: parsed.body.lunch_end,
    check_out: parsed.body.check_out,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ workDay: result.workDay });
}
