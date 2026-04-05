import type { PaymentStatus } from "@/types/domain";

const VALID_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  initiated: ["authorized", "succeeded", "failed"],
  authorized: ["succeeded", "failed"],
  succeeded: ["refund_pending"],
  failed: [],
  refund_pending: ["refunded", "failed", "partially_refunded"],
  partially_refunded: ["refunded", "refund_pending"],
  refunded: [],
};

export function canPaymentTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
