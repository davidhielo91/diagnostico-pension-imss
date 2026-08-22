import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as XLSX from "xlsx";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "u1", email: "admin@test.com" } }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    lead: {
      findMany: vi.fn(),
    },
  },
}));

import { GET } from "@/app/api/leads/export/route";
import { prisma } from "@/lib/prisma";
import { buildLeadWhere } from "@/lib/lead-filters";

const { auth } = await import("@/lib/auth");

function lead(overrides: Record<string, unknown> = {}) {
  return {
    id: "lead-1",
    nombre: "Juan Pérez",
    telefono: "5512345678",
    correo: "juan@example.com",
    edad: 45,
    ciudad: "Ciudad Juárez",
    estado: "Chihuahua",
    yaEstaPensionado: "no",
    temaInteres: "Ley 73",
    tieneSemanasCotizadas: "si",
    fuente: "Google",
    objetivoPrincipal: "Saber cuánto podría recibir",
    situacion: "Quiero saber si puedo pensionarme.",
    categoria: "Ley 73",
    prioridad: "Media",
    viabilidad: "Recomendar diagnóstico",
    estadoLead: "Nuevo",
    asignadoA: { name: "Gerardo Huerta" },
    createdAt: new Date("2026-01-15T10:00:00Z"),
    fechaUltimoContacto: null,
    fechaProximaAccion: null,
    notasInternas: null,
    vecesRecibido: 1,
    ...overrides,
  };
}

beforeEach(() => {
  (auth as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: "u1" } });
});

afterEach(() => vi.useRealTimers());

describe("GET /api/leads/export — XLSX formula injection sanitization", () => {
  it("prefixes formula-prefixed user fields with an apostrophe in the exported sheet", async () => {
    (prisma.lead.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      lead({
        nombre: '=HYPERLINK("http://evil.example")',
        telefono: "+521234567890",
        ciudad: "@SUM(A1)",
        temaInteres: "-2+3",
        situacion: "\t=1+1",
      }),
    ]);

    const res = await GET(new NextRequest("https://example.com/api/leads/export"));
    expect(res.status).toBe(200);

    const buffer = Buffer.from(await res.arrayBuffer());
    const wb = XLSX.read(buffer);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

    expect(rows).toHaveLength(1);
    expect(rows[0].Nombre).toBe("'=HYPERLINK(\"http://evil.example\")");
    expect(rows[0].Ciudad).toBe("'@SUM(A1)");
    expect(rows[0]["Tema de interés"]).toBe("'-2+3");
    expect(rows[0].Situación).toBe("'\t=1+1");
  });

  it("leaves benign values readable and unmodified", async () => {
    (prisma.lead.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      lead({ nombre: "María López", ciudad: "Monterrey", temaInteres: "Ley 97", situacion: "Tengo 500 semanas." }),
    ]);

    const res = await GET(new NextRequest("https://example.com/api/leads/export"));
    const buffer = Buffer.from(await res.arrayBuffer());
    const wb = XLSX.read(buffer);
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]]);

    expect(rows[0].Nombre).toBe("María López");
    expect(rows[0].Ciudad).toBe("Monterrey");
    expect(rows[0].Situación).toBe("Tengo 500 semanas.");
  });

  it("limits each export page and exposes a cursor for the next page", async () => {
    (prisma.lead.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      Array.from({ length: 1000 }, (_, index) => lead({ id: `lead-${index}` }))
    );

    const res = await GET(new NextRequest("https://example.com/api/leads/export"));

    expect(prisma.lead.findMany).toHaveBeenCalledWith(expect.objectContaining({
      take: 1000,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }));
    expect(res.headers.get("X-Next-Cursor")).toBe("lead-999");
  });

  it("continues an export from the requested cursor", async () => {
    (prisma.lead.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      lead({ id: "lead-old" }),
    ]);

    await GET(new NextRequest("https://example.com/api/leads/export?cursor=lead-middle"));

    expect(prisma.lead.findMany).toHaveBeenCalledWith(expect.objectContaining({
      cursor: { id: "lead-middle" },
      skip: 1,
      take: 1000,
    }));
  });

  it("uses the same active-list filters as the leads screen", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-20T12:00:00Z"));
    (prisma.lead.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const filters = {
      prioridad: "Alta",
      fuente: "Google",
      segmento: "Regresaron",
      segmentoInteres: "A",
      sinContacto: "72",
      busqueda: "María",
    };

    await GET(new NextRequest(`https://example.com/api/leads/export?${new URLSearchParams(filters)}`));

    expect(prisma.lead.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: buildLeadWhere(filters, new Date("2026-03-20T12:00:00Z")),
    }));
  });

  it("uses the same archived-list filters as the leads screen", async () => {
    (prisma.lead.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const filters = {
      tab: "archivados",
      prioridad: "Baja",
      fuente: "Facebook",
      segmentoInteres: "B",
      busqueda: "Juan",
    };

    await GET(new NextRequest(`https://example.com/api/leads/export?${new URLSearchParams(filters)}`));

    expect(prisma.lead.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: buildLeadWhere(filters),
    }));
  });

  it("returns 401 when there is no session", async () => {
    (auth as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const res = await GET(new NextRequest("https://example.com/api/leads/export"));
    expect(res.status).toBe(401);
  });
});
