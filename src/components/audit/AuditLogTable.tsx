"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Search } from "lucide-react";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "text-green-700 bg-green-50",
  UPDATE: "text-blue-700 bg-blue-50",
  DELETE: "text-red-700 bg-red-50",
  APPROVE: "text-purple-700 bg-purple-50",
  REJECT: "text-red-700 bg-red-50",
  RETURN: "text-orange-700 bg-orange-50",
  EVALUATE: "text-yellow-700 bg-yellow-50",
};

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  ipAddress?: string | null;
}

interface Props {
  initialData: { data: AuditLog[]; total: number; totalPages: number };
}

export function AuditLogTable({ initialData }: Props) {
  const [data, setData] = useState(initialData.data);
  const [total, setTotal] = useState(initialData.total);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchData(newPage = 1, newSearch = search, newAction = actionFilter) {
    setLoading(true);
    const params = new URLSearchParams({ page: String(newPage), limit: "30" });
    if (newSearch) params.set("search", newSearch);
    if (newAction) params.set("action", newAction);
    const res = await fetch(`/api/audit?${params}`);
    const json = await res.json();
    setData(json.data);
    setTotal(json.total);
    setPage(newPage);
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuário, entidade..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchData(1, search, actionFilter)}
              />
            </div>
            <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); fetchData(1, search, v); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Todas as ações" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as ações</SelectItem>
                {Object.keys(ACTION_COLORS).map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">{total} registro{total !== 1 ? "s" : ""}</p>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Carregando...</div>
          ) : data.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Shield className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p>Nenhum registro encontrado</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left text-muted-foreground text-xs uppercase">
                  <th className="px-4 py-3">Data/Hora</th>
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Ação</th>
                  <th className="px-4 py-3 hidden md:table-cell">Entidade</th>
                  <th className="px-4 py-3 hidden lg:table-cell">IP</th>
                </tr>
              </thead>
              <tbody>
                {data.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-accent/50 text-xs">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{log.userName}</p>
                      <p className="text-muted-foreground">{log.userRole}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold px-2 py-0.5 rounded text-xs ${ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-700"}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      <p>{log.entityType}</p>
                      <p className="font-mono text-xs truncate max-w-32">{log.entityId}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell font-mono">{log.ipAddress ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {total > 30 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchData(page - 1)} disabled={page === 1}>Anterior</Button>
          <span className="flex items-center text-sm text-muted-foreground px-3">Pág. {page} de {Math.ceil(total / 30)}</span>
          <Button variant="outline" size="sm" onClick={() => fetchData(page + 1)} disabled={page >= Math.ceil(total / 30)}>Próxima</Button>
        </div>
      )}
    </div>
  );
}
