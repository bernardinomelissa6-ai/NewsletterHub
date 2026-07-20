import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createCompliment, getCompliments } from "@/services/compliment.service";
import { createComplimentSchema, complimentFilterSchema } from "@/lib/validations/compliment.schema";
import { uploadFile, ALLOWED_COMPLIMENT_TYPES } from "@/lib/storage/supabase-storage";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveCollaboratorId(nameOrId: string, fallbackId: string): Promise<string> {
  if (UUID_REGEX.test(nameOrId)) return nameOrId;
  const { data } = await supabaseAdmin
    .from("users")
    .select("id")
    .ilike("name", nameOrId.trim())
    .eq("is_active", true)
    .limit(1);
  return data?.[0]?.id ?? fallbackId;
}

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
      claimHistory: formData.get("claimHistory") as string,
      collaboratorId: formData.get("collaboratorId") as string,
    };

    const parsed = createComplimentSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const resolvedCollaboratorId = await resolveCollaboratorId(parsed.data.collaboratorId, session.user.id);

    let attachmentUrl: string | undefined;
    let attachmentName: string | undefined;
    let attachmentType: string | undefined;

    // Direct-upload path: client uploaded to Supabase Storage directly and sends URL
    const preUploadedUrl = formData.get("attachmentUrl") as string | null;
    if (preUploadedUrl) {
      attachmentUrl = preUploadedUrl;
      attachmentName = (formData.get("attachmentName") as string | null) ?? undefined;
      attachmentType = (formData.get("attachmentType") as string | null) ?? undefined;
    } else {
      // Fallback: file in form body (limited to ~4MB on Vercel)
      const file = formData.get("attachment") as File | null;
      if (file && file.size > 0) {
        const uploaded = await uploadFile(file, "compliments", ALLOWED_COMPLIMENT_TYPES);
        attachmentUrl = uploaded.url;
        attachmentName = uploaded.name;
        attachmentType = uploaded.type;
      }
    }

    const ipAddress = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined;

    const compliment = await createCompliment(
      { ...parsed.data, collaboratorId: resolvedCollaboratorId },
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
