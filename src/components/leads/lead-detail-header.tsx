import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PRIORIDAD_COLORS, ESTADO_COLORS } from "@/lib/constants";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { LeadDetailData } from "./types";

export function LeadDetailHeader({ lead }: { lead: LeadDetailData }) {
  return (
    <div>
      <Button variant="ghost" size="sm" asChild className="text-muted-foreground -ml-2 mb-3 h-7">
        <Link href="/leads">
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Bandeja de leads
        </Link>
      </Button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground">{lead.nombre}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge
              variant="outline"
              className={`text-[11px] px-2 py-0.5 font-medium ${PRIORIDAD_COLORS[lead.prioridad] || ""}`}
            >
              {lead.prioridad}
            </Badge>
            <Badge
              variant="outline"
              className={`text-[11px] px-2 py-0.5 font-medium ${ESTADO_COLORS[lead.estadoLead] || ""}`}
            >
              {lead.estadoLead}
            </Badge>
            {lead.vecesRecibido > 1 && (
              <Badge
                variant="outline"
                className="text-[11px] px-2 py-0.5 font-medium text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950/40 dark:border-orange-800 inline-flex items-center gap-1"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                Reenviado {lead.vecesRecibido}x
              </Badge>
            )}
            <span className="text-xs text-muted">
              {lead.temaInteres} · {lead.edad} años · {lead.ciudad}{lead.estado ? `, ${lead.estado}` : ""}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0 hidden sm:block">
          <p className="text-[11px] text-muted uppercase tracking-wider">Recibido</p>
          <p className="text-sm font-semibold text-card-foreground mt-0.5">
            {format(new Date(lead.createdAt), "dd MMM yyyy", { locale: es })}
          </p>
          {lead.fuente && (
            <span className="mt-1 inline-block text-[10px] text-muted bg-sidebar-accent border border-border rounded px-2 py-0.5">
              {lead.fuente}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
