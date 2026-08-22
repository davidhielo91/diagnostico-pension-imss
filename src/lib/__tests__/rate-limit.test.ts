import { describe, expect, it, vi } from "vitest";
import { InMemoryCredentialRateLimiter } from "@/lib/rate-limit";

const alice = { email: "alice@example.com", ip: "203.0.113.10" };

describe("InMemoryCredentialRateLimiter", () => {
  it("locks repeated failures for one email/IP pair and reports a retry window", () => {
    const limiter = new InMemoryCredentialRateLimiter({ maxFailures: 3, windowMs: 60_000, lockoutMs: 30_000 });

    limiter.recordFailure(alice);
    limiter.recordFailure(alice);
    limiter.recordFailure(alice);

    expect(limiter.check(alice)).toEqual({ allowed: false, retryAfter: 30 });
  });

  it("clears an expired lockout and its failure count", () => {
    vi.useFakeTimers();
    const limiter = new InMemoryCredentialRateLimiter({ maxFailures: 2, windowMs: 60_000, lockoutMs: 30_000 });
    limiter.recordFailure(alice);
    limiter.recordFailure(alice);

    vi.advanceTimersByTime(30_001);

    expect(limiter.check(alice)).toEqual({ allowed: true });
    limiter.recordFailure(alice);
    expect(limiter.check(alice)).toEqual({ allowed: true });
    vi.useRealTimers();
  });

  it("resets failures after a successful authentication", () => {
    const limiter = new InMemoryCredentialRateLimiter({ maxFailures: 2, windowMs: 60_000, lockoutMs: 30_000 });
    limiter.recordFailure(alice);
    limiter.reset(alice);
    limiter.recordFailure(alice);

    expect(limiter.check(alice)).toEqual({ allowed: true });
  });

  it("keeps distinct email/IP identities independent", () => {
    const limiter = new InMemoryCredentialRateLimiter({ maxFailures: 2, windowMs: 60_000, lockoutMs: 30_000 });
    limiter.recordFailure(alice);
    limiter.recordFailure(alice);

    expect(limiter.check({ email: "bob@example.com", ip: alice.ip })).toEqual({ allowed: true });
    expect(limiter.check({ email: alice.email, ip: "203.0.113.11" })).toEqual({ allowed: true });
  });
});
