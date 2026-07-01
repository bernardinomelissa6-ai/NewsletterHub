import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Nova senha deve ter ao menos 8 caracteres"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { data: user } = await supabaseAdmin.from("users").select("password_hash").eq("id", session.user.id).single();
  if (!user?.password_hash) return NextResponse.json({ error: "Usuário inválido" }, { status: 400 });

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.password_hash);
  if (!valid) return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });

  const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
  await supabaseAdmin.from("users").update({ password_hash: hashed, updated_at: new Date().toISOString() }).eq("id", session.user.id);

  return NextResponse.json({ message: "Senha alterada com sucesso" });
}
