import { describe, expect, it, vi } from "vitest";
import {
  type DashboardStatsClient,
  getAverageFirstContactMinutes,
  getSourceStats,
} from "@/lib/dashboard-stats";

describe("dashboard SQL aggregations", () => {
  it("calculates the average first-contact delay inside PostgreSQL", async () => {
    const queryRawUnsafe = vi.fn().mockResolvedValue([{ averageMinutes: 95.6 }]);
    const client = {
      $queryRawUnsafe: queryRawUnsafe,
      lead: { groupBy: vi.fn() },
      leadActivity: {},
    };

    const result = await getAverageFirstContactMinutes(client as unknown as DashboardStatsClient, "postgresql");

    expect(result).toBe(96);
    expect(queryRawUnsafe).toHaveBeenCalledWith(expect.stringContaining("MIN(la.\"createdAt\")"));
    expect(queryRawUnsafe.mock.calls[0][0]).toContain("AVG(EXTRACT(EPOCH");
    expect(queryRawUnsafe.mock.calls[0][0]).toContain("INNER JOIN \"Lead\"");
  });

  it("uses SQLite-compatible date math and returns no value when no contacts exist", async () => {
    const queryRawUnsafe = vi.fn().mockResolvedValue([{ averageMinutes: null }]);
    const client = {
      $queryRawUnsafe: queryRawUnsafe,
      lead: { groupBy: vi.fn() },
      leadActivity: {},
    };

    const result = await getAverageFirstContactMinutes(client as unknown as DashboardStatsClient, "sqlite");

    expect(result).toBeNull();
    expect(queryRawUnsafe.mock.calls[0][0]).toContain("julianday");
    expect(queryRawUnsafe.mock.calls[0][0]).toContain("GROUP BY la.\"leadId\"");
  });

  it("builds source metrics from bounded database groups instead of lead reads", async () => {
    const groupBy = vi.fn().mockResolvedValue([
      { fuente: "referido", prioridad: "Alta", _count: { id: 2 } },
      { fuente: "referido", prioridad: "Media", _count: { id: 1 } },
      { fuente: "facebook", prioridad: "Baja", _count: { id: 4 } },
    ]);
    const client = {
      $queryRawUnsafe: vi.fn(),
      lead: { groupBy },
      leadActivity: {},
    };

    const result = await getSourceStats(client as unknown as DashboardStatsClient);

    expect(result).toEqual([
      { fuente: "facebook", total: 4, alta: 0, pctAlta: 0 },
      { fuente: "referido", total: 3, alta: 2, pctAlta: 67 },
    ]);
    expect(groupBy).toHaveBeenCalledWith({
      by: ["fuente", "prioridad"],
      where: { fuente: { not: null } },
      _count: { id: true },
    });
    expect("findMany" in client.lead).toBe(false);
    expect("findMany" in client.leadActivity).toBe(false);
  });
});
