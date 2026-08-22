import { describe, it, expect, vi, beforeEach } from "vitest";

const prismaMock = vi.hoisted(() => ({
  lead: { findFirst: vi.fn(), update: vi.fn(), create: vi.fn() },
  leadActivity: { create: vi.fn() },
  user: { findFirst: vi.fn() },
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import { recalcularClasificacion, crearLeadConClasificacion, type LeadInput } from "@/lib/classification";

function input(overrides: Partial<LeadInput> = {}): LeadInput {
  return {
    nombre: "Juan Pérez",
    telefono: "5512345678",
    correo: "juan@example.com",
    edad: 45,
    ciudad: "Ciudad Juárez",
    yaEstaPensionado: "no",
    temaInteres: "Ley 73",
    tieneSemanasCotizadas: "si",
    fuente: "Google",
    objetivoPrincipal: "Saber cuánto podría recibir",
    situacion: "Quiero saber si me conviene la modalidad 40 para mi pensión.",
    ...overrides,
  };
}

describe("recalcularClasificacion (D14 — duplicate refresh)", () => {
  it("recomputes categoria/prioridad/viabilidad from the FRESH input, not the stored one", () => {
    const result = recalcularClasificacion(
      input({
        yaEstaPensionado: "si",
        temaInteres: "pensión",
        situacion: "mi pensión está baja y no me alcanza, necesito ayuda urgente",
      })
    );

    expect(result.categoria).toBe("Pensión baja Ley 73 probable");
    expect(result.prioridad).toBe("Alta");
    expect(result.viabilidad).toBe("Recomendar diagnóstico");
  });

  it("recomputes segmentoInteres and the score pair from the fresh input", () => {
    const result = recalcularClasificacion(
      input({
        objetivoPrincipal: "No estoy seguro",
        tieneSemanasCotizadas: "no",
        situacion: "corto",
      })
    );

    expect(result.segmentoInteres).toBe("C");
    expect(typeof result.score).toBe("number");
    expect(typeof result.etiqueta).toBe("string");
  });

  it("reflects a full swing: invalidez resubmission beats the stored Ley-73 classification", () => {
    const result = recalcularClasificacion(
      input({
        yaEstaPensionado: "no",
        temaInteres: "otro tema",
        situacion: "tengo invalidez desde hace tres años",
      })
    );

    expect(result.categoria).toBe("Invalidez");
    expect(result.prioridad).toBe("Alta");
  });
});

describe("crearLeadConClasificacion duplicate path — stores refreshed classification", () => {
  beforeEach(() => {
    prismaMock.lead.findFirst.mockReset();
    prismaMock.lead.update.mockReset();
    prismaMock.leadActivity.create.mockReset();
    prismaMock.lead.findFirst.mockResolvedValue({
      id: "lead-1",
      categoria: "Ley 73",
      prioridad: "Media",
      viabilidad: "Recomendar diagnóstico",
      segmentoInteres: "A",
      scoreViabilidad: 40,
      etiquetaViabilidad: "Revisar",
      vecesRecibido: 1,
    });
    prismaMock.lead.update.mockResolvedValue({ id: "lead-1", vecesRecibido: 2 });
    prismaMock.leadActivity.create.mockResolvedValue({});
  });

  it("updates the existing lead with the newly computed classification fields", async () => {
    await crearLeadConClasificacion(
      input({
        edad: 61,
        yaEstaPensionado: "no",
        temaInteres: "otro tema",
        objetivoPrincipal: "No estoy seguro",
        tieneSemanasCotizadas: "no",
        situacion: "tengo invalidez desde hace tres años",
      }),
      { enviarNotificacion: false }
    );

    expect(prismaMock.lead.update).toHaveBeenCalledTimes(1);
    const data = prismaMock.lead.update.mock.calls[0][0].data;
    expect(data.categoria).toBe("Invalidez");
    expect(data.prioridad).toBe("Alta");
    expect(data.segmentoInteres).toBe("C");
    // The duplicate policy makes this form the source of truth for every fact
    // that the duplicate classification and later manual re-score consume.
    expect(data.edad).toBe(61);
    expect(data.yaEstaPensionado).toBe("no");
    expect(data.temaInteres).toBe("otro tema");
    expect(data.tieneSemanasCotizadas).toBe("no");
    expect(data.objetivoPrincipal).toBe("No estoy seguro");
    expect(data.situacion).toBe("tengo invalidez desde hace tres años");
    expect(data.scoreViabilidad).toBe(10);
    expect(data.etiquetaViabilidad).toBe("Baja viabilidad");
  });

  it("clears optional classification facts with the duplicate-derived fields", async () => {
    await crearLeadConClasificacion(
      input({
        tieneSemanasCotizadas: undefined,
        objetivoPrincipal: undefined,
      }),
      { enviarNotificacion: false }
    );

    const data = prismaMock.lead.update.mock.calls[0][0].data;
    expect(data.tieneSemanasCotizadas).toBeNull();
    expect(data.objetivoPrincipal).toBeNull();
  });

  it("keeps incrementing vecesRecibido on resubmission", async () => {
    await crearLeadConClasificacion(
      input(),
      { enviarNotificacion: false }
    );

    expect(prismaMock.lead.update.mock.calls[0][0].data.vecesRecibido).toEqual({ increment: 1 });
  });
});
