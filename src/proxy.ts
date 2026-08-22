import { auth } from "@/lib/auth";

export async function proxy(request: Request) {
  const session = await auth();
  const { pathname } = new URL(request.url);

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
