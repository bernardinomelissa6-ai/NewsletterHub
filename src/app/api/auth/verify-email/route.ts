import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { verifyEmailSchema } from "@/lib/validations/auth.schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = body;

    const parsed = verifyEmailSchema.safeParse({ code });
    if (!parsed.success) return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "E-mail obrigatório" }, { status: 400 });

    const { data: user } = await supabaseAdmin.from("users").select("id, email_verified").eq("email", email).single();
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    if (user.email_verified) return NextResponse.json({ error: "Conta já ativada" }, { status: 400 });

    const { data: verification } = await supabaseAdmin
      .from("verification_codes")
      .select("id")
      .eq("user_id", user.id)
      .eq("code", code)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (!verification) return NextResponse.json({ error: "Código inválido ou expirado" }, { status: 400 });

    await Promise.all([
      supabaseAdmin.from("users").update({ email_verified: true, updated_at: new Date().toISOString() }).eq("id", user.id),
      supabaseAdmin.from("verification_codes").update({ used_at: new Date().toISOString() }).eq("id", verification.id),
    ]);

    return NextResponse.json({ message: "Conta ativada com sucesso!" });
  } catch (err) {
    console.error("[VerifyEmail]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
