import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getDeadlines, upsertDeadline } from "@/services/deadline.service";
import type { DeadlineType } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  const deadlines = await getDeadlines();
  return NextResponse.json(deadlines);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { type, days } = body;

    if (!type || typeof days !== "number" || days < 1) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const deadline = await upsertDeadline(type as DeadlineType, days);
    return NextResponse.json(deadline);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
