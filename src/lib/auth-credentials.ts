import { getTrustedRequestIp } from "@/lib/request-ip";
import { credentialLoginRateLimiter, type CredentialRateLimiter } from "@/lib/rate-limit";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";

type AuthUser = { id: string; email: string; name: string | null; role: string; password: string; active: boolean };
type Dependencies = {
  limiter: CredentialRateLimiter;
  findUser: (email: string) => Promise<AuthUser | null>;
  comparePassword: (password: string, hash: string) => Promise<boolean>;
};

const dependencies: Dependencies = {
  limiter: credentialLoginRateLimiter,
  findUser: (email) => prisma.user.findUnique({ where: { email } }),
  comparePassword: compare,
};

export async function authorizeCredentials(
  credentials: Partial<Record<"email" | "password", unknown>>,
  request: Request,
  overrides: Dependencies = dependencies,
) {
  if (typeof credentials.email !== "string" || typeof credentials.password !== "string") return null;

  const identity = { email: credentials.email, ip: getTrustedRequestIp(request.headers) };
  if (!overrides.limiter.check(identity).allowed) return null;

  const user = await overrides.findUser(credentials.email);
  if (!user || !user.active || !await overrides.comparePassword(credentials.password, user.password)) {
    overrides.limiter.recordFailure(identity);
    return null;
  }

  overrides.limiter.reset(identity);
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
