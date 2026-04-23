import { z } from "zod";

export const CreateSessionSchema = z.object({
  title: z.string().min(2).max(200).trim(),
  notes: z.string().max(2000).trim().optional(),
  scheduled_start_at: z.string().datetime(),
  scheduled_end_at: z.string().datetime(),
  duration_minutes: z.number().int().min(15).max(480),
  venue_id: z.string().uuid("Please select a valid venue"),
  capacity: z.number().int().min(1).max(200),
  fee_twd: z.number().int().min(0).default(0),
  image_url: z.string().url().max(2048).nullable().optional(),
});

export const UpdateSessionSchema = CreateSessionSchema.partial();

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type UpdateSessionInput = z.infer<typeof UpdateSessionSchema>;
