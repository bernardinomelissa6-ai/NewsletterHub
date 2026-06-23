import { requireAuth } from "@/lib/auth/session";
import { getComplimentById } from "@/services/compliment.service";
import { ComplimentForm } from "@/components/compliments/ComplimentForm";
import { prisma } from "@/lib/db/prisma";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar Elogio" };

export default async function EditComplimentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  const { id } = await params;

  const compliment = await getComplimentById(id);
  if (!compliment) notFound();

  // Only allow editing when returned for adjustment
  if (compliment.status !== "DEVOLVIDO_PARA_AJUSTE") redirect(`/compliments/${id}`);

  // Only the original collaborator or admin can edit
  if (compliment.collaborator.id !== session.user.id && session.user.role !== "ADMIN") redirect(`/compliments/${id}`);

  const collaborators = [{ id: compliment.collaborator.id, name: compliment.collaborator.name, area: compliment.collaborator.area }];

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Editar Elogio</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ajuste o elogio conforme as orientações recebidas
        </p>
      </div>
      <ComplimentForm
        collaborators={collaborators as any}
        complimentId={id}
        defaultValues={{
          insured: compliment.insured,
          receivedAt: compliment.receivedAt instanceof Date
            ? compliment.receivedAt.toISOString().split("T")[0]
            : String(compliment.receivedAt).split("T")[0],
          branch: compliment.branch,
          reason: compliment.reason,
          collaboratorId: compliment.collaborator.id,
        }}
      />
    </div>
  );
}
