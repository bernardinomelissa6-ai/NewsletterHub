import { requireRole } from "@/lib/auth/session";
import { getMedalImages } from "@/services/medal-image.service";
import { MedalImageSettings } from "@/components/settings/MedalImageSettings";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Imagens de Medalhas" };

export default async function MedalsSettingsPage() {
  await requireRole("ADMIN");

  const medalImages = await getMedalImages();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Imagens de Medalhas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Envie uma imagem própria para cada medalha. Se nenhuma imagem for enviada, o sistema usa o ícone padrão.
        </p>
      </div>
      <MedalImageSettings medalImages={medalImages} />
    </div>
  );
}
