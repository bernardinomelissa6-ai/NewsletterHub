import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { data, error, count } = await supabaseAdmin
    .from("areas")
    .select("*", { count: "exact" });

  return NextResponse.json({ data, error, count });
}
