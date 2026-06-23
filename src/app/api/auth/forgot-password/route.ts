import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendEmail, buildVerificationEmail } from "@/lib/email/email";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  // Always return 200 to prevent email enumeration
  if (!parsed.success) {
    return NextResponse.json({ message: "Se o email estiver cadastrado, você receberá as instruções." });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, email: true } });

  if (user) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete existing codes and create a new one (userId is not unique in schema)
    await prisma.verificationCode.deleteMany({ where: { userId: user.id } });
    await prisma.verificationCode.create({ data: { userId: user.id, code, expiresAt } });

    sendEmail({
      to: user.email,
      subject: "Código de recuperação de senha",
      html: buildVerificationEmail(code, user.name),
    }).catch(console.error);
  }

  return NextResponse.json({ message: "Se o email estiver cadastrado, você receberá as instruções." });
}
