"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Edit, Trash2, Search, UserCheck, UserX, Users } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  COLLABORATOR: "Colaborador",
  MANAGER: "Gestor",
  DIRECTOR: "Diretor",
  ADMIN: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  COLLABORATOR: "bg-blue-100 text-blue-800",
  MANAGER: "bg-purple-100 text-purple-800",
  DIRECTOR: "bg-orange-100 text-orange-800",
  ADMIN: "bg-red-100 text-red-800",
};

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  area?: { name: string } | null;
}

interface Props {
  users: User[];
  areas: { id: string; name: string }[];
}

export function UserTable({ users: initialUsers, areas }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  async function toggleActive(user: User) {
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    if (!res.ok) { toast.error("Erro ao atualizar"); return; }
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: !user.isActive } : u));
    toast.success(user.isActive ? "Usuário desativado" : "Usuário ativado");
  }

  async function deleteUser() {
    if (!confirmDelete) return;
    setLoading(true);
    const res = await fetch(`/api/users/${confirmDelete.id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Erro ao excluir"); setLoading(false); return; }
    setUsers((prev) => prev.filter((u) => u.id !== confirmDelete.id));
    setConfirmDelete(null);
    setLoading(false);
    toast.success("Usuário excluído");
  }

  return (
    <>
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou email..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Todos os perfis" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os perfis</SelectItem>
                {Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p>Nenhum usuário encontrado</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left text-muted-foreground text-xs uppercase">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3 hidden md:table-cell">Email</th>
                  <th className="px-4 py-3">Perfil</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Área</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 w-28"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-accent/50">
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ROLE_COLORS[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{u.area?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleActive(u)} className="text-xs">
                        {u.isActive
                          ? <span className="text-green-600 flex items-center gap-1 justify-center"><UserCheck className="w-3 h-3" /> Ativo</span>
                          : <span className="text-muted-foreground flex items-center gap-1 justify-center"><UserX className="w-3 h-3" /> Inativo</span>}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/users/${u.id}`}><Edit className="w-4 h-4" /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(u)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirmar exclusão</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir o usuário <strong>{confirmDelete?.name}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={deleteUser} disabled={loading}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
