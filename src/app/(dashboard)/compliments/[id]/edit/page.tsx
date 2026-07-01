import { requireAuth } from "@/lib/auth/session";
import { getComplimentById } from "@/services/compliment.service";
import { getBranches } from "@/services/branch.service";
import { ComplimentForm } from "@/components/compliments/ComplimentForm";
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
  const coll = (compliment as any).collaborator;
  if (coll?.id !== session.user.id && session.user.role !== "ADMIN") redirect(`/compliments/${id}`);

  const collaborators = [{ id: coll?.id, name: coll?.name, area: coll?.area }];
  const receivedAt = (compliment as any).received_at ?? (compliment as any).receivedAt;
  const branches = await getBranches(true);

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
        branches={branches}
        complimentId={id}
        defaultValues={{
          insured: compliment.insured,
          receivedAt: String(receivedAt).split("T")[0],
          branch: compliment.branch,
          reason: compliment.reason,
          collaboratorId: coll?.id,
        }}
      />
    </div>
  );
}
