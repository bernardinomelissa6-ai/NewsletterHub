import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { evaluateCompliment, reevaluateCompliment } from "@/services/compliment.service";
import { evaluateComplimentSchema, reevaluateComplimentSchema } from "@/lib/validations/compliment.schema";

const ALLOWED_ROLES = ["DIRECTOR", "DIRETOR_CENTRAL", "ADMIN"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = evaluateComplimentSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const ipAddress = req.headers.get("x-forwarded-for") ?? undefined;
    await evaluateCompliment(id, session.user.id, session.user.name ?? "Desconhecido", session.user.role, parsed.data, ipAddress);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = reevaluateComplimentSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const ipAddress = req.headers.get("x-forwarded-for") ?? undefined;
    await reevaluateCompliment(id, session.user.id, session.user.name ?? "Desconhecido", session.user.role, parsed.data, ipAddress);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
