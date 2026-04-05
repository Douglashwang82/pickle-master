import { describe, it, expect } from "vitest";
import {
  canSessionTransition,
  sessionStatusAfterRegistration,
} from "../session";

describe("canSessionTransition", () => {
  it("allows draft → published", () => {
    expect(canSessionTransition("draft", "published")).toBe(true);
  });

  it("allows published → full", () => {
    expect(canSessionTransition("published", "full")).toBe(true);
  });

  it("allows full → published (spot reopened)", () => {
    expect(canSessionTransition("full", "published")).toBe(true);
  });

  it("allows published → cancelled", () => {
    expect(canSessionTransition("published", "cancelled")).toBe(true);
  });

  it("allows full → cancelled", () => {
    expect(canSessionTransition("full", "cancelled")).toBe(true);
  });

  it("allows published → auto_closed", () => {
    expect(canSessionTransition("published", "auto_closed")).toBe(true);
  });

  it("disallows cancelled → published", () => {
    expect(canSessionTransition("cancelled", "published")).toBe(false);
  });

  it("disallows completed → published", () => {
    expect(canSessionTransition("completed", "published")).toBe(false);
  });

  it("disallows auto_closed → published", () => {
    expect(canSessionTransition("auto_closed", "published")).toBe(false);
  });

  it("disallows draft → full", () => {
    expect(canSessionTransition("draft", "full")).toBe(false);
  });
});

describe("sessionStatusAfterRegistration", () => {
  it("transitions published → full when capacity reached", () => {
    expect(sessionStatusAfterRegistration("published", 10, 10)).toBe("full");
  });

  it("stays published when spots remain", () => {
    expect(sessionStatusAfterRegistration("published", 9, 10)).toBe("published");
  });

  it("transitions full → published when spot opens", () => {
    expect(sessionStatusAfterRegistration("full", 9, 10)).toBe("published");
  });

  it("does not change cancelled status", () => {
    expect(sessionStatusAfterRegistration("cancelled", 0, 10)).toBe("cancelled");
  });

  it("does not change completed status", () => {
    expect(sessionStatusAfterRegistration("completed", 5, 10)).toBe("completed");
  });
});
