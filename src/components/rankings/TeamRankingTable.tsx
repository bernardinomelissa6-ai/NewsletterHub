"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuarterMultiSelect } from "./QuarterMultiSelect";
import { computeRanks, type CollaboratorScore } from "@/lib/utils/ranking";

const YEARS = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i);

interface Props {
  collaborators: CollaboratorScore[];
  initialYear: number;
  initialQuarter: number;
}

export function TeamRankingTable({ collaborators: initialData, initialYear, initialQuarter }: Props) {
  const [data, setData] = useState(initialData);
  const [year, setYear] = useState(String(initialYear));
  const [quarters, setQuarters] = useState<number[]>([initialQuarter]);
  const [loading, setLoading] = useState(false);

  async function fetchRanking(newYear = year, newQuarters = quarters) {
    setLoading(true);
    const params = new URLSearchParams({ year: newYear });
    for (const q of newQuarters) params.append("quarter", String(q));
    const res = await fetch(`/api/rankings/collaborators?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  const hasAnyMedals = data.some((c) => c.specialCount > 0 || c.goldCount > 0 || c.silverCount > 0 || c.bronzeCount > 0);
  const ranks = computeRanks(data);
  const top3 = data.slice(0, 3);
  const top3Ranks = ranks.slice(0, 3);

  // Styling keyed by actual rank (1º/2º/3º) — not array position — so ties
  // (e.g. two people tied for 1º) render identically instead of one being
  // mislabeled as 2º just because of where it sits in the sorted list.
  const RANK_STYLE: Record<number, { height: string; bg: string; border: string; emoji: string }> = {
    1: { height: "h-28", bg: "bg-yellow-50 dark:bg-yellow-950", border: "border-yellow-400", emoji: "🥇" },
    2: { height: "h-20", bg: "bg-gray-100 dark:bg-gray-800", border: "border-gray-300", emoji: "🥈" },
    3: { height: "h-16", bg: "bg-orange-50 dark:bg-orange-950", border: "border-orange-400", emoji: "🥉" },
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-3 flex-wrap items-center">
            <Select value={year} onValueChange={(v) => { setYear(v); fetchRanking(v, quarters); }}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <QuarterMultiSelect selected={quarters} onChange={(v) => { setQuarters(v); fetchRanking(year, v); }} />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Carregando...</div>
      ) : !hasAnyMedals ? null : (
        <>
          {/* Podium */}
          {top3.length >= 1 && (
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Top Colaboradores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-center gap-4">
                  {top3.map((c, i) => {
                    const rank = top3Ranks[i];
                    const style = RANK_STYLE[Math.min(rank, 3)];
                    return (
                      <div key={c.userId} className="flex flex-col items-center gap-2 flex-1 max-w-[150px]">
                        <div className="text-2xl">{style.emoji}</div>
                        <div className="text-center">
                          <p className="font-semibold text-sm leading-tight">{c.name}</p>
                        </div>
                        <div className={`w-full rounded-t-lg border-2 ${style.bg} ${style.border} ${style.height} flex items-center justify-center`}>
                          <span className="text-lg font-bold text-muted-foreground">{rank}º</span>
                        </div>
                      </div>
                    );
                  })}
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
                      <th className="text-right p-4 hidden sm:table-cell">🏆</th>
                      <th className="text-right p-4 hidden sm:table-cell">🥇</th>
                      <th className="text-right p-4 hidden sm:table-cell">🥈</th>
                      <th className="text-right p-4 hidden sm:table-cell">🥉</th>
                      <th className="text-right p-4 hidden md:table-cell">Elogios</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.map((c, index) => (
                      <tr key={c.userId} className="hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          {ranks[index] <= 3 ? (
                            <span>{["🥇", "🥈", "🥉"][ranks[index] - 1]}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">{ranks[index]}º</span>
                          )}
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-sm">{c.name}</p>
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
        </>
      )}
    </div>
  );
}
