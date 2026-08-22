const UNKNOWN_IP = "unknown";

function lastForwardedAddress(value: string | null): string | null {
  if (!value) return null;

  const addresses = value.split(",").map((address) => address.trim()).filter(Boolean);
  return addresses.at(-1) ?? null;
}

/**
 * EasyPanel's reverse proxy supplies x-real-ip. When that header is absent,
 * its appended final x-forwarded-for address is the only trusted fallback.
 */
export function getTrustedRequestIp(headers: Headers): string {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return lastForwardedAddress(headers.get("x-forwarded-for")) ?? UNKNOWN_IP;
}
