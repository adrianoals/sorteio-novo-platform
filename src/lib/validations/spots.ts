import { z } from "zod";

export const createSpotSchema = z.object({
  number: z.string().min(1, "Número é obrigatório").max(50),
  blockId: z.string().uuid().optional().nullable(),
  basement: z.string().max(50).optional().nullable(),
  spotType: z.enum(["simple", "double"]),
  specialType: z.enum(["normal", "pne", "idoso", "visitor"]).optional().nullable(),
  attributes: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const updateSpotSchema = z.object({
  number: z.string().min(1).max(50).optional(),
  blockId: z.string().uuid().optional().nullable(),
  basement: z.string().max(50).optional().nullable(),
  spotType: z.enum(["simple", "double"]).optional(),
  specialType: z.enum(["normal", "pne", "idoso", "visitor"]).optional().nullable(),
  /** Atribuir (travar) a um apartamento ou desatribuir (null). */
  apartmentId: z.string().uuid().optional().nullable(),
  attributes: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type CreateSpotInput = z.infer<typeof createSpotSchema>;
export type UpdateSpotInput = z.infer<typeof updateSpotSchema>;
