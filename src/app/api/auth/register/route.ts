import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { registerSchema } from "@/lib/validations/auth.schema";
import { sendEmail, buildVerificationEmail } from "@/lib/email/email";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: "COLLABORATOR", emailVerified: false, isActive: true },
    });

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.verificationCode.create({
      data: { userId: user.id, code, expiresAt },
    });

    await sendEmail({
      to: email,
      subject: "Ative sua conta — Sistema de Reconhecimento",
      html: buildVerificationEmail(code, name),
    });

    return NextResponse.json({ message: "Conta criada. Verifique seu e-mail." }, { status: 201 });
  } catch (err) {
    console.error("[Register]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
