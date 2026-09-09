"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuarterMultiSelect } from "./QuarterMultiSelect";
import { Trophy } from "lucide-react";
import type { CollaboratorScore } from "@/lib/utils/ranking";

const YEARS = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);
const PODIUM_COLORS = ["text-yellow-500", "text-gray-400", "text-orange-500"];
const POSITION_BADGES = ["🥇", "🥈", "🥉"];

interface Props {
  initialData: CollaboratorScore[];
  areas: { id: string; name: string }[];
  currentYear: number;
  currentQuarter: number;
  userRole: string;
}

export function CollaboratorRankingTable({ initialData, areas, currentYear, currentQuarter, userRole }: Props) {
  const [data, setData] = useState(initialData);
  const [year, setYear] = useState(String(currentYear));
  const [quarters, setQuarters] = useState<number[]>([currentQuarter]);
  const [areaId, setAreaId] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchRanking(newYear = year, newQuarters = quarters, newAreaId = areaId) {
    setLoading(true);
    const params = new URLSearchParams({ year: newYear });
    for (const q of newQuarters) params.append("quarter", String(q));
    if (newAreaId) params.set("areaId", newAreaId);
    const res = await fetch(`/api/rankings/collaborators?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  const top3 = data.slice(0, 3);
  const rest = data.slice(3);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-3 flex-wrap items-center">
            <Select value={year} onValueChange={(v) => { setYear(v); fetchRanking(v, quarters, areaId); }}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <QuarterMultiSelect selected={quarters} onChange={(v) => { setQuarters(v); fetchRanking(year, v, areaId); }} />
            {(userRole === "ADMIN" || userRole === "DIRECTOR") && areas.length > 0 && (
              <Select value={areaId} onValueChange={(v) => { setAreaId(v); fetchRanking(year, quarters, v); }}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Todas as áreas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as áreas</SelectItem>
                  {areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Podium */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {top3.map((c, i) => (
            <Card key={c.userId} className={`border-0 shadow-sm text-center ${i === 0 ? "ring-2 ring-yellow-400" : ""}`}>
              <CardContent className="p-5">
                <div className="text-3xl mb-2">{POSITION_BADGES[i]}</div>
                <p className="font-bold text-sm leading-tight">{c.name}</p>
                {c.areaName && <p className="text-xs text-muted-foreground mt-0.5">{c.areaName}</p>}
                <div className={`flex justify-center gap-2 mt-3 text-sm font-semibold ${PODIUM_COLORS[i]}`}>
                  {c.specialCount > 0 && <span>🏆 {c.specialCount}</span>}
                  {c.goldCount > 0 && <span>🥇 {c.goldCount}</span>}
                  {c.silverCount > 0 && <span>🥈 {c.silverCount}</span>}
                  {c.bronzeCount > 0 && <span>🥉 {c.bronzeCount}</span>}
                  {!c.specialCount && !c.goldCount && !c.silverCount && !c.bronzeCount && <span className="text-muted-foreground font-normal">Sem medalhas</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Full table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Carregando...</div>
          ) : data.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Trophy className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p>Nenhum resultado para este período</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left text-muted-foreground text-xs uppercase">
                  <th className="px-4 py-3 w-12">#</th>
                  <th className="px-4 py-3">Colaborador</th>
                  <th className="px-4 py-3 hidden md:table-cell">Área</th>
                  <th className="px-4 py-3 text-right">Medalhas</th>
                </tr>
              </thead>
              <tbody>
                {data.map((c, i) => (
                  <tr key={c.userId} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-muted-foreground">
                      {i < 3 ? POSITION_BADGES[i] : `${i + 1}°`}
                    </td>
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{c.areaName ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-xs">
                      <div className="flex items-center justify-end gap-1.5">
                        {c.specialCount > 0 && <span>🏆{c.specialCount}</span>}
                        {c.goldCount > 0 && <span>🥇{c.goldCount}</span>}
                        {c.silverCount > 0 && <span>🥈{c.silverCount}</span>}
                        {c.bronzeCount > 0 && <span>🥉{c.bronzeCount}</span>}
                        {!c.specialCount && !c.goldCount && !c.silverCount && !c.bronzeCount && <span className="text-muted-foreground">—</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
