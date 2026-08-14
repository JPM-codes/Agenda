import "server-only";
import { NextResponse } from "next/server";
import { requireUser, parseBody, str } from "@/lib/api";
import { recordWorkEvent } from "@/lib/workdays";

type Field = "check_in" | "lunch_start" | "lunch_end" | "check_out";

export function workDayHandler(field: Field) {
  return async function POST(request: Request) {
    const auth = await requireUser();
    if (!auth.ok) return auth.response;
    const parsed = await parseBody(request);
    if (!parsed.ok) return parsed.response;

    const date = str(parsed.body.date);
    const time = str(parsed.body.time);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Data inválida." }, { status: 400 });
    }
    if (!/^\d{2}:\d{2}/.test(time)) {
      return NextResponse.json({ error: "Horário inválido." }, { status: 400 });
    }

    const result = recordWorkEvent(auth.user.id, date, field, time);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }
    return NextResponse.json({ workDay: result.workDay });
  };
}
