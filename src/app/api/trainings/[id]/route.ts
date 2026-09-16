import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { deleteTraining } from "@/services/training.service";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  try {
    await deleteTraining(id, session.user.id, session.user.name ?? "Desconhecido", session.user.role);
    return NextResponse.json({ message: "Excluído com sucesso" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Erro ao excluir" }, { status: 400 });
  }
}
