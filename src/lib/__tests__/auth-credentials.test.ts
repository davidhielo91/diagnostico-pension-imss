import { describe, expect, it, vi } from "vitest";
import { authorizeCredentials } from "@/lib/auth-credentials";

const limiter = {
  check: vi.fn(() => ({ allowed: true } as const)),
  recordFailure: vi.fn(),
  reset: vi.fn(),
};

describe("authorizeCredentials", () => {
  it("resets the email/IP failure state after valid credentials", async () => {
    const comparePassword = vi.fn().mockResolvedValue(true);
    const findUser = vi.fn().mockResolvedValue({ id: "u1", email: "admin@example.com", name: "Admin", role: "ADMIN", password: "hash", active: true });
    const request = new Request("https://example.com/api/auth/callback/credentials", { headers: { "x-real-ip": "203.0.113.10" } });

    const user = await authorizeCredentials({ email: "admin@example.com", password: "valid" }, request, { limiter, findUser, comparePassword });

    expect(user).toMatchObject({ id: "u1", email: "admin@example.com" });
    expect(limiter.reset).toHaveBeenCalledWith({ email: "admin@example.com", ip: "203.0.113.10" });
    expect(limiter.recordFailure).not.toHaveBeenCalled();
  });
});
