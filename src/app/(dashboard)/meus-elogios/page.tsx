import { requireRole } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MyComplimentsList } from "@/components/compliments/MyComplimentsList";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Meus Reconhecimentos" };

async function getMyCompliments(userId: string) {
  const { data } = await supabaseAdmin
    .from("compliments")
    .select("id, insured, branch, reason, received_at, quarter, year, status, final_medal, attachment_url, created_at")
    .or(`collaborator_id.eq.${userId},submitted_by_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function MeusElogiosPage() {
  const session = await requireRole("COLLABORATOR");
  const compliments = await getMyCompliments(session.user.id);

  const evaluated = compliments.filter((c) => c.status === "AVALIADO");
  const pending = compliments.filter((c) => c.status !== "AVALIADO");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meus Reconhecimentos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {evaluated.length} elogio{evaluated.length !== 1 ? "s" : ""} avaliado{evaluated.length !== 1 ? "s" : ""}
          {pending.length > 0 && ` • ${pending.length} em andamento`}
        </p>
      </div>
      <MyComplimentsList compliments={compliments as any} />
    </div>
  );
}
