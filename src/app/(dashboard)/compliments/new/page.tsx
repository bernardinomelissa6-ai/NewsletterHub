import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { ComplimentForm } from "@/components/compliments/ComplimentForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo Elogio" };

export default async function NewComplimentPage() {
  const session = await requireAuth();
  const { role, id: userId, areaId } = session.user;

  // Busca colaboradores disponíveis para seleção
  let collaborators;
  if (role === "ADMIN") {
    collaborators = await prisma.user.findMany({
      where: { isActive: true, role: "COLLABORATOR" },
      select: { id: true, name: true, area: { select: { name: true } } },
      orderBy: { name: "asc" },
    });
  } else if (role === "MANAGER") {
    const areas = await prisma.area.findMany({ where: { managerId: userId }, select: { id: true } });
    collaborators = await prisma.user.findMany({
      where: { isActive: true, role: "COLLABORATOR", areaId: { in: areas.map((a) => a.id) } },
      select: { id: true, name: true, area: { select: { name: true } } },
      orderBy: { name: "asc" },
    });
  } else {
    collaborators = await prisma.user.findMany({
      where: { id: userId },
      select: { id: true, name: true, area: { select: { name: true } } },
    });
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Registrar Elogio</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registre um elogio recebido de cliente, segurado, parceiro ou corretor
        </p>
      </div>
      <ComplimentForm collaborators={collaborators} defaultCollaboratorId={role === "COLLABORATOR" ? userId : undefined} />
    </div>
  );
}
