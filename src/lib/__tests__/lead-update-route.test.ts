import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const prismaMock = vi.hoisted(() => ({
  lead: { findUnique: vi.fn(), update: vi.fn() },
  user: { findUnique: vi.fn() },
  leadStatusHistory: { create: vi.fn() },
  leadActivity: { create: vi.fn() },
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
    expect(prismaMock.lead.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ estadoLead: "Contactado" }),
    }));
  });

  it("keeps clearing an interest segment working", async () => {
    const response = await PATCH(request({ segmentoInteres: "" }), routeParams);

    expect(response.status).toBe(200);
    expect(prismaMock.lead.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ segmentoInteres: "" }),
    }));
  });

  it.each([null, { id: "inactive-user", active: false }])("rejects assignment to a missing or inactive user", async (user) => {
    prismaMock.user.findUnique.mockResolvedValue(user);

    const response = await PATCH(request({ userId: "missing-user" }), routeParams);

    expect(response.status).toBe(400);
    expect(prismaMock.lead.update).not.toHaveBeenCalled();
  });
});
