import { calculateDeadline, DEADLINE_STATUS_CONFIG } from "../deadline";
import { subDays } from "date-fns";

describe("calculateDeadline", () => {
  it("retorna OK quando há prazo sobrando", () => {
    const createdAt = subDays(new Date(), 2);
    const result = calculateDeadline(createdAt, 30);
    expect(result.status).toBe("OK");
    expect(result.daysLeft).toBeGreaterThan(0);
  });

  it("retorna WARNING quando está próximo do vencimento (20% do prazo)", () => {
    // Prazo de 10 dias, criado há 9 dias → 1 dia restante (10% < 20%)
    const createdAt = subDays(new Date(), 9);
    const result = calculateDeadline(createdAt, 10);
    expect(result.status).toBe("WARNING");
    expect(result.daysLeft).toBeGreaterThanOrEqual(0);
  });

  it("retorna OVERDUE quando passou do prazo", () => {
    const createdAt = subDays(new Date(), 15);
    const result = calculateDeadline(createdAt, 10);
    expect(result.status).toBe("OVERDUE");
    expect(result.daysLeft).toBeLessThan(0);
  });

  it("retorna data de deadline correta", () => {
    const createdAt = new Date("2024-01-01");
    const result = calculateDeadline(createdAt, 7);
    expect(result.deadlineDate.toDateString()).toBe(new Date("2024-01-08").toDateString());
  });
});

describe("DEADLINE_STATUS_CONFIG", () => {
  it("possui configurações para todos os status", () => {
    expect(DEADLINE_STATUS_CONFIG.OK.emoji).toBe("🟢");
    expect(DEADLINE_STATUS_CONFIG.WARNING.emoji).toBe("🟡");
    expect(DEADLINE_STATUS_CONFIG.OVERDUE.emoji).toBe("🔴");
  });
});
