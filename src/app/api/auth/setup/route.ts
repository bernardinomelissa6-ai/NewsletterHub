import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date().toISOString();

    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    if (existing) {
      await supabaseAdmin
        .from("users")
        .update({ password_hash: passwordHash, is_active: true, email_verified: true, updated_at: now })
        .eq("email", email.toLowerCase());
      return NextResponse.json({ ok: true });
    }

    await supabaseAdmin.from("users").insert({
      id: randomUUID(),
      name: name ?? "Admin",
      email: email.toLowerCase(),
      password_hash: passwordHash,
      role: "ADMIN",
      email_verified: true,
      is_active: true,
      updated_at: now,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Setup]", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
