import { z } from "zod";

export const createAreaSchema = z.object({
  name: z.string().min(2, "Nome obrigatório").max(200),
  managerId: z.string().uuid().optional().nullable(),
  directorId: z.string().uuid().optional().nullable(),
});

export const updateAreaSchema = createAreaSchema.partial();

export type CreateAreaInput = z.infer<typeof createAreaSchema>;
export type UpdateAreaInput = z.infer<typeof updateAreaSchema>;
