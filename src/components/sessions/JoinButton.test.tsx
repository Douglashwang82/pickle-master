import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import JoinButton from "./JoinButton";

const refresh = vi.fn();
const push = vi.fn();
const toast = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh,
    push,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast,
  }),
}));

vi.mock("@/components/payments/PaymentModal", () => ({
  default: () => null,
}));

describe("JoinButton", () => {
  beforeEach(() => {
    refresh.mockReset();
    push.mockReset();
    toast.mockReset();
    vi.restoreAllMocks();
  });

  it("shows the waitlist join action for authenticated members when a session is full", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ position: 2 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <JoinButton
        sessionId="session-1"
        fee={300}
        isFull
        isAuthenticated
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "加入候補" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/sessions/session-1/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    });

    expect(toast).toHaveBeenCalledWith({
      title: "已加入候補",
      description: "您目前排在第 2 位。",
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("shows the waitlist leave action when the member is already queued", () => {
    render(
      <JoinButton
        sessionId="session-1"
        fee={300}
        isFull
        isAuthenticated
        waitlistPosition={3}
      />
    );

    expect(screen.getByRole("button", { name: "候補中 #3 · 退出候補" })).toBeTruthy();
  });
});