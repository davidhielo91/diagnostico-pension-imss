import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/classification", () => ({
  crearLeadConClasificacion: vi.fn(),
}));

vi.mock("@/lib/push", () => ({
  enviarPushNotificacion: vi.fn(),
}));

import { POST } from "@/app/api/public/leads/route";
import { crearLeadConClasificacion } from "@/lib/classification";
import { enviarPushNotificacion } from "@/lib/push";

const validLead = {
  nombre: "María López",
  telefono: "5512345678",
  correo: "maria@example.com",
  edad: 61,
  ciudad: "Monterrey",
  yaEstaPensionado: "no",
  temaInteres: "Ley 73",
  situacion: "Quiero revisar si puedo pensionarme este año.",
};

const compatibilityTopics = [
  "Ya estoy pensionado / Pensión baja",
  "Otro",
  "Saber cuánto me tocaría de pensión",
  "Ya estoy pensionado",
  "Semanas cotizadas",
  "Saber cuánto le tocaría",
  "AFORE",
  "Conservación de derechos",
];

function request(body: Record<string, unknown>, headers: HeadersInit = {}) {
  return new NextRequest("https://example.com/api/public/leads", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("POST /api/public/leads — public form protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(crearLeadConClasificacion).mockResolvedValue({
      lead: { id: "lead-1", nombre: "María López", prioridad: "Media", temaInteres: "Ley 73", ciudad: "Monterrey" },
      esDuplicado: false,
    } as never);
    vi.mocked(enviarPushNotificacion).mockResolvedValue(undefined);
  });

  it("accepts a legitimate submission and creates its lead", async () => {
    const response = await POST(request(validLead, { "x-real-ip": "203.0.113.24" }));

    expect(response.status).toBe(201);
    expect(vi.mocked(crearLeadConClasificacion)).toHaveBeenCalledWith(expect.objectContaining({
      nombre: "María López",
      edad: 61,
    }));
  });

  it.each(compatibilityTopics.map((temaInteres, index) => [temaInteres, index]))("accepts the canonical topic %s", async (temaInteres, index) => {
    const response = await POST(request({ ...validLead, temaInteres }, { "x-real-ip": `203.0.113.${100 + index}` }));

    expect(response.status).toBe(201);
    expect(vi.mocked(crearLeadConClasificacion)).toHaveBeenCalledWith(expect.objectContaining({ temaInteres }));
  });

  it.each(["no_seguro", "no_se"].map((tieneSemanasCotizadas, index) => [tieneSemanasCotizadas, index]))("normalizes the public weeks alias %s", async (tieneSemanasCotizadas, index) => {
    const response = await POST(request(
      { ...validLead, tieneSemanasCotizadas },
      { "x-real-ip": `203.0.113.${120 + index}` },
    ));

    expect(response.status).toBe(201);
    expect(vi.mocked(crearLeadConClasificacion)).toHaveBeenCalledWith(expect.objectContaining({
      tieneSemanasCotizadas: "no_sé",
    }));
  });

  it("rejects an unknown topic without creating a lead", async () => {
    const response = await POST(request(
      { ...validLead, temaInteres: "Unrecognized topic" },
      { "x-real-ip": "203.0.113.150" },
    ));

    expect(response.status).toBe(400);
    expect(vi.mocked(crearLeadConClasificacion)).not.toHaveBeenCalled();
  });

  it("silently drops a filled honeypot without creating a lead", async () => {
    const response = await POST(request({ ...validLead, website: "https://spam.example" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(vi.mocked(crearLeadConClasificacion)).not.toHaveBeenCalled();
  });

  it("rate-limits a real client even when each request forges a different forwarded chain", async () => {
    const responses = await Promise.all(
      Array.from({ length: 6 }, (_, index) => POST(request(validLead, {
        "x-real-ip": "203.0.113.77",
        "x-forwarded-for": `198.51.100.${index}, 203.0.113.77`,
      })))
    );

    expect(responses.map((response) => response.status)).toEqual([201, 201, 201, 201, 201, 429]);
  });
});
