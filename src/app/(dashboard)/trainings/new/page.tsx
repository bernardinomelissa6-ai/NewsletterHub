import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { TrainingForm } from "@/components/trainings/TrainingForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo Treinamento" };

export default async function NewTrainingPage() {
  const session = await requireAuth();
  const { role, id: userId } = session.user;

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
        <h1 className="text-2xl font-bold">Registrar Treinamento</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registre um treinamento, curso ou consultoria realizada
        </p>
      </div>
      <TrainingForm collaborators={collaborators} defaultCollaboratorId={role === "COLLABORATOR" ? userId : undefined} />
    </div>
  );
}
