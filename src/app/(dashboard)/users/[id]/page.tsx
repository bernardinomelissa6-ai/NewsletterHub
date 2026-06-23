import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { UserForm } from "@/components/users/UserForm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar Usuário" };

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, role: true, areaId: true } });
  if (!user) notFound();

  const areas = await prisma.area.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Editar Usuário</h1>
        <p className="text-muted-foreground text-sm mt-1">{user.name}</p>
      </div>
      <UserForm
        areas={areas}
        userId={user.id}
        defaultValues={{ name: user.name, email: user.email, role: user.role, areaId: user.areaId ?? "" }}
      />
    </div>
  );
}
