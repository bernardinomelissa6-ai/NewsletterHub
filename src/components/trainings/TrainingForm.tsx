"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { createTrainingSchema, type CreateTrainingInput } from "@/lib/validations/training.schema";
import { Loader2, Paperclip, X } from "lucide-react";

const BRANCHES = ["Automóvel", "Vida", "Saúde", "Residencial", "Patrimonial", "Engenharia", "Transportes", "Responsabilidade Civil", "Outros"];
const TYPES = [
  { value: "TRAINING", label: "Treinamento" },
  { value: "COURSE", label: "Curso" },
  { value: "CONSULTANCY", label: "Consultoria" },
];

interface Collaborator {
  id: string;
  name: string;
  area?: { name: string } | null;
}

interface Props {
  collaborators: Collaborator[];
  defaultCollaboratorId?: string;
}

export function TrainingForm({ collaborators, defaultCollaboratorId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateTrainingInput>({
    resolver: zodResolver(createTrainingSchema),
    defaultValues: { collaboratorId: defaultCollaboratorId ?? "" },
  });

  async function onSubmit(data: CreateTrainingInput) {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => formData.append(k, v));
      if (file) formData.append("attachment", file);

      const res = await fetch("/api/trainings", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Erro ao salvar"); return; }

      toast.success("Treinamento registrado com sucesso!");
      router.push("/trainings");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="insured">Nome / Empresa *</Label>
            <Input id="insured" placeholder="Nome do segurado, empresa ou participante" {...register("insured")} />
            {errors.insured && <p className="text-xs text-destructive">{errors.insured.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input id="date" type="date" max={new Date().toISOString().split("T")[0]} {...register("date")} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select onValueChange={(v) => setValue("type", v as CreateTrainingInput["type"])}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ramo *</Label>
            <Select onValueChange={(v) => setValue("branch", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ramo" />
              </SelectTrigger>
              <SelectContent>
                {BRANCHES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.branch && <p className="text-xs text-destructive">{errors.branch.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Colaborador *</Label>
            {collaborators.length <= 1 ? (
              <Input
                defaultValue={collaborators[0]?.name ?? ""}
                placeholder="Nome do colaborador"
              />
            ) : (
              <Select onValueChange={(v) => setValue("collaboratorId", v)} defaultValue={defaultCollaboratorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {collaborators.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.area ? `(${c.area.name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.collaboratorId && <p className="text-xs text-destructive">{errors.collaboratorId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Certificado / Arquivo (opcional)</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
              {file ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Paperclip className="w-4 h-4" />
                    <span>{file.name}</span>
                    <span className="text-muted-foreground">({(file.size / 1024 / 1024).toFixed(1)} MB)</span>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setFile(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Paperclip className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Clique para anexar um arquivo</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, PPT, PPTX • Máx. 10MB</p>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.ppt,.pptx"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Registrar Treinamento"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
