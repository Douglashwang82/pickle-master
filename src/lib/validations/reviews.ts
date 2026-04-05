import { z } from "zod";

export const VALID_BADGES = ["準時王", "神對手", "氣氛大師"] as const;
export type Badge = (typeof VALID_BADGES)[number];

const PeerReviewItemSchema = z.object({
  reviewee_user_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  badges: z.array(z.enum(VALID_BADGES)).max(3).default([]),
});

export const PeerReviewBatchSchema = z.object({
  reviews: z.array(PeerReviewItemSchema).min(1).max(50),
});

export const VenueReviewSchema = z.object({
  session_id: z.string().uuid(),
  facilities_rating: z.number().int().min(1).max(5),
  lighting_rating: z.number().int().min(1).max(5),
  floor_rating: z.number().int().min(1).max(5),
  transport_rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).trim().optional(),
});

export type PeerReviewBatchInput = z.infer<typeof PeerReviewBatchSchema>;
export type VenueReviewInput = z.infer<typeof VenueReviewSchema>;
