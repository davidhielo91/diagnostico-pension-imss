import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import * as XLSX from "xlsx";

const importLeadsInBatches = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({ auth: vi.fn().mockResolvedValue({ user: { id: "user-1" } }) }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/lead-import", () => ({
  MAX_IMPORT_ROWS: 1000,
  importLeadsInBatches,
}));

import { POST } from "@/app/api/leads/import/route";

const validRow = {
  nombre: "María López",
  telefono: "5512345678",
  edad: 61,
  ciudad: "Monterrey",
  pensionado: "no",
  tema: "Ley 73",
  semanas: "si",
  fuente: "Google",
  objetivo: "Saber si ya me puedo pensionar",
  situacion: "Quiero revisar si puedo pensionarme este año.",
};

function request(rows: Record<string, unknown>[]) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
  const file = new File([XLSX.write(workbook, { type: "array", bookType: "xlsx" })], "leads.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const formData = new FormData();
  formData.set("file", file);
  return new NextRequest("https://example.com/api/leads/import", { method: "POST", body: formData });
}

describe("POST /api/leads/import — row validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    importLeadsInBatches.mockImplementation(async (inputs: unknown[]) => ({ creados: inputs.length, duplicados: 0 }));
  });

  it.each(["nombre", "telefono", "edad", "ciudad", "pensionado", "tema", "situacion"])
  ("rejects a blank required %s value without importing the row", async (field) => {
    const response = await POST(request([{ ...validRow, [field]: "   " }]));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ procesados: 1, creados: 0, errores: 1 });
    expect(body.detalleErrores).toEqual([{ fila: 2, error: expect.stringContaining("required") }]);
    expect(importLeadsInBatches).toHaveBeenCalledWith([], expect.anything());
  });

  it.each([
    ["pensionado", "maybe", "yaEstaPensionado"],
    ["tema", "Unrecognized topic", "temaInteres"],
    ["semanas", "maybe", "tieneSemanasCotizadas"],
    ["fuente", "Unrecognized source", "fuente"],
    ["objetivo", "Unrecognized objective", "objetivoPrincipal"],
  ])("rejects invalid categorical %s values without exposing the value", async (field, value, label) => {
    const response = await POST(request([{ ...validRow, [field]: value }]));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.detalleErrores).toEqual([{ fila: 2, error: expect.stringContaining(label) }]);
    expect(body.detalleErrores[0].error).not.toContain(value);
    expect(importLeadsInBatches).toHaveBeenCalledWith([], expect.anything());
  });

  it("imports a valid row with canonical categorical values", async () => {
    const response = await POST(request([validRow]));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ procesados: 1, creados: 1, duplicados: 0, errores: 0 });
    expect(importLeadsInBatches).toHaveBeenCalledWith([
      expect.objectContaining({ temaInteres: "Ley 73", fuente: "Google", objetivoPrincipal: "Saber si ya me puedo pensionar" }),
    ], expect.anything());
  });
});
