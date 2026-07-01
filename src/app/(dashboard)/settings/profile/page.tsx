import { requireAuth } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ProfileForm } from "@/components/settings/ProfileForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const session = await requireAuth();

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, name, email, role, area_id")
    .eq("id", session.user.id)
    .single();

  if (!user) {
    return (
      <div className="max-w-xl space-y-6">
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <p className="text-destructive text-sm">Erro ao carregar dados do perfil.</p>
      </div>
    );
  }

  const { data: areaData } = user.area_id
    ? await supabaseAdmin.from("areas").select("name").eq("id", user.area_id).single()
    : { data: null };

  const fullUser = { ...user, area: areaData };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">Atualize suas informações pessoais</p>
      </div>
      <ProfileForm user={fullUser} />
    </div>
  );
}
