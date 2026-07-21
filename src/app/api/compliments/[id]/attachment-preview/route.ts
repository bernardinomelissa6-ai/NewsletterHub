import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getComplimentById } from "@/services/compliment.service";
import { parseMsgAttachment, parseEmlAttachment } from "@/lib/email/parse-attachment";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const compliment = await getComplimentById(id);
  if (!compliment) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  const { role, id: userId } = session.user;
  if (role === "COLLABORATOR" && (compliment as any).collaborator?.id !== userId) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const url = (compliment as any).attachmentUrl as string | null;
  const name = (compliment as any).attachmentName as string | null;
  if (!url) return NextResponse.json({ error: "Este elogio não possui anexo" }, { status: 404 });

  const ext = (name ?? url).split("?")[0].split(".").pop()?.toLowerCase();
  if (ext !== "msg" && ext !== "eml") {
    return NextResponse.json({ error: "Pré-visualização não suportada para este tipo de arquivo" }, { status: 400 });
  }

  try {
    const fileRes = await fetch(url);
    if (!fileRes.ok) throw new Error("Falha ao baixar o anexo");
    const buffer = await fileRes.arrayBuffer();
    const parsed = ext === "msg" ? parseMsgAttachment(buffer) : await parseEmlAttachment(buffer);
    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("[GET /api/compliments/[id]/attachment-preview]", err);
    return NextResponse.json({ error: err.message ?? "Erro ao processar anexo" }, { status: 500 });
  }
}
