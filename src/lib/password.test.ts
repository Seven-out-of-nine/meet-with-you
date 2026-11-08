import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password helpers", () => {
  it("hashes with a unique salt", () => {
    expect(hashPassword("student123")).not.toBe(hashPassword("student123"));
  });

  it("accepts the original password and rejects a wrong one", () => {
    const stored = hashPassword("student123");
    expect(verifyPassword("student123", stored)).toBe(true);
    expect(verifyPassword("not-the-password", stored)).toBe(false);
  });

  it("rejects malformed stored values", () => {
    expect(verifyPassword("anything", "broken")).toBe(false);
  });
});
