import { z } from "zod";

const rightEnum = z.enum(["simple", "double", "two_simple", "car", "moto"]);
export const rightsArraySchema = z
  .array(rightEnum)
  .min(1, "Pelo menos um direito é obrigatório");

export const createApartmentSchema = z.object({
  number: z.string().min(1, "Número é obrigatório").max(50),
  blockId: z.string().uuid().optional().nullable(),
  rights: rightsArraySchema,
  allowedSubsolos: z.array(z.string()).optional().nullable(),
  allowedBlocks: z.array(z.string().uuid()).optional().nullable(),
  attributes: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const updateApartmentSchema = z.object({
  number: z.string().min(1).max(50).optional(),
  blockId: z
    .union([z.string().uuid(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" ? null : v)),
  rights: rightsArraySchema.optional(),
  allowedSubsolos: z.array(z.string()).optional().nullable(),
  allowedBlocks: z.array(z.string().uuid()).optional().nullable(),
  attributes: z.record(z.string(), z.unknown()).optional().nullable(),
});

export type CreateApartmentInput = z.infer<typeof createApartmentSchema>;
export type UpdateApartmentInput = z.infer<typeof updateApartmentSchema>;
