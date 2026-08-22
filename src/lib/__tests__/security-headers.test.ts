import { afterEach, describe, expect, it, vi } from "vitest";

type HeaderRule = {
  source: string;
  headers: Array<{ key: string; value: string }>;
  has?: Array<{ type: string; key: string; value?: string }>;
};

async function getHeaderRules(nodeEnv?: string): Promise<HeaderRule[]> {
  if (nodeEnv) {
    vi.stubEnv("NODE_ENV", nodeEnv);
  }

  vi.resetModules();
  const { default: nextConfig } = await import("../../../next.config");
  const headers = await nextConfig.headers?.();
  return (headers ?? []) as HeaderRule[];
}

describe("security response headers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("adds a CSP policy to all routes", async () => {
    const rules = await getHeaderRules();
    const defaultRule = rules.find((rule) => rule.source === "/(.*)");
    const csp = defaultRule?.headers.find(
      (header) => header.key === "Content-Security-Policy"
    );

    expect(csp?.value).toContain("default-src 'self'");
    expect(csp?.value).toContain("object-src 'none'");
    expect(csp?.value).toContain("frame-ancestors 'self'");
  });

  it("sends HSTS only for requests forwarded as HTTPS", async () => {
    const rules = await getHeaderRules();
    const hstsRule = rules.find((rule) =>
      rule.headers.some((header) => header.key === "Strict-Transport-Security")
    );

    expect(hstsRule?.headers).toContainEqual({
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    });
    expect(hstsRule?.has).toEqual([
      { type: "header", key: "x-forwarded-proto", value: "https" },
    ]);
  });

  it("allows unsafe eval only in development CSP", async () => {
    const developmentRules = await getHeaderRules("development");
    const productionRules = await getHeaderRules("production");
    const developmentCsp = developmentRules[0]?.headers.find(
      (header) => header.key === "Content-Security-Policy"
    );
    const productionCsp = productionRules[0]?.headers.find(
      (header) => header.key === "Content-Security-Policy"
    );

    expect(developmentCsp?.value).toContain("'unsafe-eval'");
    expect(productionCsp?.value).not.toContain("'unsafe-eval'");
  });
});
