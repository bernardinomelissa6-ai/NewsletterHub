import { loginSchema, registerSchema } from "../auth.schema";

describe("loginSchema", () => {
  it("aceita credenciais válidas", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "Senha123" });
    expect(result.success).toBe(true);
  });

  it("rejeita email inválido", () => {
    const result = loginSchema.safeParse({ email: "nao-e-email", password: "Senha123" });
    expect(result.success).toBe(false);
  });

  it("rejeita senha vazia", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "" });
    expect(result.success).toBe(false);
  });

  it("normaliza email para minúsculas", () => {
    const result = loginSchema.safeParse({ email: "USER@EXAMPLE.COM", password: "Senha123" });
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });
});

describe("registerSchema", () => {
  const valid = {
    name: "João da Silva",
    email: "joao@empresa.com",
    password: "Senha@123",
    confirmPassword: "Senha@123",
  };

  it("aceita registro válido", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejeita quando senhas não conferem", () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: "Diferente@123" });
    expect(result.success).toBe(false);
  });

  it("rejeita senha fraca (sem maiúscula)", () => {
    const result = registerSchema.safeParse({ ...valid, password: "senha@123", confirmPassword: "senha@123" });
    expect(result.success).toBe(false);
  });

  it("rejeita nome muito curto", () => {
    const result = registerSchema.safeParse({ ...valid, name: "Jo" });
    expect(result.success).toBe(false);
  });
});
