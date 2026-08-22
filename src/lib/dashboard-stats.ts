import type { PrismaClient } from "@prisma/client";

type DatabaseProvider = "postgresql" | "sqlite";

export type DashboardStatsClient = Pick<PrismaClient, "$queryRawUnsafe"> & {
  lead: Pick<PrismaClient["lead"], "groupBy">;
};

export type SourceStats = {
  fuente: string;
  total: number;
  alta: number;
  pctAlta: number;
};

const FIRST_CONTACT_TYPES = "'whatsapp_enviado', 'correo_enviado'";

const POSTGRES_FIRST_CONTACT_QUERY = `
  SELECT AVG(EXTRACT(EPOCH FROM ("firstContactAt" - "leadCreatedAt")) / 60) AS "averageMinutes"
  FROM (
    SELECT la."leadId", MIN(la."createdAt") AS "firstContactAt", l."createdAt" AS "leadCreatedAt"
    FROM "LeadActivity" AS la
    INNER JOIN "Lead" AS l ON l."id" = la."leadId"
    WHERE la."tipo" IN (${FIRST_CONTACT_TYPES})
    GROUP BY la."leadId", l."createdAt"
  ) AS first_contacts
`;

const SQLITE_FIRST_CONTACT_QUERY = `
  SELECT AVG((julianday("firstContactAt") - julianday("leadCreatedAt")) * 1440) AS "averageMinutes"
  FROM (
    SELECT la."leadId", MIN(la."createdAt") AS "firstContactAt", l."createdAt" AS "leadCreatedAt"
    FROM "LeadActivity" AS la
    INNER JOIN "Lead" AS l ON l."id" = la."leadId"
    WHERE la."tipo" IN (${FIRST_CONTACT_TYPES})
    GROUP BY la."leadId", l."createdAt"
  ) AS first_contacts
`;

function getDatabaseProvider(): DatabaseProvider {
  return process.env.DATABASE_URL?.startsWith("file:") ? "sqlite" : "postgresql";
}

export async function getAverageFirstContactMinutes(
  client: DashboardStatsClient,
  provider = getDatabaseProvider(),
): Promise<number | null> {
  const query = provider === "sqlite" ? SQLITE_FIRST_CONTACT_QUERY : POSTGRES_FIRST_CONTACT_QUERY;
  const [result] = await client.$queryRawUnsafe<Array<{ averageMinutes: number | string | null }>>(query);
  const averageMinutes = result?.averageMinutes;

  return averageMinutes === null || averageMinutes === undefined
    ? null
    : Math.round(Number(averageMinutes));
}

export async function getSourceStats(client: DashboardStatsClient): Promise<SourceStats[]> {
  const sourceGroups = await client.lead.groupBy({
    by: ["fuente", "prioridad"],
    where: { fuente: { not: null } },
    _count: { id: true },
  });

  const sourceMap = new Map<string, { total: number; alta: number }>();
  for (const group of sourceGroups) {
    if (!group.fuente) continue;
    const source = sourceMap.get(group.fuente) ?? { total: 0, alta: 0 };
    source.total += group._count.id;
    if (group.prioridad === "Alta") source.alta += group._count.id;
    sourceMap.set(group.fuente, source);
  }

  return [...sourceMap.entries()]
    .map(([fuente, source]) => ({
      fuente,
      ...source,
      pctAlta: source.total > 0 ? Math.round((source.alta / source.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}
