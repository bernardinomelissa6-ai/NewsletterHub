import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AreaForm } from "@/components/areas/AreaForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nova Área" };

export default async function NewAreaPage() {
  await requireRole("ADMIN");

  const [managers, directors] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["MANAGER", "ADMIN"] }, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "DIRECTOR", isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-md">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nova Área</h1>
        <p className="text-muted-foreground text-sm mt-1">Cadastre uma nova área organizacional</p>
      </div>
      <AreaForm managers={managers} directors={directors} />
    </div>
  );
}
