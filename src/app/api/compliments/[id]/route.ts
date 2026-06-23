import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getComplimentById, updateCompliment } from "@/services/compliment.service";
import { prisma } from "@/lib/db/prisma";
import { uploadFile, ALLOWED_COMPLIMENT_TYPES } from "@/lib/storage/supabase-storage";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const compliment = await getComplimentById(id);
  if (!compliment) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const { role, id: userId } = session.user;
  if (role === "COLLABORATOR" && compliment.collaboratorId !== userId && compliment.submittedBy.id !== userId) {
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

    const file = formData.get("attachment") as File | null;
    if (file && file.size > 0) {
      const uploaded = await uploadFile(file, "compliments", ALLOWED_COMPLIMENT_TYPES);
      data.attachmentUrl = uploaded.url;
      data.attachmentName = uploaded.name;
      data.attachmentType = uploaded.type;
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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.compliment.delete({ where: { id } });
    return NextResponse.json({ message: "Excluído com sucesso" });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}
