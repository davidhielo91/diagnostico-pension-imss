import { subDays } from "date-fns";
import type { Prisma } from "@prisma/client";

export type LeadFilters = {
  tab?: string;
  estado?: string;
  categoria?: string;
  prioridad?: string;
  fuente?: string;
  busqueda?: string;
  pagina?: string;
  segmento?: string;
  sinContacto?: string;
  orden?: string;
  segmentoInteres?: string;
};

const EXPORT_FILTER_KEYS: Array<keyof LeadFilters> = [
  "tab",
  "estado",
  "categoria",
  "prioridad",
  "fuente",
  "busqueda",
  "segmento",
  "sinContacto",
  "segmentoInteres",
];

export function buildLeadWhere(filters: LeadFilters, now = new Date()): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {};
  const esArchivados = filters.tab === "archivados";

  if (esArchivados) {
    where.estadoLead = "Archivado";
  } else if (filters.estado && filters.estado !== "Archivado") {
    where.estadoLead = filters.estado;
  } else {
    where.estadoLead = { in: ["Nuevo", "Contactado"] };
  }

  if (filters.categoria) where.categoria = filters.categoria;
  if (filters.prioridad) where.prioridad = filters.prioridad;
  if (filters.fuente) where.fuente = filters.fuente;
  if (filters.segmentoInteres) where.segmentoInteres = filters.segmentoInteres;

  if (!esArchivados && filters.segmento) {
    if (filters.segmento === "Invalidez") where.categoria = { contains: "Invalidez" };
    else if (filters.segmento === "Ley 73") where.categoria = { contains: "Ley 73" };
    else if (filters.segmento === "Cambio cesantía") where.categoria = { contains: "cesantía" };
    else if (filters.segmento === "Pensión baja") where.categoria = { contains: "baja" };
    else if (filters.segmento === "Requiere revisión") where.categoria = "Requiere revisión manual";
    else if (filters.segmento === "Regresaron") where.vecesRecibido = { gt: 1 };
  }

  if (!esArchivados && filters.sinContacto) {
    const horas = parseInt(filters.sinContacto, 10);
    if (!isNaN(horas)) {
      where.createdAt = { lte: subDays(now, horas / 24) };
      where.estadoLead = "Nuevo";
    }
  }

  if (filters.busqueda) {
    where.OR = [
      { nombre: { contains: filters.busqueda } },
      { correo: { contains: filters.busqueda } },
      { telefono: { contains: filters.busqueda } },
    ];
  }

  return where;
}

export function readLeadFilters(searchParams: URLSearchParams): LeadFilters {
  return Object.fromEntries(
    Array.from(searchParams.entries()).filter(([key]) => EXPORT_FILTER_KEYS.includes(key as keyof LeadFilters))
  ) as LeadFilters;
}

export function createLeadExportSearchParams(filters: LeadFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of EXPORT_FILTER_KEYS) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  return params;
}
