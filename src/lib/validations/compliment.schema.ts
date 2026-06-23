import { z } from "zod";
import { ComplimentStatus, MedalType } from "@prisma/client";

export const createComplimentSchema = z.object({
  insured: z.string().min(2, "Nome do segurado obrigatório").max(300),
  receivedAt: z.string().min(1, "Data de recebimento obrigatória"),
  branch: z.string().min(1, "Ramo obrigatório").max(200),
  reason: z.string().min(10, "Elogio deve ter ao menos 10 caracteres").max(5000),
  collaboratorId: z.string().uuid("Colaborador inválido"),
});

export const updateComplimentSchema = createComplimentSchema.partial();

export const approveComplimentSchema = z.object({
  observation: z.string().max(1000).optional(),
});

export const rejectComplimentSchema = z.object({
  observation: z.string().min(10, "Motivo da rejeição obrigatório (mínimo 10 caracteres)").max(1000),
});

export const returnComplimentSchema = z.object({
  observation: z.string().min(10, "Observação obrigatória (mínimo 10 caracteres)").max(1000),
});

export const evaluateComplimentSchema = z.object({
  medal: z.nativeEnum(MedalType, { errorMap: () => ({ message: "Medalha inválida" }) }),
  justification: z.string().min(10, "Justificativa obrigatória (mínimo 10 caracteres)").max(2000),
  comment: z.string().max(1000).optional(),
});

export const reevaluateComplimentSchema = z.object({
  medal: z.nativeEnum(MedalType),
  reason: z.string().min(10, "Motivo obrigatório (mínimo 10 caracteres)").max(2000),
});

export const complimentFilterSchema = z.object({
  status: z.nativeEnum(ComplimentStatus).optional(),
  collaboratorId: z.string().uuid().optional(),
  areaId: z.string().uuid().optional(),
  branch: z.string().optional(),
  year: z.coerce.number().int().optional(),
  quarter: z.coerce.number().int().min(1).max(4).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateComplimentInput = z.infer<typeof createComplimentSchema>;
export type ApproveComplimentInput = z.infer<typeof approveComplimentSchema>;
export type RejectComplimentInput = z.infer<typeof rejectComplimentSchema>;
export type ReturnComplimentInput = z.infer<typeof returnComplimentSchema>;
export type EvaluateComplimentInput = z.infer<typeof evaluateComplimentSchema>;
export type ReevaluateComplimentInput = z.infer<typeof reevaluateComplimentSchema>;
export type ComplimentFilterInput = z.infer<typeof complimentFilterSchema>;
