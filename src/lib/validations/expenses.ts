import { z } from "zod";

export const ExpenseSplitSchema = z.object({
  participant_name: z.string().min(1, "Name required").max(100),
  amount_owed_twd: z.number().int().positive("Amount must be positive"),
});

export const CreateExpenseSchema = z.object({
  payer_name: z.string().min(1, "Payer name required").max(100),
  total_amount_twd: z.number().int().positive("Total must be positive"),
  description: z.string().min(1, "Description required").max(500),
  splits: z
    .array(ExpenseSplitSchema)
    .min(1, "At least one participant required"),
});

export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>;
