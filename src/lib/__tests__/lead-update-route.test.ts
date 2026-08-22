import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const prismaMock = vi.hoisted(() => ({
  lead: { findUnique: vi.fn(), update: vi.fn() },
  user: { findUnique: vi.fn() },
  leadStatusHistory: { create: vi.fn() },
  leadActivity: { create: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn().mockResolvedValue({ user: { id: "user-1" } }) }));

import { PATCH } from "@/app/api/leads/[id]/update/route";

const routeParams = { params: Promise.resolve({ id: "lead-1" }) };

function request(body: Record<string, unknown>) {
  return new NextRequest("https://example.com/api/leads/lead-1/update", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation(async (callback) => callback({
    lead: prismaMock.lead,
    leadStatusHistory: prismaMock.leadStatusHistory,
    leadActivity: prismaMock.leadActivity,
  }));
  prismaMock.lead.findUnique.mockResolvedValue({
    id: "lead-1",
    categoria: "Ley 73",
    prioridad: "Media",
    viabilidad: "Recomendar diagnóstico",
    estadoLead: "Nuevo",
  });
});

describe("PATCH /api/leads/[id]/update — categorical validation", () => {
  it.each([
    ["categoria", "Arbitrary category"],
    ["prioridad", "Urgente"],
    ["viabilidad", "Tal vez"],
    ["estadoLead", "Eliminado"],
    ["segmentoInteres", "D"],
  ])("rejects an invalid %s value before persisting", async (field, value) => {
    const response = await PATCH(request({ [field]: value }), routeParams);

    expect(response.status).toBe(400);
    expect(prismaMock.lead.update).not.toHaveBeenCalled();
  });

  it("keeps valid categorical updates working", async () => {
    const response = await PATCH(request({ estadoLead: "Contactado" }), routeParams);

    expect(response.status).toBe(200);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.lead.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ estadoLead: "Contactado" }),
    }));
    expect(prismaMock.leadStatusHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ estadoAnterior: "Nuevo", estadoNuevo: "Contactado" }),
    });
    expect(prismaMock.leadActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tipo: "estado_cambiado", nota: "Nuevo → Contactado" }),
    });
  });

  it("rolls back a status change when its activity write fails", async () => {
    const committed: string[] = [];
    const staged: string[] = [];
    const transaction = {
      lead: { update: vi.fn().mockImplementation(async () => staged.push("lead")) },
      leadStatusHistory: { create: vi.fn().mockImplementation(async () => staged.push("history")) },
      leadActivity: { create: vi.fn().mockRejectedValue(new Error("activity write failed")) },
    };
    prismaMock.$transaction.mockImplementation(async (callback) => {
      try {
        await callback(transaction);
        committed.push(...staged);
      } catch (error) {
        staged.length = 0;
        throw error;
      }
    });

    await expect(PATCH(request({ estadoLead: "Contactado" }), routeParams)).rejects.toThrow("activity write failed");

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.lead.update).toHaveBeenCalledTimes(1);
    expect(transaction.leadStatusHistory.create).toHaveBeenCalledTimes(1);
    expect(committed).toEqual([]);
    expect(prismaMock.lead.update).not.toHaveBeenCalled();
    expect(prismaMock.leadStatusHistory.create).not.toHaveBeenCalled();
    expect(prismaMock.leadActivity.create).not.toHaveBeenCalled();
  });

  it("keeps clearing an interest segment working", async () => {
    const response = await PATCH(request({ segmentoInteres: "" }), routeParams);

    expect(response.status).toBe(200);
    expect(prismaMock.lead.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ segmentoInteres: "" }),
    }));
  });

  it("re-scores a manual category from the persisted duplicate submission facts", async () => {
    prismaMock.lead.findUnique.mockResolvedValue({
      id: "lead-1",
      nombre: "Juan Pérez",
      telefono: "5512345678",
      correo: "juan@example.com",
      edad: 61,
      ciudad: "Ciudad Juárez",
      estado: null,
      yaEstaPensionado: "no",
      temaInteres: "otro tema",
      tieneSemanasCotizadas: "no",
      fuente: "Google",
      objetivoPrincipal: "No estoy seguro",
      situacion: "tengo invalidez desde hace tres años",
      categoria: "Invalidez",
      prioridad: "Alta",
      viabilidad: "Recomendar diagnóstico",
      estadoLead: "Nuevo",
    });

    const response = await PATCH(request({ categoria: "Ley 73" }), routeParams);

    expect(response.status).toBe(200);
    expect(prismaMock.lead.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        categoria: "Ley 73",
        scoreViabilidad: 40,
        etiquetaViabilidad: "Revisar",
      }),
    }));
  });

  it.each([null, { id: "inactive-user", active: false }])("rejects assignment to a missing or inactive user", async (user) => {
    prismaMock.user.findUnique.mockResolvedValue(user);

    const response = await PATCH(request({ userId: "missing-user" }), routeParams);

    expect(response.status).toBe(400);
    expect(prismaMock.lead.update).not.toHaveBeenCalled();
  });
});
