import { MEDAL_POINTS, calculateScore, sortCollaborators, type CollaboratorScore } from "../ranking";

describe("MEDAL_POINTS", () => {
  it("deve ter pontuações corretas", () => {
    expect(MEDAL_POINTS.SPECIAL).toBe(10);
    expect(MEDAL_POINTS.GOLD).toBe(7);
    expect(MEDAL_POINTS.SILVER).toBe(5);
    expect(MEDAL_POINTS.BRONZE).toBe(3);
  });
});

describe("calculateScore", () => {
  it("retorna 0 para lista vazia", () => {
    expect(calculateScore([])).toBe(0);
  });

  it("calcula pontuação corretamente", () => {
    expect(calculateScore([{ medal: "SPECIAL" }, { medal: "GOLD" }])).toBe(17);
    expect(calculateScore([{ medal: "BRONZE" }, { medal: "BRONZE" }, { medal: "SILVER" }])).toBe(11);
  });
});

describe("sortCollaborators", () => {
  const base: Omit<CollaboratorScore, "score" | "name" | "userId"> = {
    areaId: null,
    areaName: null,
    specialCount: 0,
    goldCount: 0,
    silverCount: 0,
    bronzeCount: 0,
    totalCompliments: 0,
    totalTrainings: 0,
  };

  it("ordena por pontuação decrescente", () => {
    const collaborators: CollaboratorScore[] = [
      { ...base, userId: "1", name: "Alice", score: 5 },
      { ...base, userId: "2", name: "Bob", score: 15 },
      { ...base, userId: "3", name: "Carol", score: 10 },
    ];
    const sorted = sortCollaborators(collaborators);
    expect(sorted[0].name).toBe("Bob");
    expect(sorted[1].name).toBe("Carol");
    expect(sorted[2].name).toBe("Alice");
  });

  it("desempata por medalhas especiais", () => {
    const collaborators: CollaboratorScore[] = [
      { ...base, userId: "1", name: "Alice", score: 10, specialCount: 1 },
      { ...base, userId: "2", name: "Bob", score: 10, specialCount: 0 },
    ];
    const sorted = sortCollaborators(collaborators);
    expect(sorted[0].name).toBe("Alice");
  });

  it("desempata por medalhas de ouro quando especiais empatam", () => {
    const collaborators: CollaboratorScore[] = [
      { ...base, userId: "1", name: "Alice", score: 10, specialCount: 1, goldCount: 2 },
      { ...base, userId: "2", name: "Bob", score: 10, specialCount: 1, goldCount: 3 },
    ];
    const sorted = sortCollaborators(collaborators);
    expect(sorted[0].name).toBe("Bob");
  });

  it("não muta o array original", () => {
    const original: CollaboratorScore[] = [
      { ...base, userId: "1", name: "Alice", score: 5 },
      { ...base, userId: "2", name: "Bob", score: 15 },
    ];
    sortCollaborators(original);
    expect(original[0].name).toBe("Alice");
  });
});
