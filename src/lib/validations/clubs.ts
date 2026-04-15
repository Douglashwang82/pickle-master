import { z } from "zod";
import { TAIPEI_DISTRICTS } from "@/lib/constants/districts";

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
  district: z.enum(TAIPEI_DISTRICTS).optional(),
  membership_type: z.enum(["open", "application"]).default("application"),
  skill_levels: z
    .array(z.enum(["beginner", "intermediate", "advanced", "pro"]))
    .default([]),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});

export const UpdateClubSchema = CreateClubSchema.partial().omit({ slug: true });

export const PublicClubsQuerySchema = z.object({
  q: z.string().max(100).optional(),
  district: z.enum(TAIPEI_DISTRICTS).optional(),
  membership: z.enum(["open", "application"]).optional(),
  skill: z.enum(["beginner", "intermediate", "advanced", "pro"]).optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius_km: z.coerce.number().min(0.5).max(50).default(5),
  sort: z.enum(["newest", "most_members", "most_active", "nearest"]).default("newest"),
  view: z.enum(["list", "map"]).default("list"),
  page: z.coerce.number().int().min(1).default(1),
});

export type CreateClubInput = z.infer<typeof CreateClubSchema>;
export type UpdateClubInput = z.infer<typeof UpdateClubSchema>;
export type PublicClubsQuery = z.infer<typeof PublicClubsQuerySchema>;
