import { z } from "zod";
import {
  BOARD_POST_IMPORTANCE_LEVELS,
  BOARD_POST_KINDS,
  BOARD_REACTION_EMOJIS,
} from "@/lib/board-config";

const optionalTitleSchema = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

const optionalReasonSchema = z
  .string()
  .trim()
  .max(300)
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined));

export const CreateBoardPostSchema = z.object({
  kind: z.enum(BOARD_POST_KINDS),
  title: optionalTitleSchema,
  body: z.string().trim().min(1).max(1000),
  importance: z.enum(BOARD_POST_IMPORTANCE_LEVELS).default("normal"),
  is_pinned: z.boolean().optional().default(false),
});

export const ReviewBoardPostSchema = z
  .object({
    decision: z.enum(["approve", "reject"]),
    rejection_reason: optionalReasonSchema,
    importance: z.enum(BOARD_POST_IMPORTANCE_LEVELS).optional(),
    is_pinned: z.boolean().optional(),
  })
  .superRefine((value, context) => {
    if (value.decision === "reject" && !value.rejection_reason) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Rejection reason is required when rejecting a post",
        path: ["rejection_reason"],
      });
    }
  });

export const PinBoardPostSchema = z.object({
  is_pinned: z.boolean(),
});

export const ToggleBoardReactionSchema = z.object({
  emoji: z.enum(BOARD_REACTION_EMOJIS),
  active: z.boolean().default(true),
});

export type CreateBoardPostInput = z.infer<typeof CreateBoardPostSchema>;
export type ReviewBoardPostInput = z.infer<typeof ReviewBoardPostSchema>;
export type PinBoardPostInput = z.infer<typeof PinBoardPostSchema>;
export type ToggleBoardReactionInput = z.infer<typeof ToggleBoardReactionSchema>;