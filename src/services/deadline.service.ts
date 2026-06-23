import { prisma } from "@/lib/db/prisma";
import type { DeadlineType } from "@prisma/client";

export async function getDeadlines() {
  return prisma.deadline.findMany({ orderBy: { type: "asc" } });
}

export async function getDeadline(type: DeadlineType) {
  return prisma.deadline.findUnique({ where: { type } });
}

export async function upsertDeadline(type: DeadlineType, days: number) {
  return prisma.deadline.upsert({
    where: { type },
    update: { days },
    create: { type, days },
  });
}

export async function getDeadlineMap(): Promise<Record<DeadlineType, number>> {
  const deadlines = await getDeadlines();
  const defaults: Record<DeadlineType, number> = {
    REGISTRATION: 30,
    APPROVAL: 7,
    EVALUATION: 5,
  };
  for (const d of deadlines) {
    defaults[d.type] = d.days;
  }
  return defaults;
}
