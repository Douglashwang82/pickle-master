import { describe, it, expect } from "vitest";
import { canPaymentTransition } from "../payment";

describe("canPaymentTransition", () => {
  it("allows initiated → succeeded", () => {
    expect(canPaymentTransition("initiated", "succeeded")).toBe(true);
  });

  it("allows initiated → failed", () => {
    expect(canPaymentTransition("initiated", "failed")).toBe(true);
  });

  it("allows succeeded → refund_pending", () => {
    expect(canPaymentTransition("succeeded", "refund_pending")).toBe(true);
  });

  it("allows refund_pending → refunded", () => {
    expect(canPaymentTransition("refund_pending", "refunded")).toBe(true);
  });

  it("disallows initiated → refunded (skipping states)", () => {
    expect(canPaymentTransition("initiated", "refunded")).toBe(false);
  });

  it("disallows failed → succeeded", () => {
    expect(canPaymentTransition("failed", "succeeded")).toBe(false);
  });

  it("disallows refunded → any", () => {
    expect(canPaymentTransition("refunded", "refund_pending")).toBe(false);
    expect(canPaymentTransition("refunded", "initiated")).toBe(false);
  });
});
