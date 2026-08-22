import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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

function bodyJson() {
  return JSON.stringify({
    nombre: "Juan Pérez",
    telefono: "5512345678",
    correo: "juan@example.com",
    edad: 45,
    ciudad: "Ciudad Juárez",
    estado: "Chihuahua",
    yaEstaPensionado: "no",
    temaInteres: "Ley 73",
    objetivoPrincipal: "Saber cuánto podría recibir",
    tieneSemanasCotizadas: "si",
    fuente: "Google",
    situacion: "Quiero saber si puedo pensionarme.",
  });
}

describe("public/sw.js — stacked notification tag (D18)", () => {
  const sw = readFileSync(join(process.cwd(), "public", "sw.js"), "utf8");

  it("builds the notification tag from the payload id so leads stack instead of replacing", () => {
    expect(sw).toContain("nuevo-lead-");
    expect(sw).toContain("'nuevo-lead-' + data.id");
  });

  it("no longer uses the fixed single tag that replaced previous notifications", () => {
    expect(sw).not.toContain("tag: 'nuevo-lead'");
    expect(sw).not.toContain('tag: "nuevo-lead"');
  });

  it("keeps the id in the notification data for click routing", () => {
    expect(sw).toContain("data.id");
  });
});

describe("POST /api/public/leads — push payload carries the lead id", () => {
  beforeEach(() => {
    (crearLeadConClasificacion as ReturnType<typeof vi.fn>).mockReset();
    (enviarPushNotificacion as ReturnType<typeof vi.fn>).mockReset();
    (enviarPushNotificacion as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  it("sends a push payload with id when a new lead is created", async () => {
    (crearLeadConClasificacion as ReturnType<typeof vi.fn>).mockResolvedValue({
      lead: { id: "lead-abc", prioridad: "Alta", nombre: "Juan Pérez", temaInteres: "Ley 73", ciudad: "Cd. Juárez" },
      esDuplicado: false,
    });

    const res = await POST(
      new NextRequest("https://example.com/api/public/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: bodyJson(),
      })
    );

    expect(res.status).toBe(201);
    expect(enviarPushNotificacion).toHaveBeenCalledTimes(1);
    expect(enviarPushNotificacion).toHaveBeenCalledWith(
      expect.objectContaining({ id: "lead-abc", url: "/leads/lead-abc" })
    );
  });

  it("does NOT push when the submission was a duplicate", async () => {
    (crearLeadConClasificacion as ReturnType<typeof vi.fn>).mockResolvedValue({
      lead: { id: "lead-1", prioridad: "Media", nombre: "Juan", temaInteres: "Ley 73", ciudad: "X" },
      esDuplicado: true,
    });

    const res = await POST(
      new NextRequest("https://example.com/api/public/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: bodyJson(),
      })
    );

    expect(res.status).toBe(200);
    expect(enviarPushNotificacion).not.toHaveBeenCalled();
  });
});