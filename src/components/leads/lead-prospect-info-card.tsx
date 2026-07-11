import { Mail, MapPin, User, FileText, Tag, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoRow } from "./lead-info-row";
import { LeadResumenIaPanel } from "./lead-resumen-ia-panel";
import type { LeadDetailData } from "./types";

export function LeadProspectInfoCard({
  lead,
  onError,
}: {
  lead: LeadDetailData;
  onError: (msg: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Datos del prospecto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <InfoRow icon={Phone} label="Teléfono" value={lead.telefono} />
          <InfoRow icon={Mail} label="Correo" value={lead.correo || "—"} />
          <InfoRow icon={MapPin} label="Ubicación" value={`${lead.ciudad}${lead.estado ? `, ${lead.estado}` : ""}`} />
          <InfoRow icon={User} label="¿Ya pensionado?" value={lead.yaEstaPensionado === "si" ? "Sí" : lead.yaEstaPensionado === "no" ? "No" : "No sé"} />
          <InfoRow icon={FileText} label="Semanas cotizadas" value={
            lead.tieneSemanasCotizadas === "si" ? "Sí" :
            lead.tieneSemanasCotizadas === "no" ? "No" :
            lead.tieneSemanasCotizadas === "no_seguro" ? "No estoy seguro" : "—"
          } />
          <InfoRow icon={Tag} label="Objetivo" value={lead.objetivoPrincipal || "—"} />
        </dl>

        <div className="pt-3 border-t border-border">
          <p className="text-[11px] text-muted uppercase tracking-wider font-medium mb-2">
            Situación que comenta
          </p>
          <p className="text-sm text-card-foreground bg-surface rounded-md px-3.5 py-3 border border-border leading-relaxed">
            {lead.situacion}
          </p>
        </div>

        <LeadResumenIaPanel leadId={lead.id} initialResumen={lead.resumenIA} onError={onError} />
      </CardContent>
    </Card>
  );
}
