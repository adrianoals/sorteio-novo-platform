import { z } from "zod";

const rightsEnum = ["simple", "double", "two_simple", "car", "moto"] as const;

export const createApartmentSchema = z.object({
  number: z.string().min(1, "Número é obrigatório").max(50),
  blockId: z.string().uuid().optional().nullable(),
  rights: z.enum(rightsEnum),
  attributes: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const updateApartmentSchema = z.object({
  number: z.string().min(1).max(50).optional(),
  blockId: z.string().uuid().optional().nullable(),
  rights: z.enum(rightsEnum).optional(),
  attributes: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type CreateApartmentInput = z.infer<typeof createApartmentSchema>;
export type UpdateApartmentInput = z.infer<typeof updateApartmentSchema>;
