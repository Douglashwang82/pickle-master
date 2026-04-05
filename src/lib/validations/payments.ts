import { z } from "zod";

export const JoinSessionSchema = z.object({
  // Dev-only: simulate payment failure
  simulateFailure: z.boolean().optional().default(false),
});

// Stub for future TapPay webhook payload
export const PaymentWebhookSchema = z.object({
  rec_trade_id: z.string(),
  order_number: z.string(),
  status: z.number(),
  amount: z.number(),
  msg: z.string().optional(),
});

export type JoinSessionInput = z.infer<typeof JoinSessionSchema>;
export type PaymentWebhookInput = z.infer<typeof PaymentWebhookSchema>;
