import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";

const apiRegisterSchema = z.object({
  name: z.string().min(3).max(200),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = apiRegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date().toISOString();

    // Verifica se já existe usuário com esse e-mail
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      // Atualiza senha e garante conta ativa
      const { error } = await supabaseAdmin
        .from("users")
        .update({ password_hash: passwordHash, is_active: true, email_verified: true, updated_at: now })
        .eq("email", email);

      if (error) throw error;
      return NextResponse.json({ message: "Senha atualizada com sucesso. Faça login.", isAdmin: true }, { status: 200 });
    }

    // Verifica se é o primeiro usuário
    const { count } = await supabaseAdmin.from("users").select("*", { count: "exact", head: true });

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { error: "Cadastro não permitido. Apenas o administrador pode criar novas contas." },
        { status: 403 }
      );
    }

    // Cria primeiro usuário como ADMIN
    const { error } = await supabaseAdmin.from("users").insert({
      id: randomUUID(),
      name,
      email,
      password_hash: passwordHash,
      role: "ADMIN",
      email_verified: true,
      is_active: true,
      updated_at: now,
    });

    if (error) throw error;

    return NextResponse.json({ message: "Conta admin criada com sucesso.", isAdmin: true }, { status: 201 });
  } catch (err) {
    console.error("[Register]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
