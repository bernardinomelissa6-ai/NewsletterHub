import { requireRole } from "@/lib/auth/session";
import { getRemovedCompliments } from "@/services/compliment.service";
import { RemovedComplimentsList } from "@/components/compliments/RemovedComplimentsList";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Itens Retirados" };

export default async function RemovedCompliments() {
  await requireRole("ADMIN");

  const compliments = await getRemovedCompliments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Itens Retirados</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Elogios retirados do sistema. Eles não aparecem em nenhuma lista, ranking ou avaliação até serem restaurados.
        </p>
      </div>
      <RemovedComplimentsList initialData={compliments as any} />
    </div>
  );
}
