import type { RegistrationStatus } from "@/types/domain";

const VALID_TRANSITIONS: Record<RegistrationStatus, RegistrationStatus[]> = {
  payment_pending: ["confirmed", "cancelled"],
  confirmed: ["refund_pending", "removed", "cancelled"],
  cancelled: [],
  removed: ["refund_pending"],
  refund_pending: ["refunded"],
  refunded: [],
};

export function canRegistrationTransition(
  from: RegistrationStatus,
  to: RegistrationStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
