import { describe, expect, it, vi } from "vitest";
import { IMPORT_BATCH_SIZE, MAX_IMPORT_ROWS, importLeadsInBatches } from "@/lib/lead-import";

const input = (telefono: string, correo?: string) => ({
  nombre: `Lead ${telefono}`,
  telefono,
  correo,
  edad: 62,
  ciudad: "Ciudad Juárez",
  yaEstaPensionado: "no",
  temaInteres: "Ley 73",
  tieneSemanasCotizadas: "si",
  situacion: "Necesito conocer mis opciones de pensión IMSS.",
});

describe("importLeadsInBatches", () => {
  it("rejects files over the maximum accepted row count before database work", async () => {
    const db = {
      lead: { findMany: vi.fn(), createMany: vi.fn() },
      user: { findFirst: vi.fn() },
    };

    await expect(importLeadsInBatches(
      Array.from({ length: 1001 }, (_, index) => input(`55${index}`)),
      db,
    )).rejects.toThrow("Import supports at most 1000 rows");
    expect(db.user.findFirst).not.toHaveBeenCalled();
  });

  it("accepts at most 1,000 rows and creates new leads in bounded batches", async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 3 });
    const db = {
      lead: {
        findMany: vi.fn().mockResolvedValue([]),
        createMany,
      },
      user: { findFirst: vi.fn().mockResolvedValue({ id: "admin-1" }) },
    };

    const result = await importLeadsInBatches([
      input("5511111111"), input("5522222222"), input("5533333333"),
    ], db, { batchSize: 2, concurrency: 1 });

    expect(MAX_IMPORT_ROWS).toBe(1000);
    expect(IMPORT_BATCH_SIZE).toBeGreaterThan(0);
    expect(result).toEqual({ creados: 3, duplicados: 0 });
    expect(db.lead.findMany).toHaveBeenCalledTimes(2);
    expect(createMany).toHaveBeenCalledTimes(2);
    expect(createMany.mock.calls.map(([arg]) => arg.data).flat()).toHaveLength(3);
  });

  it("progresses through batches while skipping prefetched duplicates", async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 1 });
    const db = {
      lead: {
        findMany: vi.fn()
          .mockResolvedValueOnce([{ id: "existing", telefonoNormalizado: "5511111111", telefono: "5511111111", correo: null }])
          .mockResolvedValueOnce([]),
        createMany,
      },
      user: { findFirst: vi.fn().mockResolvedValue({ id: "admin-1" }) },
    };

    const result = await importLeadsInBatches([
      input("5511111111"), input("5522222222"), input("5533333333"),
    ], db, { batchSize: 2, concurrency: 1 });

    expect(result).toEqual({ creados: 2, duplicados: 1 });
    expect(createMany.mock.calls.map(([arg]) => arg.data).flat().map((lead: { telefono: string }) => lead.telefono))
      .toEqual(["5522222222", "5533333333"]);
  });
});
