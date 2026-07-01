import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getBranches, createBranch, updateBranch, toggleBranch, deleteBranch } from "@/services/branch.service";

export async function GET() {
  const { data } = await import("@/lib/supabase/admin").then(({ supabaseAdmin }) =>
    supabaseAdmin.from("branches").select("id, name, is_active").eq("is_active", true).order("name")
  );
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  try {
    const branch = await createBranch(name);
    return NextResponse.json(branch, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Erro ao criar ramo" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const { id, name, is_active } = await req.json();
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  try {
    if (typeof is_active === "boolean") {
      await toggleBranch(id, is_active);
    } else if (name) {
      await updateBranch(id, name);
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Erro ao atualizar ramo" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Não autorizado" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  try {
    await deleteBranch(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Erro ao excluir ramo" }, { status: 500 });
  }
}
