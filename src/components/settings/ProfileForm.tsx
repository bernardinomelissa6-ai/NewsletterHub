"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  COLLABORATOR: "Colaborador",
  MANAGER: "Gestor",
  DIRECTOR: "Diretor",
  ADMIN: "Administrador",
};

const profileSchema = z.object({ name: z.string().min(2, "Nome obrigatório").max(200) });
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual obrigatória"),
  newPassword: z.string().min(8, "Nova senha deve ter ao menos 8 caracteres"),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: "As senhas não conferem", path: ["confirmPassword"] });

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  area?: { name: string } | null;
}

export function ProfileForm({ user }: { user: User }) {
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const { register: regProfile, handleSubmit: handleProfile, formState: { errors: errProfile } } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name },
  });

  const { register: regPass, handleSubmit: handlePassword, reset: resetPass, formState: { errors: errPass } } = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  });

  async function onProfile(data: ProfileData) {
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name }),
      });
      if (!res.ok) { toast.error("Erro ao atualizar"); return; }
      toast.success("Perfil atualizado!");
    } finally {
      setSavingProfile(false);
    }
  }

  async function onPassword(data: PasswordData) {
    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error ?? "Erro ao alterar senha"); return; }
      toast.success("Senha alterada com sucesso!");
      resetPass();
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Profile info card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4" /> Informações Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-muted rounded-lg text-sm space-y-1">
            <p><span className="text-muted-foreground">Email:</span> {user.email}</p>
            <p><span className="text-muted-foreground">Perfil:</span> {ROLE_LABELS[user.role]}</p>
            {user.area && <p><span className="text-muted-foreground">Área:</span> {user.area.name}</p>}
          </div>
          <form onSubmit={handleProfile(onProfile)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" {...regProfile("name")} />
              {errProfile.name && <p className="text-xs text-destructive">{errProfile.name.message}</p>}
            </div>
            <Button type="submit" disabled={savingProfile}>
              {savingProfile ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Salvar Alterações"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password change */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Alterar Senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePassword(onPassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha atual</Label>
              <Input id="currentPassword" type="password" {...regPass("currentPassword")} />
              {errPass.currentPassword && <p className="text-xs text-destructive">{errPass.currentPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input id="newPassword" type="password" {...regPass("newPassword")} />
              {errPass.newPassword && <p className="text-xs text-destructive">{errPass.newPassword.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input id="confirmPassword" type="password" {...regPass("confirmPassword")} />
              {errPass.confirmPassword && <p className="text-xs text-destructive">{errPass.confirmPassword.message}</p>}
            </div>
            <Button type="submit" disabled={savingPassword}>
              {savingPassword ? <><Loader2 className="w-4 h-4 animate-spin" /> Alterando...</> : "Alterar Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
