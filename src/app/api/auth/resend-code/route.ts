import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendEmail, buildVerificationEmail } from "@/lib/email/email";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    if (user.emailVerified) return NextResponse.json({ error: "Conta já ativada" }, { status: 400 });

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.verificationCode.create({ data: { userId: user.id, code, expiresAt } });

    await sendEmail({
      to: email,
      subject: "Novo código de verificação",
      html: buildVerificationEmail(code, user.name),
    });

    return NextResponse.json({ message: "Código reenviado" });
  } catch (err) {
    console.error("[ResendCode]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
