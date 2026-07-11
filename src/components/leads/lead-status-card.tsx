import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ESTADOS_LEAD } from "@/lib/constants";
import { useUpdateLeadField } from "@/hooks/use-update-lead-field";
import { useState } from "react";
import type { LeadDetailData } from "./types";

export function LeadStatusCard({
  lead,
  onError,
}: {
  lead: LeadDetailData;
  onError: (msg: string) => void;
}) {
  const { updateField } = useUpdateLeadField(lead.id, { onError });
  const [nuevoEstado, setNuevoEstado] = useState(lead.estadoLead);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted">
          Gestión
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div>
          <p className="text-[11px] text-muted font-medium mb-1.5">Estado</p>
          <Select
            value={nuevoEstado}
            onValueChange={(v) => { setNuevoEstado(v); updateField("estadoLead", v); }}
          >
            <SelectTrigger className="h-8 bg-background border-border text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(ESTADOS_LEAD as unknown as string[]).map((est) => (
                <SelectItem key={est} value={est}>{est}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
