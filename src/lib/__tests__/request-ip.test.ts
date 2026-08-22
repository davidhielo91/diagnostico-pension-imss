import { describe, expect, it } from "vitest";
import { getTrustedRequestIp } from "@/lib/request-ip";

describe("getTrustedRequestIp", () => {
  it("uses the proxy-provided x-real-ip instead of a forged forwarded chain", () => {
    const headers = new Headers({
      "x-real-ip": "203.0.113.24",
      "x-forwarded-for": "198.51.100.99, 203.0.113.24",
    });

    expect(getTrustedRequestIp(headers)).toBe("203.0.113.24");
  });

  it("uses the last forwarded hop when the trusted proxy did not provide x-real-ip", () => {
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.99, 203.0.113.24",
    });

    expect(getTrustedRequestIp(headers)).toBe("203.0.113.24");
  });

  it("does not treat an empty forwarded hop as a client address", () => {
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.99, , 203.0.113.24, ",
    });

    expect(getTrustedRequestIp(headers)).toBe("203.0.113.24");
  });
});
