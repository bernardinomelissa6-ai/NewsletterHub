import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail, buildVerificationEmail } from "@/lib/email/email";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 });

    const { data: user } = await supabaseAdmin.from("users").select("id, name, email_verified").eq("email", email).single();
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    if (user.email_verified) return NextResponse.json({ error: "Conta já ativada" }, { status: 400 });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabaseAdmin.from("verification_codes").insert({ id: randomUUID(), user_id: user.id, code, expires_at: expiresAt });
    await sendEmail({ to: email, subject: "Novo código de verificação", html: buildVerificationEmail(code, user.name) });

    return NextResponse.json({ message: "Código reenviado" });
  } catch (err) {
    console.error("[ResendCode]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
