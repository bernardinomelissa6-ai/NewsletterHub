"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Check, X, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";

interface Branch {
  id: string;
  name: string;
  is_active: boolean;
}

export function BranchSettings({ initialBranches }: { initialBranches: Branch[] }) {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAdd() {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Erro ao criar"); return; }
      setBranches((prev) => [...prev, json].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
      toast.success("Ramo criado!");
    } finally {
      setAdding(false);
    }
  }

  async function handleEdit(id: string) {
    if (!editName.trim()) return;
    setLoading(id);
    try {
      const res = await fetch("/api/branches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editName.trim() }),
      });
      if (!res.ok) { toast.error("Erro ao atualizar"); return; }
      setBranches((prev) => prev.map((b) => b.id === id ? { ...b, name: editName.trim() } : b).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingId(null);
      toast.success("Ramo atualizado!");
    } finally {
      setLoading(null);
    }
  }

  async function handleToggle(id: string, is_active: boolean) {
    setLoading(id);
    try {
      const res = await fetch("/api/branches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active }),
      });
      if (!res.ok) { toast.error("Erro ao atualizar"); return; }
      setBranches((prev) => prev.map((b) => b.id === id ? { ...b, is_active } : b));
      toast.success(is_active ? "Ramo ativado" : "Ramo desativado");
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir o ramo "${name}"? Esta ação não pode ser desfeita.`)) return;
    setLoading(id);
    try {
      const res = await fetch("/api/branches", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) { toast.error("Erro ao excluir"); return; }
      setBranches((prev) => prev.filter((b) => b.id !== id));
      toast.success("Ramo excluído!");
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Ramos Cadastrados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Adicionar novo */}
        <div className="flex gap-2">
          <Input
            placeholder="Nome do novo ramo..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={adding || !newName.trim()} size="sm">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Adicionar
          </Button>
        </div>

        {/* Lista */}
        <div className="space-y-2">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className={`flex items-center gap-2 p-3 rounded-lg border ${!branch.is_active ? "opacity-50 bg-muted" : "bg-background"}`}
            >
              {editingId === branch.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleEdit(branch.id)}
                    className="h-8 flex-1"
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => handleEdit(branch.id)} disabled={loading === branch.id}>
                    {loading === branch.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                    <X className="w-3 h-3" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium">{branch.name}</span>
                  {!branch.is_active && <span className="text-xs text-muted-foreground">(inativo)</span>}
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingId(branch.id); setEditName(branch.name); }} disabled={loading === branch.id}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleToggle(branch.id, !branch.is_active)} disabled={loading === branch.id}>
                    {loading === branch.id ? <Loader2 className="w-3 h-3 animate-spin" /> : branch.is_active ? <ToggleRight className="w-4 h-4 text-green-600" /> : <ToggleLeft className="w-4 h-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(branch.id, branch.name)} disabled={loading === branch.id}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>
          ))}
          {branches.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhum ramo cadastrado ainda</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
