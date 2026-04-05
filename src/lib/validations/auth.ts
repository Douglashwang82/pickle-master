import { z } from "zod";

export const UpdateProfileSchema = z.object({
  display_name: z.string().min(1).max(100).trim().optional(),
  photo_url: z.string().url().optional().or(z.literal("")).optional(),
  skill_level: z.enum(["beginner", "intermediate", "advanced", "pro"]).optional(),
  bio: z.string().max(500).trim().optional(),
  contact_preference: z.enum(["email", "line"]).optional(),
  locale: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
