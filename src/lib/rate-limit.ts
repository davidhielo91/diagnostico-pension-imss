export type CredentialIdentity = { email: string; ip: string };
export type RateLimitResult = { allowed: true } | { allowed: false; retryAfter: number };

export interface CredentialRateLimiter {
  check(identity: CredentialIdentity): RateLimitResult;
  recordFailure(identity: CredentialIdentity): void;
  reset(identity: CredentialIdentity): void;
}

type AttemptState = { failures: number[]; lockedUntil?: number };
type RateLimitOptions = { maxFailures?: number; windowMs?: number; lockoutMs?: number; now?: () => number };

export class InMemoryCredentialRateLimiter implements CredentialRateLimiter {
  private readonly attempts = new Map<string, AttemptState>();
  private readonly maxFailures: number;
  private readonly windowMs: number;
  private readonly lockoutMs: number;
  private readonly now: () => number;

  constructor({ maxFailures = 5, windowMs = 15 * 60_000, lockoutMs = 15 * 60_000, now = Date.now }: RateLimitOptions = {}) {
    this.maxFailures = maxFailures;
    this.windowMs = windowMs;
    this.lockoutMs = lockoutMs;
    this.now = now;
  }

  check(identity: CredentialIdentity): RateLimitResult {
    const key = this.key(identity);
    const state = this.attempts.get(key);
    if (!state) return { allowed: true };

    const now = this.now();
    if (state.lockedUntil && state.lockedUntil > now) {
      return { allowed: false, retryAfter: Math.ceil((state.lockedUntil - now) / 1000) };
    }
    if (state.lockedUntil || state.failures.every((failure) => failure <= now - this.windowMs)) {
      this.attempts.delete(key);
    }
    return { allowed: true };
  }

  recordFailure(identity: CredentialIdentity): void {
    if (!this.check(identity).allowed) return;

    const key = this.key(identity);
    const now = this.now();
    const state = this.attempts.get(key) ?? { failures: [] };
    state.failures = state.failures.filter((failure) => failure > now - this.windowMs);
    state.failures.push(now);
    if (state.failures.length >= this.maxFailures) state.lockedUntil = now + this.lockoutMs;
    this.attempts.set(key, state);
  }

  reset(identity: CredentialIdentity): void {
    this.attempts.delete(this.key(identity));
  }

  private key({ email, ip }: CredentialIdentity): string {
    return `${email.trim().toLowerCase()}\u0000${ip.trim()}`;
  }
}

export const credentialLoginRateLimiter = new InMemoryCredentialRateLimiter();
