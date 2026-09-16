"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BookOpen, GraduationCap, Users, Search, Paperclip, Trash2 } from "lucide-react";

const TYPE_CONFIG = {
  TRAINING: { label: "Treinamento", icon: BookOpen, color: "bg-blue-100 text-blue-800" },
  COURSE: { label: "Curso", icon: GraduationCap, color: "bg-green-100 text-green-800" },
  CONSULTANCY: { label: "Consultoria", icon: Users, color: "bg-purple-100 text-purple-800" },
};

interface Training {
  id: string;
  insured: string;
  date: string;
  type: "TRAINING" | "COURSE" | "CONSULTANCY";
  branch: string;
  ramo: string;
  quarter: number;
  year: number;
  attachment_url: string | null;
  collaborator: { id: string; name: string; area?: { name: string } | null };
}

interface Props {
  initialData: { data: Training[]; total: number };
  userRole: string;
}

export function TrainingList({ initialData, userRole }: Props) {
  const router = useRouter();
  const [data, setData] = useState(initialData.data);
  const [total, setTotal] = useState(initialData.total);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [toDelete, setToDelete] = useState<Training | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = userRole === "ADMIN";

  const fetchData = useCallback(async (newPage = 1, newSearch = search, newType = typeFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(newPage), limit: "20" });
      if (newSearch) params.set("search", newSearch);
      if (newType) params.set("type", newType);

      const res = await fetch(`/api/trainings?${params}`);
      const json = await res.json();
      setData(json.data);
      setTotal(json.total);
      setPage(newPage);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/trainings/${toDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "Erro ao excluir");
        return;
      }
      toast.success("Registro excluído com sucesso");
      setToDelete(null);
      fetchData(page);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchData(1, search, typeFilter)}
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); fetchData(1, search, v); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os tipos</SelectItem>
                <SelectItem value="TRAINING">Treinamento</SelectItem>
                <SelectItem value="COURSE">Curso</SelectItem>
                <SelectItem value="CONSULTANCY">Consultoria</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">{total} registro{total !== 1 ? "s" : ""}</p>

      {data.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Nenhum registro encontrado</p>
            <p className="text-sm mt-1">
              <Link href="/trainings/new" className="text-primary hover:underline">Registre o primeiro</Link>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map((t) => {
            const config = TYPE_CONFIG[t.type];
            const Icon = config.icon;
            return (
              <Card key={t.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.color}`}>{config.label}</span>
                        <span className="text-xs text-muted-foreground">{t.branch} • {t.ramo} • T{t.quarter}/{t.year}</span>
                      </div>
                      <p className="font-medium truncate">{t.insured}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{t.collaborator.name}</span>
                        {t.collaborator.area && <span>• {t.collaborator.area.name}</span>}
                        <span>• {format(new Date(t.date), "dd/MM/yyyy", { locale: ptBR })}</span>
                        {t.attachment_url && <span className="flex items-center gap-1"><Paperclip className="w-3 h-3" /> Anexo</span>}
                      </div>
                    </div>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive shrink-0" onClick={() => setToDelete(t)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirm delete dialog */}
      <Dialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir registro</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir o registro de <span className="font-semibold text-foreground">{toDelete?.insured}</span>? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setToDelete(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
