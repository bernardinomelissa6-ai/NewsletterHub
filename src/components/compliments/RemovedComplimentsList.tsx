"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Archive, RotateCcw } from "lucide-react";

interface RemovedCompliment {
  id: string;
  insured: string;
  branch: string;
  receivedAt: string;
  quarter: number;
  year: number;
  status: string;
  removedAt: string;
  collaboratorName: string;
  removedByName: string;
}

interface Props {
  initialData: RemovedCompliment[];
}

export function RemovedComplimentsList({ initialData }: Props) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [toRestore, setToRestore] = useState<RemovedCompliment | null>(null);
  const [restoring, setRestoring] = useState(false);

  async function handleRestore() {
    if (!toRestore) return;
    setRestoring(true);
    try {
      const res = await fetch(`/api/compliments/${toRestore.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "Erro ao restaurar");
        return;
      }
      toast.success("Elogio restaurado com sucesso");
      setData((prev) => prev.filter((c) => c.id !== toRestore.id));
      setToRestore(null);
      router.refresh();
    } finally {
      setRestoring(false);
    }
  }

  if (data.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16 text-center text-muted-foreground">
          <Archive className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Nenhum item retirado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{data.length} item{data.length !== 1 ? "s" : ""} retirado{data.length !== 1 ? "s" : ""}</p>

      <div className="space-y-3">
        {data.map((c) => (
          <Card key={c.id} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs text-muted-foreground">T{c.quarter}/{c.year} • {c.branch}</span>
                  </div>
                  <p className="font-semibold truncate">{c.insured}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span>{c.collaboratorName}</span>
                    <span>•</span>
                    <span>Recebido em {format(new Date(c.receivedAt.substring(0, 10) + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR })}</span>
                    <span>•</span>
                    <span>Retirado por {c.removedByName} em {format(new Date(c.removedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setToRestore(c)}>
                  <RotateCcw className="w-4 h-4" /> Restaurar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!toRestore} onOpenChange={(open) => !open && setToRestore(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Restaurar elogio</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Restaurar o elogio de <span className="font-semibold text-foreground">{toRestore?.insured}</span>? Ele voltará a aparecer normalmente em todo o sistema.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setToRestore(null)} disabled={restoring}>
              Cancelar
            </Button>
            <Button onClick={handleRestore} disabled={restoring}>
              {restoring ? "Restaurando..." : "Restaurar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
