"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Search, Filter, Star, Paperclip } from "lucide-react";
import { MEDAL_LABELS, MEDAL_COLORS } from "@/lib/utils/ranking";
import type { MedalType, ComplimentStatus } from "@/lib/supabase/types";

const STATUS_CONFIG: Record<ComplimentStatus, { label: string; className: string }> = {
  PENDENTE_APROVACAO: { label: "Pend. Aprovação", className: "status-pending" },
  PENDENTE_AVALIACAO: { label: "Pend. Avaliação", className: "bg-red-100 text-red-800 border-red-200" },
  REJEITADO: { label: "Rejeitado", className: "status-rejected" },
  DEVOLVIDO_PARA_AJUSTE: { label: "Devolvido", className: "status-returned" },
  AVALIADO: { label: "Avaliado", className: "status-evaluated" },
};

interface Compliment {
  id: string;
  insured: string;
  received_at: string;
  branch: string;
  reason: string;
  status: ComplimentStatus;
  attachment_url: string | null;
  quarter: number;
  year: number;
  created_at: string;
  collaborator: { id: string; name: string } | null;
  evaluations: Array<{ medal: MedalType }>;
}

interface Props {
  initialData: { data: Compliment[]; total: number; totalPages: number };
  userRole: string;
  userId: string;
}

export function ComplimentList({ initialData, userRole, userId }: Props) {
  const [data, setData] = useState(initialData.data);
  const [total, setTotal] = useState(initialData.total);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async (newPage = 1, newSearch = search, newStatus = statusFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(newPage), limit: "20" });
      if (newSearch) params.set("search", newSearch);
      if (newStatus) params.set("status", newStatus);

      const res = await fetch(`/api/compliments?${params}`);
      const json = await res.json();
      setData(json.data);
      setTotal(json.total);
      setPage(newPage);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(1, search, statusFilter);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por segurado, colaborador..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); fetchData(1, search, v); }}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="PENDENTE_APROVACAO">Pend. Aprovação</SelectItem>
                <SelectItem value="PENDENTE_AVALIACAO">Pend. Avaliação</SelectItem>
                <SelectItem value="DEVOLVIDO_PARA_AJUSTE">Devolvidos</SelectItem>
                <SelectItem value="AVALIADO">Avaliados</SelectItem>
                <SelectItem value="REJEITADO">Rejeitados</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Total */}
      <p className="text-sm text-muted-foreground">{total} elogio{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}</p>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center text-muted-foreground">
            <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Nenhum elogio encontrado</p>
            <p className="text-sm mt-1">
              <Link href="/compliments/new" className="text-primary hover:underline">
                Registre o primeiro elogio
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map((c) => {
            const config = STATUS_CONFIG[c.status];
            const medal = (c.evaluations ?? [])[0]?.medal as MedalType | undefined;
            const medalEmoji = medal ? { SPECIAL: "🏆", GOLD: "🥇", SILVER: "🥈", BRONZE: "🥉" }[medal] : null;
            return (
              <Card key={c.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.className}`}>
                          {config.label}
                        </span>
                        {medal && (
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${MEDAL_COLORS[medal]}`}>
                            {medalEmoji} {MEDAL_LABELS[medal]}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">T{c.quarter}/{c.year} • {c.branch}</span>
                      </div>
                      <p className="font-semibold truncate">{c.insured}</p>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{c.reason}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{c.collaborator?.name ?? "—"}</span>
                        <span>•</span>
                        <span>{format(new Date(c.received_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                        {c.attachment_url && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Paperclip className="w-3 h-3" /> Anexo</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/compliments/${c.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => fetchData(page - 1)} disabled={page === 1}>Anterior</Button>
          <span className="flex items-center text-sm text-muted-foreground px-3">
            Pág. {page} de {Math.ceil(total / 20)}
          </span>
          <Button variant="outline" size="sm" onClick={() => fetchData(page + 1)} disabled={page >= Math.ceil(total / 20)}>Próxima</Button>
        </div>
      )}
    </div>
  );
}
