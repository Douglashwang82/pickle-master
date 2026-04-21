import { describe, expect, it } from "vitest";
import { parseJsonBody } from "../api";

describe("parseJsonBody", () => {
  it("returns parsed JSON for valid request bodies", async () => {
    const result = await parseJsonBody(
      new Request("http://localhost/api", {
        method: "POST",
        body: JSON.stringify({ name: "Taipei Pickleball" }),
      })
    );

    expect(result.error).toBeNull();
    expect(result.body).toEqual({ name: "Taipei Pickleball" });
  });

  it("returns the shared invalid-json error for malformed bodies", async () => {
    const result = await parseJsonBody(
      new Request("http://localhost/api", {
        method: "POST",
        body: "{bad json",
      })
    );

    expect(result.body).toBeNull();
    expect(result.error?.status).toBe(400);
    await expect(result.error?.json()).resolves.toEqual({
      error: "Invalid JSON body",
      code: "INVALID_JSON",
    });
  });
});
