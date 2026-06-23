import { differenceInDays, addDays } from "date-fns";

export type DeadlineStatus = "OK" | "WARNING" | "OVERDUE";

export interface DeadlineInfo {
  status: DeadlineStatus;
  daysLeft: number;
  deadlineDate: Date;
}

export function calculateDeadline(createdAt: Date, days: number): DeadlineInfo {
  const deadlineDate = addDays(createdAt, days);
  const now = new Date();
  const daysLeft = differenceInDays(deadlineDate, now);
  const totalDays = days;
  const warningThreshold = Math.ceil(totalDays * 0.2);

  let status: DeadlineStatus;
  if (daysLeft < 0) {
    status = "OVERDUE";
  } else if (daysLeft <= warningThreshold) {
    status = "WARNING";
  } else {
    status = "OK";
  }

  return { status, daysLeft, deadlineDate };
}

export const DEADLINE_STATUS_CONFIG = {
  OK: {
    label: "Dentro do prazo",
    color: "text-green-700",
    bg: "bg-green-100",
    border: "border-green-300",
    dot: "bg-green-500",
    emoji: "🟢",
  },
  WARNING: {
    label: "Próximo do vencimento",
    color: "text-yellow-700",
    bg: "bg-yellow-100",
    border: "border-yellow-300",
    dot: "bg-yellow-500",
    emoji: "🟡",
  },
  OVERDUE: {
    label: "Atrasado",
    color: "text-red-700",
    bg: "bg-red-100",
    border: "border-red-300",
    dot: "bg-red-500",
    emoji: "🔴",
  },
} as const;
