import { supabaseAdmin } from "@/lib/supabase/admin";
import { MEDAL_LABELS, MEDAL_COLORS } from "@/lib/utils/ranking";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Star, Trophy, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { MedalType } from "@/lib/supabase/types";

async function getRecentData() {
  const [{ data: recentCompliments }, { data: recentMedals }] = await Promise.all([
    supabaseAdmin
      .from("compliments")
      .select("id, insured, updated_at, collaborator:users!compliments_collaborator_id_fkey(name), evaluations:compliment_evaluations(medal)")
      .eq("status", "AVALIADO")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("compliment_evaluations")
      .select("id, medal, compliment:compliments!compliment_evaluations_compliment_id_fkey(insured, collaborator:users!compliments_collaborator_id_fkey(name))")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  return { recentCompliments: recentCompliments ?? [], recentMedals: recentMedals ?? [] };
}

export async function RightPanel() {
  const { recentCompliments, recentMedals } = await getRecentData();

  return (
    <aside className="w-72 border-l bg-card flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b gradient-brand text-white">
        <h2 className="font-bold text-sm flex items-center gap-2">
          <Trophy className="w-4 h-4" /> Mural de Reconhecimento
        </h2>
        <p className="text-xs opacity-80 mt-0.5">Últimas conquistas</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-4">
        {/* Medalhas recentes */}
        {recentMedals.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">
              Medalhas Recentes
            </p>
            <div className="space-y-2">
              {recentMedals.map((evaluation: any) => {
                const medal = evaluation.medal as MedalType;
                const colorClass = MEDAL_COLORS[medal];
                const medalEmoji = { SPECIAL: "🏆", GOLD: "🥇", SILVER: "🥈", BRONZE: "🥉" }[medal] ?? "⭐";
                return (
                  <div key={evaluation.id} className={`flex items-center gap-2 p-2 rounded-lg border ${colorClass}`}>
                    <span className="text-lg">{medalEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">
                        {evaluation.compliment?.collaborator?.name ?? ""}
                      </p>
                      <p className="text-[10px] opacity-75 truncate">
                        {MEDAL_LABELS[medal]} • {evaluation.compliment?.insured ?? ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Últimos elogios avaliados */}
        {recentCompliments.length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 px-1">
              Elogios Recentes
            </p>
            <div className="space-y-2">
              {recentCompliments.map((c: any) => {
                const medal = c.evaluations?.[0]?.medal as MedalType | undefined;
                const emoji = medal ? { SPECIAL: "🏆", GOLD: "🥇", SILVER: "🥈", BRONZE: "🥉" }[medal] : "⭐";
                return (
                  <Link
                    key={c.id}
                    href={`/compliments/${c.id}`}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent transition-colors block"
                  >
                    <span className="text-base mt-0.5">{emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{c.collaborator?.name ?? ""}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{c.insured}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {recentCompliments.length === 0 && recentMedals.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Nenhum reconhecimento ainda</p>
          </div>
        )}
      </div>

      <div className="p-3 border-t">
        <Link
          href="/rankings/collaborators"
          className="flex items-center justify-center gap-2 text-xs text-primary font-medium hover:underline"
        >
          <TrendingUp className="w-3 h-3" /> Ver ranking completo
        </Link>
      </div>
    </aside>
  );
}
