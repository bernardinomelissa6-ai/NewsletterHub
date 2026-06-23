import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyEmailSchema } from "@/lib/validations/auth.schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = body;

    const parsed = verifyEmailSchema.safeParse({ code });
    if (!parsed.success) {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    if (user.emailVerified) return NextResponse.json({ error: "Conta já ativada" }, { status: 400 });

    const verification = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        code,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verification) {
      return NextResponse.json({ error: "Código inválido ou expirado" }, { status: 400 });
    }

    await Promise.all([
      prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } }),
      prisma.verificationCode.update({ where: { id: verification.id }, data: { usedAt: new Date() } }),
    ]);

    return NextResponse.json({ message: "Conta ativada com sucesso!" });
  } catch (err) {
    console.error("[VerifyEmail]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
