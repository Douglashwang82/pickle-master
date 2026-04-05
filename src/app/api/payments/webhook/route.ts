/**
 * Payment gateway webhook stub.
 * This will be replaced with TapPay webhook handling when integrating real payments.
 */
import { ok } from "@/lib/utils/api";

export async function POST() {
  // TODO: Implement TapPay webhook signature verification and payment confirmation
  return ok({ received: true });
}
