"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Clock } from "lucide-react";

const DEADLINE_TYPE_LABELS: Record<string, { label: string; description: string }> = {
  REGISTRATION: { label: "Registro de Elogios", description: "Prazo máximo para registrar um elogio após recebimento" },
  APPROVAL: { label: "Aprovação pelo Gestor", description: "Prazo para o gestor aprovar ou rejeitar um elogio" },
  EVALUATION: { label: "Avaliação pelo Diretor", description: "Prazo para o diretor avaliar e atribuir medalha" },
};

interface Deadline {
  id: string;
  type: string;
  days: number;
}

export function DeadlineSettings({ deadlines }: { deadlines: Deadline[] }) {
  const [items, setItems] = useState(
    deadlines.map((d) => ({ ...d, editingDays: String(d.days) }))
  );
  const [saving, setSaving] = useState<string | null>(null);

  async function saveDeadline(deadline: typeof items[0]) {
    const days = parseInt(deadline.editingDays);
    if (isNaN(days) || days < 1 || days > 365) {
      toast.error("Informe um número válido de dias (1–365)");
      return;
    }

    setSaving(deadline.id);
    try {
      const res = await fetch("/api/settings/deadlines", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: deadline.type, days }),
      });
      if (!res.ok) { toast.error("Erro ao salvar prazo"); return; }
      setItems((prev) =>
        prev.map((d) => d.id === deadline.id ? { ...d, days } : d)
      );
      toast.success("Prazo atualizado!");
    } finally {
      setSaving(null);
    }
  }

  if (items.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Clock className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p>Nenhum prazo configurado</p>
          <p className="text-xs mt-1">Execute o seed do banco para criar os prazos padrão</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((d) => {
        const config = DEADLINE_TYPE_LABELS[d.type];
        return (
          <Card key={d.id} className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                {config?.label ?? d.type}
              </CardTitle>
              {config?.description && (
                <p className="text-xs text-muted-foreground">{config.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 items-end">
                <div className="space-y-2">
                  <Label htmlFor={`days-${d.id}`}>Limite em dias</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`days-${d.id}`}
                      type="number"
                      min="1"
                      max="365"
                      value={d.editingDays}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((item) =>
                            item.id === d.id ? { ...item, editingDays: e.target.value } : item
                          )
                        )
                      }
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">dias corridos</span>
                  </div>
                </div>
                <Button
                  onClick={() => saveDeadline(d)}
                  disabled={!!saving || d.editingDays === String(d.days)}
                  size="sm"
                  className="mb-0.5"
                >
                  {saving === d.id
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                    : "Salvar"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Atualmente configurado: <strong>{d.days} dias</strong>
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
