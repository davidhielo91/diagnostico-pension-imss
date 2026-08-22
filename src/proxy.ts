import { auth } from "@/lib/auth";
import { getTrustedRequestIp } from "@/lib/request-ip";
import { credentialLoginRateLimiter } from "@/lib/rate-limit";

const LOGIN_CALLBACK_PATH = "/api/auth/callback/credentials";
const GENERIC_LOCKOUT_MESSAGE = "Unable to sign in. Please try again later.";

async function getLoginIdentity(request: Request) {
  try {
    const email = (await request.clone().formData()).get("email");
    if (typeof email !== "string" || !email) return null;
    return { email, ip: getTrustedRequestIp(request.headers) };
  } catch {
    return null;
  }
}

export async function proxy(request: Request) {
  const { pathname } = new URL(request.url);
  if (request.method === "POST" && pathname === LOGIN_CALLBACK_PATH) {
    const identity = await getLoginIdentity(request);
    if (identity) {
      const result = credentialLoginRateLimiter.check(identity);
      if (!result.allowed) {
        return Response.json({ error: GENERIC_LOCKOUT_MESSAGE }, {
          status: 429,
          headers: { "Retry-After": String(result.retryAfter) },
        });
      }
    }
  }

  const session = await auth();

  const isPublic =
    pathname === "/" ||
    pathname === "/gracias" ||
    pathname === "/aviso-de-privacidad" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/public");

  if (!isPublic && !session) {
    return Response.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/login") && session) {
    return Response.redirect(new URL("/dashboard", request.url));
  }

  return undefined;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|images/|sw.js).*)"],
};
