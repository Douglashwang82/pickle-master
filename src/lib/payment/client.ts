/**
 * Mock payment client.
 * Replace the implementations here with real TapPay SDK calls when integrating.
 */

export type PaymentResult = {
  gatewayPaymentId: string;
};

export async function initiatePayment(
  amount: number,
  orderId: string
): Promise<PaymentResult> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 500));
  return {
    gatewayPaymentId: `mock_${orderId}_${Date.now()}`,
  };
}

export async function initiateRefund(
  gatewayPaymentId: string,
  _amount: number
): Promise<void> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 300));
  // Mock always succeeds — no-op
  console.log("[mock-payment] Refund initiated for:", gatewayPaymentId);
}
