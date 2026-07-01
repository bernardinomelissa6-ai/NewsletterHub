import { requireAuth } from "@/lib/auth/session";
import { getTrainings } from "@/services/training.service";
import { TrainingList } from "@/components/trainings/TrainingList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Treinamentos" };

export default async function TrainingsPage() {
  const session = await requireAuth();
  const { role, id: userId } = session.user;

  const result = await getTrainings({ page: 1, limit: 20 }, userId, role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Treinamentos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Registros de treinamentos, cursos e consultorias
          </p>
        </div>
        <Button asChild>
          <Link href="/trainings/new">
            <Plus className="w-4 h-4" /> Novo Registro
          </Link>
        </Button>
      </div>
      <TrainingList initialData={result as any} userRole={role} />
    </div>
  );
}
