import { beforeEach, describe, expect, it, vi } from "vitest";
import { createConfirmedRegistrationWithDebt } from "../session-registration";
import { supabaseAdmin } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  supabaseAdmin: {
    rpc: vi.fn(),
  },
}));

const rpc = vi.mocked(supabaseAdmin.rpc);

describe("createConfirmedRegistrationWithDebt", () => {
  beforeEach(() => {
    rpc.mockReset();
  });

  it("delegates registration and debt creation to the atomic RPC", async () => {
    rpc.mockResolvedValueOnce({
      data: [
        {
          registration_id: "registration-1",
          payment_transaction_id: "payment-1",
          new_status: "full",
          amount_twd: 300,
        },
      ],
      error: null,
    });

    const result = await createConfirmedRegistrationWithDebt(
      {
        id: "session-1",
        club_id: "club-1",
        status: "published",
        capacity: 10,
        fee_twd: 300,
      },
      "user-1",
      "2026-04-21T12:00:00.000Z"
    );

    expect(rpc).toHaveBeenCalledWith("app_create_confirmed_registration_with_debt", {
      p_session_id: "session-1",
      p_user_id: "user-1",
      p_now: "2026-04-21T12:00:00.000Z",
    });
    expect(result).toEqual({
      registration: { id: "registration-1" },
      payment: { id: "payment-1", amount_twd: 300 },
      newStatus: "full",
    });
  });

  it("throws the RPC error message for callers to map", async () => {
    rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "SESSION_FULL" },
    });

    await expect(
      createConfirmedRegistrationWithDebt(
        {
          id: "session-1",
          club_id: "club-1",
          status: "published",
          capacity: 10,
          fee_twd: 300,
        },
        "user-1"
      )
    ).rejects.toThrow("SESSION_FULL");
  });

  it("throws when the RPC returns no registration row", async () => {
    rpc.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    await expect(
      createConfirmedRegistrationWithDebt(
        {
          id: "session-1",
          club_id: "club-1",
          status: "published",
          capacity: 10,
          fee_twd: 300,
        },
        "user-1"
      )
    ).rejects.toThrow("Failed to create registration");
  });
});
