import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createTenantSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255),
  slug: z
    .string()
    .min(1, "Slug é obrigatório")
    .max(255)
    .regex(slugRegex, "Slug deve ser em minúsculas, números e hífens"),
});

export const updateTenantSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(slugRegex, "Slug deve ser em minúsculas, números e hífens")
    .optional(),
  status: z.enum(["active", "inactive"]).optional(),
  config: z
    .object({
      has_blocks: z.boolean().optional(),
      has_basement: z.boolean().optional(),
      basements: z.array(z.string()).optional(),
      enabled_features: z
        .object({
          pne: z.boolean().optional(),
          idoso: z.boolean().optional(),
        })
        .optional(),
      intended_draw_type: z.enum(["S1", "S2", "S3"]).optional(),
    })
    .optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
