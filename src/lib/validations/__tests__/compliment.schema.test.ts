import { createComplimentSchema, evaluateComplimentSchema, rejectComplimentSchema } from "../compliment.schema";

describe("createComplimentSchema", () => {
  const valid = {
    insured: "João da Silva",
    receivedAt: "2024-06-15",
    branch: "Automóvel",
    reason: "Atendimento excelente prestado ao cliente",
    claimHistory: "Sinistro aberto em 10/01/2024 e encerrado em 20/01/2024",
    collaboratorId: "550e8400-e29b-41d4-a716-446655440000",
  };

  it("aceita dados válidos", () => {
    expect(createComplimentSchema.safeParse(valid).success).toBe(true);
  });

  it("rejeita segurado com menos de 2 caracteres", () => {
    const result = createComplimentSchema.safeParse({ ...valid, insured: "A" });
    expect(result.success).toBe(false);
  });

  it("rejeita elogio com menos de 10 caracteres", () => {
    const result = createComplimentSchema.safeParse({ ...valid, reason: "Curto" });
    expect(result.success).toBe(false);
  });

  it("rejeita histórico do sinistro com menos de 10 caracteres", () => {
    const result = createComplimentSchema.safeParse({ ...valid, claimHistory: "Curto" });
    expect(result.success).toBe(false);
  });

  it("rejeita histórico do sinistro ausente", () => {
    const { claimHistory, ...withoutClaimHistory } = valid;
    const result = createComplimentSchema.safeParse(withoutClaimHistory);
    expect(result.success).toBe(false);
  });

  it("rejeita UUID inválido para collaboratorId", () => {
    const result = createComplimentSchema.safeParse({ ...valid, collaboratorId: "nao-e-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejeita data vazia", () => {
    const result = createComplimentSchema.safeParse({ ...valid, receivedAt: "" });
    expect(result.success).toBe(false);
  });
});

describe("evaluateComplimentSchema", () => {
  it("aceita medalha válida", () => {
    const result = evaluateComplimentSchema.safeParse({
      medal: "GOLD",
      justification: "Excelente atendimento ao cliente e resolução rápida do problema",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita medalha inválida", () => {
    const result = evaluateComplimentSchema.safeParse({
      medal: "PLATINUM",
      justification: "Justificativa válida com mais de 10 caracteres",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita justificativa curta", () => {
    const result = evaluateComplimentSchema.safeParse({ medal: "GOLD", justification: "Curta" });
    expect(result.success).toBe(false);
  });
});

describe("rejectComplimentSchema", () => {
  it("rejeita observação com menos de 10 caracteres", () => {
    const result = rejectComplimentSchema.safeParse({ observation: "Curta" });
    expect(result.success).toBe(false);
  });

  it("aceita observação válida", () => {
    const result = rejectComplimentSchema.safeParse({ observation: "Elogio incompleto, faltam informações essenciais" });
    expect(result.success).toBe(true);
  });
});
