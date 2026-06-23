import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { ProfileForm } from "@/components/settings/ProfileForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, area: { select: { name: true } } },
  });

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">Atualize suas informações pessoais</p>
      </div>
      <ProfileForm user={user as any} />
    </div>
  );
}
