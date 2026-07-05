import Link from "next/link";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  PRIORIDAD_COLORS,
  ESTADO_COLORS,
  SCORE_COLORS,
  SEGMENTO_INTERES_COLORS,
  HORAS_SIN_CONTACTO_CRITICO,
} from "@/lib/constants";
import { format, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, AlertTriangle } from "lucide-react";
import type { LeadWithUser } from "./types";

function horasSinContacto(lead: LeadWithUser, esArchivados: boolean): number | null {
  if (esArchivados) return null;
  if (lead.fechaUltimoContacto) return null;
  if (lead.estadoLead !== "Nuevo") return null;
  return differenceInHours(new Date(), new Date(lead.createdAt));
}

export function LeadRow({
  lead,
  selected,
  esArchivados,
  onToggleSelect,
  onNavigate,
}: {
  lead: LeadWithUser;
  selected: boolean;
  esArchivados: boolean;
  onToggleSelect: (id: string) => void;
  onNavigate: (id: string) => void;
}) {
  const horasSinC = horasSinContacto(lead, esArchivados);
  const sinContactoCritico = horasSinC !== null && horasSinC >= HORAS_SIN_CONTACTO_CRITICO;

  return (
    <TableRow
      className={`cursor-pointer group ${
        sinContactoCritico ? "bg-red-50/40 dark:bg-red-950/20" : ""
      }`}
      onClick={() => onNavigate(lead.id)}
    >
      <TableCell className="pr-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(lead.id)}
            className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer shrink-0"
            aria-label={`Seleccionar ${lead.nombre}`}
          />
          {sinContactoCritico && (
            <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
          )}
        </div>
      </TableCell>

      {/* Nombre + Tema */}
      <TableCell>
        <p className="font-medium text-[13px] text-card-foreground leading-snug">
          {lead.nombre}
          {sinContactoCritico && (
            <span className="ml-1.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
              {horasSinC}h
            </span>
          )}
          {lead.vecesRecibido > 1 && (
            <span className="ml-1.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
              ↩ {lead.vecesRecibido}x
            </span>
          )}
        </p>
        <p className="text-[11px] text-muted mt-0.5 leading-none">
          {lead.temaInteres}{lead.edad ? ` · ${lead.edad}a` : ""}
        </p>
      </TableCell>

      <TableCell className="hidden md:table-cell">
        <span className="text-xs text-muted-foreground leading-snug line-clamp-2 max-w-[140px]">
          {lead.categoria}
        </span>
      </TableCell>

      {/* Score + Grupo */}
      <TableCell className="hidden sm:table-cell">
        <div className="flex items-center gap-1 flex-wrap">
          {lead.scoreViabilidad !== null ? (
            <Badge
              variant="outline"
              className={`text-[11px] px-2 py-0.5 font-semibold whitespace-nowrap ${
                SCORE_COLORS[lead.etiquetaViabilidad ?? ""] || ""
              }`}
            >
              {lead.scoreViabilidad}
            </Badge>
          ) : (
            <span className="text-xs text-muted/40">—</span>
          )}
          {lead.segmentoInteres && (
            <Badge
              variant="outline"
              className={`text-[10px] px-1.5 py-0 font-bold whitespace-nowrap ${
                SEGMENTO_INTERES_COLORS[lead.segmentoInteres] || ""
              }`}
            >
              {lead.segmentoInteres}
            </Badge>
          )}
        </div>
      </TableCell>

      {/* Prioridad */}
      <TableCell className="hidden sm:table-cell">
        <Badge
          variant="outline"
          className={`text-[11px] px-2 py-0.5 font-medium whitespace-nowrap ${
            PRIORIDAD_COLORS[lead.prioridad] || ""
          }`}
        >
          {lead.prioridad}
        </Badge>
      </TableCell>

      <TableCell>
        <Badge
          variant="outline"
          className={`text-[11px] px-2 py-0.5 font-medium whitespace-nowrap ${
            ESTADO_COLORS[lead.estadoLead] || "text-muted-foreground"
          }`}
        >
          {lead.estadoLead}
        </Badge>
      </TableCell>


      <TableCell className="hidden sm:table-cell text-right text-xs text-muted tabular-nums">
        {format(new Date(lead.createdAt), "dd MMM yy", { locale: es })}
      </TableCell>

      <TableCell
        className="text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <Link
          href={`/leads/${lead.id}`}
          className="inline-flex items-center justify-center w-6 h-6 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-sidebar-accent"
          aria-label="Ver lead"
        >
          <ArrowRight className="h-3.5 w-3.5 text-primary" />
        </Link>
      </TableCell>
    </TableRow>
  );
}
