"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Edit, Trash2, Building2, Users } from "lucide-react";

interface Area {
  id: string;
  name: string;
  manager?: { id: string; name: string } | null;
  _count: { collaborators: number };
}

export function AreaTable({ areas: initial, managers }: { areas: Area[]; managers: { id: string; name: string }[] }) {
  const router = useRouter();
  const [areas, setAreas] = useState(initial);
  const [confirmDelete, setConfirmDelete] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  async function deleteArea() {
    if (!confirmDelete) return;
    setLoading(true);
    const res = await fetch(`/api/areas/${confirmDelete.id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Erro ao excluir"); setLoading(false); return; }
    setAreas((prev) => prev.filter((a) => a.id !== confirmDelete.id));
    setConfirmDelete(null);
    setLoading(false);
    toast.success("Área excluída");
  }

  if (areas.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16 text-center text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Nenhuma área cadastrada</p>
          <p className="text-sm mt-1">
            <Link href="/areas/new" className="text-primary hover:underline">Crie a primeira área</Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left text-muted-foreground text-xs uppercase">
                <th className="px-4 py-3">Área</th>
                <th className="px-4 py-3 hidden md:table-cell">Gestor</th>
                <th className="px-4 py-3 text-center">Colaboradores</th>
                <th className="px-4 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {areas.map((a) => (
                <tr key={a.id} className="border-b last:border-0 hover:bg-accent/50">
                  <td className="px-4 py-3 font-medium">{a.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{a.manager?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Users className="w-3 h-3" /> {a._count.collaborators}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/areas/${a.id}`}><Edit className="w-4 h-4" /></Link>
                      </Button>
                      <Button
                        variant="ghost" size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setConfirmDelete(a)}
                        disabled={a._count.collaborators > 0}
                        title={a._count.collaborators > 0 ? "Remova os colaboradores primeiro" : "Excluir área"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar exclusão</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir a área <strong>{confirmDelete?.name}</strong>?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={deleteArea} disabled={loading}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
