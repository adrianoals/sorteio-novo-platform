import { z } from "zod";

export const createBlockSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  code: z.string().max(50).optional().nullable(),
});

export const updateBlockSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().max(50).optional().nullable(),
});

export type CreateBlockInput = z.infer<typeof createBlockSchema>;
export type UpdateBlockInput = z.infer<typeof updateBlockSchema>;
