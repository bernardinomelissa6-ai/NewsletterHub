import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getComplimentById, updateCompliment, removeCompliment, restoreCompliment } from "@/services/compliment.service";
import { uploadFile, ALLOWED_COMPLIMENT_TYPES } from "@/lib/storage/supabase-storage";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const compliment = await getComplimentById(id);
  if (!compliment) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const { role, id: userId } = session.user;
  if (role === "COLLABORATOR" && (compliment as any).collaborator_id !== userId && (compliment as any).submitted_by?.id !== userId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  return NextResponse.json(compliment);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  try {
    const formData = await req.formData();

    const data: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      if (key !== "attachment") data[key] = value;
    }

    // Direct-upload path: client pre-uploaded the file to Supabase Storage
    if (!data.attachmentUrl) {
      const file = formData.get("attachment") as File | null;
      if (file && file.size > 0) {
        const uploaded = await uploadFile(file, "compliments", ALLOWED_COMPLIMENT_TYPES);
        data.attachmentUrl = uploaded.url;
        data.attachmentName = uploaded.name;
        data.attachmentType = uploaded.type;
      }
    }

    const ipAddress = req.headers.get("x-forwarded-for") ?? undefined;

    const updated = await updateCompliment(
      id,
      session.user.id,
      session.user.name ?? "Desconhecido",
      session.user.role,
      data as any,
      ipAddress
    );

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Erro interno" }, { status: 400 });
  }
}

// Retira o elogio de todas as telas do sistema (soft delete) — fica preservado
// na página de "Itens Retirados" e pode ser restaurado.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  const ipAddress = req.headers.get("x-forwarded-for") ?? undefined;

  try {
    await removeCompliment(id, session.user.id, session.user.name ?? "Desconhecido", session.user.role, ipAddress);
    return NextResponse.json({ message: "Elogio retirado com sucesso" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Erro ao retirar" }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const ipAddress = req.headers.get("x-forwarded-for") ?? undefined;

  if (body.action !== "restore") {
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  }

  try {
    await restoreCompliment(id, session.user.id, session.user.name ?? "Desconhecido", session.user.role, ipAddress);
    return NextResponse.json({ message: "Elogio restaurado com sucesso" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Erro ao restaurar" }, { status: 400 });
  }
}
