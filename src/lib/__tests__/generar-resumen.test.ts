import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "u1" } }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    lead: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/ai", () => ({
  generarResumenConIA: vi.fn(),
}));

import { POST, formatearErrorResumen } from "@/app/api/leads/[id]/generar-resumen/route";
import { prisma } from "@/lib/prisma";
import { generarResumenConIA } from "@/lib/ai";

const { auth } = await import("@/lib/auth");

const leadEncontrado = {
  id: "lead-1",
  nombre: "Juan",
  edad: 45,
  ciudad: "Cd. Juárez",
  temaInteres: "Ley 73",
  situacion: "Quiero revisar mi pensión.",
  categoria: "Ley 73",
  prioridad: "Media",
  viabilidad: "Recomendar diagnóstico",
  scoreViabilidad: 50,
  yaEstaPensionado: "no",
  objetivoPrincipal: "Saber cuánto podría recibir",
};

beforeEach(() => {
  process.env.MISTRAL_API_KEY = "test-key";
  (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: "u1" } });
  (prisma.lead.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(leadEncontrado);
  (prisma.lead.update as ReturnType<typeof vi.fn>).mockResolvedValue({ ...leadEncontrado, resumenIA: "x" });
});

afterEach(() => {
  delete process.env.MISTRAL_API_KEY;
  vi.restoreAllMocks();
});

function req(): NextRequest {
  return new NextRequest("https://example.com/api/leads/lead-1/generar-resumen", { method: "POST" });
}

describe("formatearErrorResumen (pure error mapper)", () => {
  it("returns a generic client message that never contains the raw error", () => {
    const msg = formatearErrorResumen(new Error("Mistral API error: 401 - invalid api key"));
    expect(msg).toBe("No pudimos generar el resumen. Inténtalo de nuevo.");
    expect(msg).not.toContain("Mistral");
    expect(msg).not.toContain("401");
  });

  it("handles non-Error throws and logs the detail server-side", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const msg = formatearErrorResumen("string explosion");
    expect(msg).toBe("No pudimos generar el resumen. Inténtalo de nuevo.");
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("string explosion"));
    errorSpy.mockRestore();
  });
});

describe("POST /api/leads/[id]/generar-resumen — no internal error leakage", () => {
  it("returns 500 with a generic message when the AI call fails (spec scenario)", async () => {
    (generarResumenConIA as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Mistral API error: 500 - upstream crashed with stack trace")
    );
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await POST(req(), { params: Promise.resolve({ id: "lead-1" }) });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("No pudimos generar el resumen. Inténtalo de nuevo.");
    expect(body.error).not.toContain("Mistral");
    expect(body.error).not.toContain("stack trace");
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Mistral API error"));
    errorSpy.mockRestore();
  });

  it("still returns 200 with the resumen when the AI call succeeds", async () => {
    (generarResumenConIA as ReturnType<typeof vi.fn>).mockResolvedValue("Resumen limpio.");
    const res = await POST(req(), { params: Promise.resolve({ id: "lead-1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.resumen).toBe("Resumen limpio.");
  });

  it("returns 404 when the lead does not exist", async () => {
    (prisma.lead.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await POST(req(), { params: Promise.resolve({ id: "no-existe" }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Lead no encontrado");
  });
});