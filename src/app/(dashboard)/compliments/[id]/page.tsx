import { requireAuth } from "@/lib/auth/session";
import { getComplimentById } from "@/services/compliment.service";
import { ComplimentDetail } from "@/components/compliments/ComplimentDetail";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Detalhes do Elogio" };

export default async function ComplimentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  const { id } = await params;

  const compliment = await getComplimentById(id);
  if (!compliment) notFound();

  return (
    <div className="max-w-2xl">
      <ComplimentDetail compliment={compliment as any} userRole={session.user.role} userId={session.user.id} />
    </div>
  );
}
