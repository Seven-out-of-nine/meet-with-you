import { describe, expect, it } from "vitest";
import { safePath, withMessage } from "./forms";

describe("form helpers", () => {
  it("allows local return paths", () => {
    expect(safePath("/buddies/12", "/dashboard")).toBe("/buddies/12");
  });

  it("blocks protocol-relative redirects", () => {
    expect(safePath("//example.com", "/dashboard")).toBe("/dashboard");
  });

  it("encodes feedback messages", () => {
    expect(withMessage("/login", "error", "账号 不存在")).toBe("/login?error=%E8%B4%A6%E5%8F%B7%20%E4%B8%8D%E5%AD%98%E5%9C%A8");
  });
});
