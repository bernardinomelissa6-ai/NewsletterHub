export function getQuarter(date: Date): number {
  return Math.ceil((date.getUTCMonth() + 1) / 3);
}

// Parses YYYY-MM-DD string directly (no timezone conversion)
export function getQuarterFromDateString(dateStr: string): number {
  const month = parseInt(dateStr.substring(5, 7), 10);
  return Math.ceil(month / 3);
}

export function getYearFromDateString(dateStr: string): number {
  return parseInt(dateStr.substring(0, 4), 10);
}

export function getQuarterRange(year: number, quarter: number): { start: Date; end: Date } {
  const startMonth = (quarter - 1) * 3;
  const endMonth = startMonth + 2;
  return {
    start: new Date(year, startMonth, 1),
    end: new Date(year, endMonth + 1, 0, 23, 59, 59, 999),
  };
}

export function getCurrentQuarter() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    quarter: getQuarter(now),
  };
}

export function getQuarterLabel(quarter: number): string {
  const labels: Record<number, string> = {
    1: "1º Trimestre (Jan–Mar)",
    2: "2º Trimestre (Abr–Jun)",
    3: "3º Trimestre (Jul–Set)",
    4: "4º Trimestre (Out–Dez)",
  };
  return labels[quarter] ?? `${quarter}º Trimestre`;
}

export function getQuarterShortLabel(quarter: number): string {
  return `T${quarter}`;
}

export function getAllQuarters(startYear: number = 2024): { year: number; quarter: number; label: string }[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQuarter = getQuarter(now);
  const result = [];

  for (let y = startYear; y <= currentYear; y++) {
    const maxQ = y === currentYear ? currentQuarter : 4;
    for (let q = 1; q <= maxQ; q++) {
      result.push({ year: y, quarter: q, label: `${getQuarterShortLabel(q)} ${y}` });
    }
  }

  return result.reverse();
}
