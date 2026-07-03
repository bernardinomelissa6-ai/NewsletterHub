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
import { Loader2, Paperclip, Upload, X } from "lucide-react";

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
  defaultCollaboratorName?: string;
  currentUserName?: string;
}

export function TrainingForm({ collaborators, defaultCollaboratorName, currentUserName }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  }

  const initialCollaboratorName = defaultCollaboratorName ?? collaborators[0]?.name ?? currentUserName ?? "";

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateTrainingInput>({
    resolver: zodResolver(createTrainingSchema),
    defaultValues: { collaboratorId: initialCollaboratorName },
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
            {collaborators.length > 1 ? (
              <Select
                onValueChange={(v) => setValue("collaboratorId", v)}
                defaultValue={initialCollaboratorName}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {collaborators.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name} {c.area ? `(${c.area.name})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Nome do colaborador"
                {...register("collaboratorId")}
              />
            )}
            {errors.collaboratorId && <p className="text-xs text-destructive">{errors.collaboratorId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Certificado / Arquivo (opcional)</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging ? "border-primary bg-primary/5" : "border-border"
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
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
                <label className="cursor-pointer block">
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="text-sm text-muted-foreground">
                    Arraste o arquivo aqui ou{" "}
                    <span className="text-primary underline">clique para selecionar</span>
                  </p>
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
