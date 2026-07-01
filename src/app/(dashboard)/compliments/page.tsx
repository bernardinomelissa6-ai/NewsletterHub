import { requireAuth } from "@/lib/auth/session";
import { getCompliments } from "@/services/compliment.service";
import { ComplimentList } from "@/components/compliments/ComplimentList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Elogios" };

export default async function ComplimentsPage() {
  const session = await requireAuth();
  const { role, id: userId, areaId } = session.user;

  const result = await getCompliments(
    { page: 1, limit: 20 },
    userId,
    role,
    areaId ?? null
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Elogios</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {role === "COLLABORATOR"
              ? "Seus elogios registrados"
              : role === "MANAGER"
              ? "Elogios da sua equipe"
              : "Todos os elogios"}
          </p>
        </div>
        <Button asChild>
          <Link href="/compliments/new">
            <Plus className="w-4 h-4" /> Novo Elogio
          </Link>
        </Button>
      </div>
      <ComplimentList initialData={result as any} userRole={role} userId={userId} />
    </div>
  );
}
