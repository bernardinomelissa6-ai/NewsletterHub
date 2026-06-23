import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { UserForm } from "@/components/users/UserForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo Usuário" };

export default async function NewUserPage() {
  await requireRole("ADMIN");
  const areas = await prisma.area.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Novo Usuário</h1>
        <p className="text-muted-foreground text-sm mt-1">Cadastre um novo usuário no sistema</p>
      </div>
      <UserForm areas={areas} />
    </div>
  );
}
