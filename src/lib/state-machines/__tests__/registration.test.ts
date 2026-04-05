import { describe, it, expect } from "vitest";
import { canRegistrationTransition } from "../registration";

describe("canRegistrationTransition", () => {
  it("allows payment_pending → confirmed", () => {
    expect(canRegistrationTransition("payment_pending", "confirmed")).toBe(true);
  });

  it("allows payment_pending → cancelled (hold expired or failure)", () => {
    expect(canRegistrationTransition("payment_pending", "cancelled")).toBe(true);
  });

  it("allows confirmed → refund_pending", () => {
    expect(canRegistrationTransition("confirmed", "refund_pending")).toBe(true);
  });

  it("allows confirmed → removed", () => {
    expect(canRegistrationTransition("confirmed", "removed")).toBe(true);
  });

  it("allows refund_pending → refunded", () => {
    expect(canRegistrationTransition("refund_pending", "refunded")).toBe(true);
  });

  it("disallows confirmed → payment_pending", () => {
    expect(canRegistrationTransition("confirmed", "payment_pending")).toBe(false);
  });

  it("disallows refunded → any", () => {
    expect(canRegistrationTransition("refunded", "confirmed")).toBe(false);
    expect(canRegistrationTransition("refunded", "refund_pending")).toBe(false);
  });

  it("disallows cancelled → confirmed", () => {
    expect(canRegistrationTransition("cancelled", "confirmed")).toBe(false);
  });
});
