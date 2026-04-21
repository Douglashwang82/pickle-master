import { describe, expect, it, vi, afterEach } from "vitest";
import { guardDevRoute } from "../dev-route";

describe("guardDevRoute", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows dev routes outside production", () => {
    vi.stubEnv("NODE_ENV", "test");

    expect(guardDevRoute(new Request("http://localhost/api/dev/seed-all"))).toBeNull();
  });

  it("hides dev routes in production when no secret is configured", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEV_ROUTE_SECRET", "");

    const response = guardDevRoute(new Request("http://localhost/api/dev/seed-all"));

    expect(response?.status).toBe(404);
    await expect(response?.json()).resolves.toEqual({
      error: "Not found",
      code: "NOT_FOUND",
    });
  });

  it("requires the configured bearer secret in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEV_ROUTE_SECRET", "dev-secret");

    const rejected = guardDevRoute(new Request("http://localhost/api/dev/seed-all"));
    const accepted = guardDevRoute(
      new Request("http://localhost/api/dev/seed-all", {
        headers: { Authorization: "Bearer dev-secret" },
      })
    );

    expect(rejected?.status).toBe(401);
    await expect(rejected?.json()).resolves.toEqual({
      error: "Unauthorized",
      code: "UNAUTHORIZED",
    });
    expect(accepted).toBeNull();
  });
});
