import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getUserById, updateUser, deactivateUser, resetUserPassword } from "@/services/user.service";
import { updateUserSchema } from "@/lib/validations/user.schema";
import { z } from "zod";

const patchBodySchema = updateUserSchema.extend({
  password: z.string().min(8).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;

  if (session.user.role !== "ADMIN" && session.user.id !== id) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const user = await getUserById(id);
  if (!user) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const user = await updateUser(
      id, parsed.data,
      session.user.id, session.user.name ?? "Admin", session.user.role
    );
    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await params;
  const isOwnProfile = session.user.id === id;
  if (!isOwnProfile && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = patchBodySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });

    const { password, ...updateData } = parsed.data;

    const user = await updateUser(
      id, updateData,
      session.user.id, session.user.name ?? "Usuário", session.user.role
    );

    if (password && session.user.role === "ADMIN") {
      await resetUserPassword(id, password, session.user.id, session.user.name ?? "Admin");
    }

    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { id } = await params;
  await deactivateUser(id, session.user.id, session.user.name ?? "Admin");
  return NextResponse.json({ message: "Usuário desativado" });
}
