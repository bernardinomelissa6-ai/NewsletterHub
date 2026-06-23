import { PrismaClient, Role, MedalType, TrainingType, DeadlineType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // ── Limpar dados existentes (ordem respeita FK) ──────────────
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.verificationCode.deleteMany();
  await prisma.complimentReevaluation.deleteMany();
  await prisma.complimentEvaluation.deleteMany();
  await prisma.complimentApproval.deleteMany();
  await prisma.compliment.deleteMany();
  await prisma.training.deleteMany();
  await prisma.deadline.deleteMany();
  await prisma.user.deleteMany();
  await prisma.area.deleteMany();

  const hash = (pwd: string) => bcrypt.hashSync(pwd, 10);

  // ── Prazos padrão ─────────────────────────────────────────────
  await prisma.deadline.createMany({
    data: [
      { type: DeadlineType.REGISTRATION, days: 30 },
      { type: DeadlineType.APPROVAL, days: 7 },
      { type: DeadlineType.EVALUATION, days: 5 },
    ],
  });

  // ── Administrador ─────────────────────────────────────────────
  const admin = await prisma.user.create({
    data: {
      name: "Administrador Sistema",
      email: "admin@empresa.com.br",
      passwordHash: hash("Admin@123"),
      role: Role.ADMIN,
      emailVerified: true,
      isActive: true,
    },
  });

  // ── Diretores ─────────────────────────────────────────────────
  const diretor1 = await prisma.user.create({
    data: {
      name: "Carlos Eduardo Diretor",
      email: "carlos.diretor@empresa.com.br",
      passwordHash: hash("Diretor@123"),
      role: Role.DIRECTOR,
      emailVerified: true,
      isActive: true,
    },
  });

  const diretor2 = await prisma.user.create({
    data: {
      name: "Fernanda Lima Diretora",
      email: "fernanda.diretora@empresa.com.br",
      passwordHash: hash("Diretor@123"),
      role: Role.DIRECTOR,
      emailVerified: true,
      isActive: true,
    },
  });

  // ── Gestores ──────────────────────────────────────────────────
  const gestora1 = await prisma.user.create({
    data: {
      name: "Ana Paula Gestora",
      email: "ana.gestora@empresa.com.br",
      passwordHash: hash("Gestor@123"),
      role: Role.MANAGER,
      emailVerified: true,
      isActive: true,
    },
  });

  const gestor2 = await prisma.user.create({
    data: {
      name: "Roberto Gestora",
      email: "roberto.gestor@empresa.com.br",
      passwordHash: hash("Gestor@123"),
      role: Role.MANAGER,
      emailVerified: true,
      isActive: true,
    },
  });

  // ── Áreas ─────────────────────────────────────────────────────
  const areaSinistros = await prisma.area.create({
    data: {
      name: "Sinistros",
      managerId: gestora1.id,
      directorId: diretor1.id,
    },
  });

  const areaAtendimento = await prisma.area.create({
    data: {
      name: "Atendimento ao Cliente",
      managerId: gestor2.id,
      directorId: diretor2.id,
    },
  });

  await prisma.area.create({
    data: {
      name: "Operações",
      directorId: diretor1.id,
    },
  });

  // ── Colaboradores (Sinistros) ──────────────────────────────────
  const junior = await prisma.user.create({
    data: {
      name: "Junior Santos",
      email: "junior.santos@empresa.com.br",
      passwordHash: hash("Colab@123"),
      role: Role.COLLABORATOR,
      emailVerified: true,
      isActive: true,
      areaId: areaSinistros.id,
    },
  });

  const maria = await prisma.user.create({
    data: {
      name: "Maria Oliveira",
      email: "maria.oliveira@empresa.com.br",
      passwordHash: hash("Colab@123"),
      role: Role.COLLABORATOR,
      emailVerified: true,
      isActive: true,
      areaId: areaSinistros.id,
    },
  });

  const pedro = await prisma.user.create({
    data: {
      name: "Pedro Almeida",
      email: "pedro.almeida@empresa.com.br",
      passwordHash: hash("Colab@123"),
      role: Role.COLLABORATOR,
      emailVerified: true,
      isActive: true,
      areaId: areaSinistros.id,
    },
  });

  // ── Colaboradores (Atendimento) ────────────────────────────────
  const lucia = await prisma.user.create({
    data: {
      name: "Lucia Ferreira",
      email: "lucia.ferreira@empresa.com.br",
      passwordHash: hash("Colab@123"),
      role: Role.COLLABORATOR,
      emailVerified: true,
      isActive: true,
      areaId: areaAtendimento.id,
    },
  });

  const marcos = await prisma.user.create({
    data: {
      name: "Marcos Costa",
      email: "marcos.costa@empresa.com.br",
      passwordHash: hash("Colab@123"),
      role: Role.COLLABORATOR,
      emailVerified: true,
      isActive: true,
      areaId: areaAtendimento.id,
    },
  });

  // Atualizar gestores com área
  await prisma.user.update({ where: { id: gestora1.id }, data: { areaId: areaSinistros.id } });
  await prisma.user.update({ where: { id: gestor2.id }, data: { areaId: areaAtendimento.id } });

  // ── Elogios ────────────────────────────────────────────────────
  const elogio1 = await prisma.compliment.create({
    data: {
      insured: "João da Silva Segurado",
      receivedAt: new Date("2024-01-15"),
      branch: "Automóvel",
      reason: "Atendimento excepcional na abertura do sinistro. O colaborador foi extremamente solícito e resolveu meu problema em menos de 24 horas.",
      collaboratorId: junior.id,
      submittedById: junior.id,
      status: "AVALIADO",
      quarter: 1,
      year: 2024,
    },
  });

  await prisma.complimentApproval.create({
    data: {
      complimentId: elogio1.id,
      managerId: gestora1.id,
      action: "APPROVED",
      observation: "Elogio verificado e aprovado.",
    },
  });

  await prisma.complimentEvaluation.create({
    data: {
      complimentId: elogio1.id,
      directorId: diretor1.id,
      medal: MedalType.GOLD,
      justification: "Reconhecimento de alto impacto. Cliente relatou resolução em 24h.",
      comment: "Parabéns ao colaborador.",
    },
  });

  const elogio2 = await prisma.compliment.create({
    data: {
      insured: "Maria Aparecida Corretora",
      receivedAt: new Date("2024-02-10"),
      branch: "Vida",
      reason: "Profissionalismo e dedicação no processo de análise de sinistro. A Maria sempre vai além do esperado.",
      collaboratorId: maria.id,
      submittedById: maria.id,
      status: "AVALIADO",
      quarter: 1,
      year: 2024,
    },
  });

  await prisma.complimentApproval.create({
    data: {
      complimentId: elogio2.id,
      managerId: gestora1.id,
      action: "APPROVED",
    },
  });

  await prisma.complimentEvaluation.create({
    data: {
      complimentId: elogio2.id,
      directorId: diretor1.id,
      medal: MedalType.SPECIAL,
      justification: "Reconhecimento excepcional. Impacto direto na retenção do cliente.",
    },
  });

  const elogio3 = await prisma.compliment.create({
    data: {
      insured: "Empresa XYZ Parceira",
      receivedAt: new Date("2024-03-05"),
      branch: "Patrimonial",
      reason: "Suporte técnico de excelência. O Pedro demonstrou conhecimento técnico e empatia.",
      collaboratorId: pedro.id,
      submittedById: pedro.id,
      status: "AVALIADO",
      quarter: 1,
      year: 2024,
    },
  });

  await prisma.complimentApproval.create({
    data: {
      complimentId: elogio3.id,
      managerId: gestora1.id,
      action: "APPROVED",
    },
  });

  await prisma.complimentEvaluation.create({
    data: {
      complimentId: elogio3.id,
      directorId: diretor1.id,
      medal: MedalType.SILVER,
      justification: "Reconhecimento acima da média.",
    },
  });

  // Elogio pendente de aprovação
  await prisma.compliment.create({
    data: {
      insured: "Roberto Ferreira",
      receivedAt: new Date("2024-04-01"),
      branch: "Saúde",
      reason: "Atendimento muito rápido e eficiente.",
      collaboratorId: junior.id,
      submittedById: junior.id,
      status: "PENDENTE_APROVACAO",
      quarter: 2,
      year: 2024,
    },
  });

  // Elogio pendente de avaliação
  const elogio5 = await prisma.compliment.create({
    data: {
      insured: "Construtora ABC",
      receivedAt: new Date("2024-04-10"),
      branch: "Engenharia",
      reason: "Excelente suporte na análise de riscos de engenharia.",
      collaboratorId: maria.id,
      submittedById: maria.id,
      status: "PENDENTE_AVALIACAO",
      quarter: 2,
      year: 2024,
    },
  });

  await prisma.complimentApproval.create({
    data: {
      complimentId: elogio5.id,
      managerId: gestora1.id,
      action: "APPROVED",
      observation: "Aprovado. Cliente VIP.",
    },
  });

  // Elogio devolvido para ajuste
  const elogio6 = await prisma.compliment.create({
    data: {
      insured: "Fulano",
      receivedAt: new Date("2024-04-15"),
      branch: "Automóvel",
      reason: "Bom atendimento.",
      collaboratorId: pedro.id,
      submittedById: pedro.id,
      status: "DEVOLVIDO_PARA_AJUSTE",
      quarter: 2,
      year: 2024,
    },
  });

  await prisma.complimentApproval.create({
    data: {
      complimentId: elogio6.id,
      managerId: gestora1.id,
      action: "RETURNED",
      observation: "Precisa mais detalhes sobre o atendimento e nome completo do segurado.",
    },
  });

  // Elogios área Atendimento
  const elogio7 = await prisma.compliment.create({
    data: {
      insured: "Ana Clara Segurada",
      receivedAt: new Date("2024-02-20"),
      branch: "Residencial",
      reason: "Atendimento humanizado e rápido resolução do sinistro residencial.",
      collaboratorId: lucia.id,
      submittedById: lucia.id,
      status: "AVALIADO",
      quarter: 1,
      year: 2024,
    },
  });

  await prisma.complimentApproval.create({
    data: {
      complimentId: elogio7.id,
      managerId: gestor2.id,
      action: "APPROVED",
    },
  });

  await prisma.complimentEvaluation.create({
    data: {
      complimentId: elogio7.id,
      directorId: diretor2.id,
      medal: MedalType.BRONZE,
      justification: "Elogio simples mas genuíno.",
    },
  });

  // ── Treinamentos ───────────────────────────────────────────────
  await prisma.training.createMany({
    data: [
      {
        insured: "Willis Towers Watson",
        date: new Date("2024-01-20"),
        type: TrainingType.TRAINING,
        branch: "Automóvel",
        collaboratorId: junior.id,
        submittedById: junior.id,
        quarter: 1,
        year: 2024,
      },
      {
        insured: "Seguradora Brasil",
        date: new Date("2024-02-15"),
        type: TrainingType.COURSE,
        branch: "Vida",
        collaboratorId: maria.id,
        submittedById: maria.id,
        quarter: 1,
        year: 2024,
      },
      {
        insured: "Instituto Seguros",
        date: new Date("2024-03-10"),
        type: TrainingType.CONSULTANCY,
        branch: "Patrimonial",
        collaboratorId: pedro.id,
        submittedById: pedro.id,
        quarter: 1,
        year: 2024,
      },
      {
        insured: "WTW Academy",
        date: new Date("2024-04-05"),
        type: TrainingType.TRAINING,
        branch: "Saúde",
        collaboratorId: lucia.id,
        submittedById: lucia.id,
        quarter: 2,
        year: 2024,
      },
      {
        insured: "Escola de Seguros",
        date: new Date("2024-04-18"),
        type: TrainingType.COURSE,
        branch: "Engenharia",
        collaboratorId: marcos.id,
        submittedById: marcos.id,
        quarter: 2,
        year: 2024,
      },
    ],
  });

  console.log("✅ Seed concluído com sucesso!");
  console.log("\n📋 Credenciais de acesso:");
  console.log("─────────────────────────────────────────────");
  console.log("ADMIN:     admin@empresa.com.br        | Admin@123");
  console.log("DIRETOR:   carlos.diretor@empresa.com.br| Diretor@123");
  console.log("DIRETOR:   fernanda.diretora@empresa.com.br | Diretor@123");
  console.log("GESTOR:    ana.gestora@empresa.com.br  | Gestor@123");
  console.log("GESTOR:    roberto.gestor@empresa.com.br | Gestor@123");
  console.log("COLAB:     junior.santos@empresa.com.br | Colab@123");
  console.log("COLAB:     maria.oliveira@empresa.com.br | Colab@123");
  console.log("COLAB:     pedro.almeida@empresa.com.br  | Colab@123");
  console.log("COLAB:     lucia.ferreira@empresa.com.br | Colab@123");
  console.log("COLAB:     marcos.costa@empresa.com.br   | Colab@123");
  console.log("─────────────────────────────────────────────");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
