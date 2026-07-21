import { requireRole } from "@/lib/auth/session";
import { getDeadlineMap } from "@/services/deadline.service";
import { DeadlineSettings } from "@/components/settings/DeadlineSettings";
import { DeadlineType } from "@/lib/supabase/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Controle de Prazos" };

const DEADLINE_ORDER: DeadlineType[] = [
  DeadlineType.REGISTRATION,
  DeadlineType.APPROVAL,
  DeadlineType.EVALUATION,
  DeadlineType.CENTRAL_EVALUATION,
];

export default async function DeadlinesPage() {
  await requireRole("ADMIN");

  const deadlineMap = await getDeadlineMap();
  const deadlines = DEADLINE_ORDER.map((type) => ({ type, days: deadlineMap[type] }));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Controle de Prazos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure os prazos de cada etapa do fluxo de elogios
        </p>
      </div>
      <DeadlineSettings deadlines={deadlines} />
    </div>
  );
}
