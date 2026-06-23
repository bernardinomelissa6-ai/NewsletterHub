import { z } from "zod";
import { TrainingType } from "@prisma/client";

export const createTrainingSchema = z.object({
  insured: z.string().min(2, "Nome obrigatório").max(300),
  date: z.string().min(1, "Data obrigatória"),
  type: z.nativeEnum(TrainingType, { errorMap: () => ({ message: "Tipo inválido" }) }),
  branch: z.string().min(1, "Ramo obrigatório").max(200),
  collaboratorId: z.string().uuid("Colaborador inválido"),
});

export const trainingFilterSchema = z.object({
  type: z.nativeEnum(TrainingType).optional(),
  collaboratorId: z.string().uuid().optional(),
  areaId: z.string().uuid().optional(),
  year: z.coerce.number().int().optional(),
  quarter: z.coerce.number().int().min(1).max(4).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateTrainingInput = z.infer<typeof createTrainingSchema>;
export type TrainingFilterInput = z.infer<typeof trainingFilterSchema>;
