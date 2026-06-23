"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CollaboratorScore } from "@/lib/utils/ranking";

const MEDAL_EMOJI: Record<string, string> = { SPECIAL: "🏆", GOLD: "🥇", SILVER: "🥈", BRONZE: "🥉" };

interface Props {
  collaborators: CollaboratorScore[];
}

export function TeamRankingTable({ collaborators }: Props) {
  const [year, setYear] = useState<string>("");
  const [quarter, setQuarter] = useState<string>("");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, i) => currentYear - i);

  if (collaborators.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16 text-center text-muted-foreground">
          <p className="font-medium">Sem dados disponíveis</p>
          <p className="text-sm mt-1">Ainda não há colaboradores avaliados na sua área.</p>
        </CardContent>
      </Card>
    );
  }

  const top3 = collaborators.slice(0, 3);
  const rest = collaborators.slice(3);

  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumHeights = ["h-20", "h-28", "h-16"];
  const podiumRanks = ["2º", "1º", "3º"];
  const podiumBg = ["bg-gray-100 dark:bg-gray-800", "bg-yellow-50 dark:bg-yellow-950", "bg-orange-50 dark:bg-orange-950"];
  const podiumBorder = ["border-gray-300", "border-yellow-400", "border-orange-400"];
  const podiumEmoji = ["🥈", "🥇", "🥉"];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="text-sm border rounded-md px-3 py-2 bg-background"
        >
          <option value="">Todos os anos</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={quarter}
          onChange={(e) => setQuarter(e.target.value)}
          className="text-sm border rounded-md px-3 py-2 bg-background"
        >
          <option value="">Todos os trimestres</option>
          <option value="1">T1 (Jan–Mar)</option>
          <option value="2">T2 (Abr–Jun)</option>
          <option value="3">T3 (Jul–Set)</option>
          <option value="4">T4 (Out–Dez)</option>
        </select>
      </div>

      {/* Podium */}
      {top3.length >= 1 && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Top Colaboradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-center gap-4">
              {podiumOrder.map((c, i) => (
                <div key={c.userId} className="flex flex-col items-center gap-2 flex-1 max-w-[150px]">
                  <div className="text-2xl">{podiumEmoji[i]}</div>
                  <div className="text-center">
                    <p className="font-semibold text-sm leading-tight">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.score} pts</p>
                  </div>
                  <div className={`w-full rounded-t-lg border-2 ${podiumBg[i]} ${podiumBorder[i]} ${podiumHeights[i]} flex items-center justify-center`}>
                    <span className="text-lg font-bold text-muted-foreground">{podiumRanks[i]}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left p-4 w-12">#</th>
                  <th className="text-left p-4">Colaborador</th>
                  <th className="text-right p-4">Pontos</th>
                  <th className="text-right p-4 hidden sm:table-cell">🏆</th>
                  <th className="text-right p-4 hidden sm:table-cell">🥇</th>
                  <th className="text-right p-4 hidden sm:table-cell">🥈</th>
                  <th className="text-right p-4 hidden sm:table-cell">🥉</th>
                  <th className="text-right p-4 hidden md:table-cell">Elogios</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {collaborators.map((c, index) => (
                  <tr key={c.userId} className="hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      {index < 3 ? (
                        <span>{["🥇", "🥈", "🥉"][index]}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">{index + 1}º</span>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-sm">{c.name}</p>
                    </td>
                    <td className="p-4 text-right">
                      <Badge variant="secondary" className="font-mono">{c.score} pts</Badge>
                    </td>
                    <td className="p-4 text-right hidden sm:table-cell text-sm">{c.specialCount || "–"}</td>
                    <td className="p-4 text-right hidden sm:table-cell text-sm">{c.goldCount || "–"}</td>
                    <td className="p-4 text-right hidden sm:table-cell text-sm">{c.silverCount || "–"}</td>
                    <td className="p-4 text-right hidden sm:table-cell text-sm">{c.bronzeCount || "–"}</td>
                    <td className="p-4 text-right hidden md:table-cell text-sm text-muted-foreground">{c.totalCompliments}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
