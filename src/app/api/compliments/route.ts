import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createCompliment, getCompliments } from "@/services/compliment.service";
import { createComplimentSchema, complimentFilterSchema } from "@/lib/validations/compliment.schema";
import { uploadFile, ALLOWED_COMPLIMENT_TYPES } from "@/lib/storage/supabase-storage";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filter = complimentFilterSchema.parse(Object.fromEntries(searchParams));

  const result = await getCompliments(
    filter,
    session.user.id,
    session.user.role,
    session.user.areaId ?? null
  );

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const formData = await req.formData();

    const data = {
      insured: formData.get("insured") as string,
      receivedAt: formData.get("receivedAt") as string,
      branch: formData.get("branch") as string,
      reason: formData.get("reason") as string,
      collaboratorId: formData.get("collaboratorId") as string,
    };

    const parsed = createComplimentSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    let attachmentUrl: string | undefined;
    let attachmentName: string | undefined;
    let attachmentType: string | undefined;

    const file = formData.get("attachment") as File | null;
    if (file && file.size > 0) {
      const uploaded = await uploadFile(file, "compliments", ALLOWED_COMPLIMENT_TYPES);
      attachmentUrl = uploaded.url;
      attachmentName = uploaded.name;
      attachmentType = uploaded.type;
    }

    const ipAddress = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined;

    const compliment = await createCompliment(
      parsed.data,
      session.user.id,
      session.user.name ?? "Desconhecido",
      session.user.role,
      attachmentUrl,
      attachmentName,
      attachmentType,
      ipAddress
    );

    return NextResponse.json(compliment, { status: 201 });
  } catch (err: any) {
    console.error("[POST /compliments]", err);
    return NextResponse.json({ error: err.message ?? "Erro interno" }, { status: 500 });
  }
}
