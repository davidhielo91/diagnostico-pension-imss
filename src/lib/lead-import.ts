import { clasificarLead, clasificarSegmentoInteres, calcularScoreViabilidad, normalizarTelefono, type LeadInput } from "@/lib/classification";

export const MAX_IMPORT_ROWS = 1000;
export const IMPORT_BATCH_SIZE = 100;
export const IMPORT_CONCURRENCY = 2;

type ExistingLead = {
  telefonoNormalizado: string | null;
  telefono: string;
  correo: string | null;
};

export type LeadImportClient = {
  lead: {
    findMany: (args: unknown) => Promise<ExistingLead[]>;
    createMany: (args: { data: Record<string, unknown>[] }) => Promise<unknown>;
  };
  user: {
    findFirst: (args: unknown) => Promise<{ id: string } | null>;
  };
};

type ImportOptions = {
  batchSize?: number;
  concurrency?: number;
};

function chunk<T>(items: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size)
  );
}

function emailKey(correo?: string): string | null {
  return correo?.toLowerCase().trim() || null;
}

function duplicateKeys(input: LeadInput): string[] {
  const keys = [`phone:${input.telefono}`, `normalized:${normalizarTelefono(input.telefono)}`];
  const correo = emailKey(input.correo);
  if (correo) keys.push(`email:${correo}`);
  return keys;
}

function toCreateData(input: LeadInput, userId: string | null): Record<string, unknown> {
  const clasificacion = clasificarLead(input);
  const score = calcularScoreViabilidad(input, clasificacion.categoria);

  return {
    nombre: input.nombre,
    telefono: input.telefono,
    correo: emailKey(input.correo),
    edad: input.edad,
    ciudad: input.ciudad,
    estado: input.estado || null,
    yaEstaPensionado: input.yaEstaPensionado,
    temaInteres: input.temaInteres,
    tieneSemanasCotizadas: input.tieneSemanasCotizadas || null,
    fuente: input.fuente || null,
    objetivoPrincipal: input.objetivoPrincipal || null,
    situacion: input.situacion,
    categoria: clasificacion.categoria,
    prioridad: clasificacion.prioridad,
    viabilidad: clasificacion.viabilidad,
    estadoLead: "Nuevo",
    telefonoNormalizado: normalizarTelefono(input.telefono),
    vecesRecibido: 1,
    scoreViabilidad: score.score,
    etiquetaViabilidad: score.etiqueta,
    segmentoInteres: clasificarSegmentoInteres(input),
    userId,
    ...(input.createdAt ? { createdAt: input.createdAt } : {}),
  };
}

async function runWithConcurrency<T>(items: T[], concurrency: number, action: (item: T) => Promise<void>) {
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < items.length) {
      const item = items[nextIndex++];
      await action(item);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
}

export async function importLeadsInBatches(
  inputs: LeadInput[],
  db: LeadImportClient,
  { batchSize = IMPORT_BATCH_SIZE, concurrency = IMPORT_CONCURRENCY }: ImportOptions = {}
): Promise<{ creados: number; duplicados: number }> {
  if (inputs.length > MAX_IMPORT_ROWS) {
    throw new RangeError(`Import supports at most ${MAX_IMPORT_ROWS} rows`);
  }

  const safeBatchSize = Math.max(1, batchSize);
  const safeConcurrency = Math.max(1, concurrency);
  const user = await db.user.findFirst({
    where: { role: "administrador", active: true },
    select: { id: true },
  });
  const createBatches: Record<string, unknown>[][] = [];
  const seenKeys = new Set<string>();
  let duplicados = 0;

  for (const inputBatch of chunk(inputs, safeBatchSize)) {
    const phones = inputBatch.map((input) => input.telefono);
    const normalizedPhones = inputBatch.map((input) => normalizarTelefono(input.telefono));
    const emails = inputBatch.map((input) => emailKey(input.correo)).filter((email): email is string => Boolean(email));
    const existing = await db.lead.findMany({
      where: {
        OR: [
          { telefono: { in: phones } },
          { telefonoNormalizado: { in: normalizedPhones } },
          ...(emails.length ? [{ correo: { in: emails } }] : []),
        ],
      },
      select: { telefono: true, telefonoNormalizado: true, correo: true },
    });

    const existingKeys = new Set(existing.flatMap((lead) => [
      `phone:${lead.telefono}`,
      ...(lead.telefonoNormalizado ? [`normalized:${lead.telefonoNormalizado}`] : []),
      ...(lead.correo ? [`email:${lead.correo.toLowerCase()}`] : []),
    ]));
    const creates: Record<string, unknown>[] = [];

    for (const input of inputBatch) {
      const keys = duplicateKeys(input);
      if (keys.some((key) => existingKeys.has(key) || seenKeys.has(key))) {
        duplicados++;
        continue;
      }
      keys.forEach((key) => seenKeys.add(key));
      creates.push(toCreateData(input, user?.id ?? null));
    }
    if (creates.length) createBatches.push(creates);
  }

  await runWithConcurrency(createBatches, safeConcurrency, async (data) => {
    await db.lead.createMany({ data });
  });

  return {
    creados: createBatches.reduce((total, batch) => total + batch.length, 0),
    duplicados,
  };
}
