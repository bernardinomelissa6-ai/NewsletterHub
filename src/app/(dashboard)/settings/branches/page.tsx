import { requireRole } from "@/lib/auth/session";
import { getBranches } from "@/services/branch.service";
import { BranchSettings } from "@/components/settings/BranchSettings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ramos" };

export default async function BranchesPage() {
  await requireRole("ADMIN");

  const branches = await getBranches(false);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gerenciar Ramos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Crie e gerencie os ramos disponíveis no cadastro de elogios
        </p>
      </div>
      <BranchSettings initialBranches={branches as any} />
    </div>
  );
}
