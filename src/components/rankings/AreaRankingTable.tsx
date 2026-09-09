"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuarterMultiSelect } from "./QuarterMultiSelect";
import { Building2 } from "lucide-react";
import type { AreaScore } from "@/services/ranking.service";

const YEARS = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);
const POSITION_BADGES = ["🥇", "🥈", "🥉"];

interface Props {
  initialData: AreaScore[];
  currentYear: number;
  currentQuarter: number;
}

export function AreaRankingTable({ initialData, currentYear, currentQuarter }: Props) {
  const [data, setData] = useState(initialData);
  const [year, setYear] = useState(String(currentYear));
  const [quarters, setQuarters] = useState<number[]>([currentQuarter]);
  const [loading, setLoading] = useState(false);

  async function fetchRanking(newYear = year, newQuarters = quarters) {
    setLoading(true);
    const params = new URLSearchParams({ year: newYear });
    for (const q of newQuarters) params.append("quarter", String(q));
    const res = await fetch(`/api/rankings/areas?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  return (
    <div className="space-y-5">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-3 items-center">
            <Select value={year} onValueChange={(v) => { setYear(v); fetchRanking(v, quarters); }}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <QuarterMultiSelect selected={quarters} onChange={(v) => { setQuarters(v); fetchRanking(year, v); }} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Carregando...</div>
          ) : data.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p>Nenhum resultado para este período</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left text-muted-foreground text-xs uppercase">
                  <th className="px-4 py-3 w-12">#</th>
                  <th className="px-4 py-3">Área</th>
                  <th className="px-4 py-3 text-center hidden md:table-cell">Colaboradores</th>
                  <th className="px-4 py-3 text-center hidden md:table-cell">Elogios</th>
                  <th className="px-4 py-3 text-right">Medalhas</th>
                </tr>
              </thead>
              <tbody>
                {data.map((a, i) => (
                  <tr key={a.areaId} className="border-b last:border-0 hover:bg-accent/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-muted-foreground">
                      {i < 3 ? POSITION_BADGES[i] : `${i + 1}°`}
                    </td>
                    <td className="px-4 py-3 font-medium">{a.areaName}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground hidden md:table-cell">{a.collaboratorCount}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground hidden md:table-cell">{a.totalCompliments}</td>
                    <td className="px-4 py-3 text-right text-xs">
                      <div className="flex justify-end items-center gap-1.5">
                        {a.specialCount > 0 && <span>🏆{a.specialCount}</span>}
                        {a.goldCount > 0 && <span>🥇{a.goldCount}</span>}
                        {a.silverCount > 0 && <span>🥈{a.silverCount}</span>}
                        {a.bronzeCount > 0 && <span>🥉{a.bronzeCount}</span>}
                        {a.totalMedals === 0 && <span className="text-muted-foreground">—</span>}
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
