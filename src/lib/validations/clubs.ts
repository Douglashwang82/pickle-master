import { z } from "zod";

const slugSchema = z
  .string()
  .min(3)
  .max(50)
  .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only");

export const CreateClubSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  slug: slugSchema,
  description: z.string().max(1000).trim().optional(),
  sport_type: z.string().default("pickleball"),
  cover_image_url: z.string().url().optional().or(z.literal("")),
  rules: z.string().max(5000).trim().optional(),
  public_status: z.enum(["public", "private"]).default("public"),
});

export const UpdateClubSchema = CreateClubSchema.partial().omit({ slug: true });

export type CreateClubInput = z.infer<typeof CreateClubSchema>;
export type UpdateClubInput = z.infer<typeof UpdateClubSchema>;
