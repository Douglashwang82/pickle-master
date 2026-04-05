/**
 * Refund webhook stub.
 * Replace with TapPay refund callback handling when integrating real payments.
 */
import { ok } from "@/lib/utils/api";

export async function POST() {
  // TODO: Implement TapPay refund webhook handling
  return ok({ received: true });
}
