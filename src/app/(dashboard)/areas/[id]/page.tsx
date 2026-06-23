import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AreaForm } from "@/components/areas/AreaForm";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar Área" };

export default async function EditAreaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN");
  const { id } = await params;

  const area = await prisma.area.findUnique({ where: { id } });
  if (!area) notFound();

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
        <h1 className="text-2xl font-bold">Editar Área</h1>
        <p className="text-muted-foreground text-sm mt-1">{area.name}</p>
      </div>
      <AreaForm
        managers={managers}
        directors={directors}
        areaId={area.id}
        defaultValues={{
          name: area.name,
          managerId: area.managerId ?? "",
          directorId: area.directorId ?? "",
        }}
      />
    </div>
  );
}
