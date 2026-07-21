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
  EVALUATION: { label: "Avaliação pelo Diretor", description: "Prazo para o diretor avaliar e atribuir medalha, contado a partir da aprovação do gestor" },
};

interface Deadline {
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

    setSaving(deadline.type);
    try {
      const res = await fetch("/api/settings/deadlines", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: deadline.type, days }),
      });
      if (!res.ok) { toast.error("Erro ao salvar prazo"); return; }
      setItems((prev) =>
        prev.map((d) => d.type === deadline.type ? { ...d, days } : d)
      );
      toast.success("Prazo atualizado!");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      {items.map((d) => {
        const config = DEADLINE_TYPE_LABELS[d.type];
        return (
          <Card key={d.type} className="border-0 shadow-sm">
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
                  <Label htmlFor={`days-${d.type}`}>Limite em dias</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`days-${d.type}`}
                      type="number"
                      min="1"
                      max="365"
                      value={d.editingDays}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((item) =>
                            item.type === d.type ? { ...item, editingDays: e.target.value } : item
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
                  {saving === d.type
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
