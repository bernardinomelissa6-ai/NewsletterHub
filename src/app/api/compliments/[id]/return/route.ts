import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { returnCompliment } from "@/services/compliment.service";
import { returnComplimentSchema } from "@/lib/validations/compliment.schema";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (!["MANAGER", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = returnComplimentSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const ipAddress = req.headers.get("x-forwarded-for") ?? undefined;
    const result = await returnCompliment(
      id, session.user.id, session.user.name ?? "Desconhecido",
      session.user.role, parsed.data, ipAddress
    );
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
