import { describe, it, expect } from "vitest";
import { debeEjecutarReset, decidirAccionAdmin } from "@/lib/seed-safety";

describe("debeEjecutarReset (RESET_ON_STARTUP staging gate)", () => {
  it("returns true ONLY when RESET_ON_STARTUP=true AND ALLOW_RESET_ON_STARTUP=true AND NODE_ENV=staging", () => {
    expect(
      debeEjecutarReset({
        RESET_ON_STARTUP: "true",
        ALLOW_RESET_ON_STARTUP: "true",
        NODE_ENV: "staging",
      })
    ).toBe(true);
  });

  it("refuses the reset in production even when RESET_ON_STARTUP=true (spec scenario)", () => {
    expect(
      debeEjecutarReset({
        RESET_ON_STARTUP: "true",
        ALLOW_RESET_ON_STARTUP: "true",
        NODE_ENV: "production",
      })
    ).toBe(false);
  });

  it("refuses the reset when the explicit staging flag is missing", () => {
    expect(
      debeEjecutarReset({
        RESET_ON_STARTUP: "true",
        NODE_ENV: "staging",
      })
    ).toBe(false);
  });

  it("refuses the reset when RESET_ON_STARTUP is not exactly 'true'", () => {
    expect(
      debeEjecutarReset({
        RESET_ON_STARTUP: "1",
        ALLOW_RESET_ON_STARTUP: "true",
        NODE_ENV: "staging",
      })
    ).toBe(false);
    expect(debeEjecutarReset({ NODE_ENV: "staging" })).toBe(false);
  });
});

describe("decidirAccionAdmin (seed admin safety)", () => {
  it("NEVER touches the password of an existing admin, even when ADMIN_PASSWORD is set", () => {
    expect(decidirAccionAdmin(true, "nueva-clave")).toEqual({ accion: "omitir" });
  });

  it("omits silently when an admin exists and ADMIN_PASSWORD is empty/unset", () => {
    expect(decidirAccionAdmin(true, "")).toEqual({ accion: "omitir" });
    expect(decidirAccionAdmin(true, undefined)).toEqual({ accion: "omitir" });
  });

  it("fails loudly on first boot when ADMIN_PASSWORD is empty", () => {
    expect(decidirAccionAdmin(false, "")).toEqual({ accion: "fallar" });
  });

  it("fails loudly on first boot when ADMIN_PASSWORD is unset", () => {
    expect(decidirAccionAdmin(false, undefined)).toEqual({ accion: "fallar" });
  });

  it("creates the admin with the exact password on first boot when it is provided", () => {
    expect(decidirAccionAdmin(false, "MiClaveSegura#2026")).toEqual({
      accion: "crear",
      password: "MiClaveSegura#2026",
    });
  });
});