import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { UserTable } from "@/components/users/UserTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Usuários" };

export default async function UsersPage() {
  await requireRole("ADMIN");

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: { area: { select: { name: true } } },
  });

  const areas = await prisma.area.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-muted-foreground text-sm mt-1">{users.length} usuário{users.length !== 1 ? "s" : ""} cadastrado{users.length !== 1 ? "s" : ""}</p>
        </div>
        <Button asChild>
          <Link href="/users/new">
            <Plus className="w-4 h-4" /> Novo Usuário
          </Link>
        </Button>
      </div>
      <UserTable users={users as any} areas={areas} />
    </div>
  );
}
