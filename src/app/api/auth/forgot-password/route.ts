import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail, buildVerificationEmail } from "@/lib/email/email";
import { randomUUID } from "crypto";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Se o email estiver cadastrado, você receberá as instruções." });
  }

  const { email } = parsed.data;
  const { data: user } = await supabaseAdmin.from("users").select("id, name, email").eq("email", email).single();

  if (user) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabaseAdmin.from("verification_codes").delete().eq("user_id", user.id);
    await supabaseAdmin.from("verification_codes").insert({ id: randomUUID(), user_id: user.id, code, expires_at: expiresAt });

    sendEmail({ to: user.email, subject: "Código de recuperação de senha", html: buildVerificationEmail(code, user.name) }).catch(console.error);
  }

  return NextResponse.json({ message: "Se o email estiver cadastrado, você receberá as instruções." });
}
