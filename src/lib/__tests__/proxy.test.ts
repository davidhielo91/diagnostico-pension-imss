import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

import { proxy, config } from "@/proxy";
import { credentialLoginRateLimiter } from "@/lib/rate-limit";

const { auth } = await import("@/lib/auth");

function req(path: string): Request {
  return new Request(`https://example.com${path}`);
}

function loginRequest(email = "admin@example.com"): Request {
  return new Request("https://example.com/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "x-real-ip": "203.0.113.10" },
    body: new URLSearchParams({ email, password: "wrong" }),
  });
}

describe("proxy — /sw.js passthrough (D19)", () => {
  it("passes /sw.js through WITHOUT redirect when unauthenticated", async () => {
    const result = await proxy(req("/sw.js"));
    expect(result).toBeUndefined();
  });

  it("still protects a private page (regression): /dashboard redirects to /login when unauthenticated", async () => {
    const result = await proxy(req("/dashboard"));
    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(302);
    expect((result as Response).headers.get("location")).toBe("https://example.com/login");
  });

  it("passes other public paths through unauthenticated", async () => {
    for (const path of ["/", "/gracias", "/aviso-de-privacidad", "/login", "/api/auth/session", "/api/public/leads"]) {
      expect(await proxy(req(path))).toBeUndefined();
    }
  });

  it("redirects /login to /dashboard when a session exists", async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: "u1" } });
    const result = await proxy(req("/login"));
    expect((result as Response).headers.get("location")).toBe("https://example.com/dashboard");
  });

  it("matcher excludes /sw.js from proxy execution", () => {
    const matcher = config.matcher[0];
    expect(new RegExp(matcher).test("/sw.js")).toBe(false);
    expect(new RegExp(matcher).test("/sw.js?x=1")).toBe(false);
    expect(new RegExp(matcher).test("/dashboard")).toBe(true);
    expect(new RegExp(matcher).test("/leads")).toBe(true);
  });

  it("returns a generic 429 response for a locked credential pair", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      credentialLoginRateLimiter.recordFailure({ email: "admin@example.com", ip: "203.0.113.10" });
    }

    const response = await proxy(loginRequest());

    expect(response?.status).toBe(429);
    expect(await response?.json()).toEqual({ error: "Unable to sign in. Please try again later." });
  });
});
