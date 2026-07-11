import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORIAS_INTERNAS,
  PRIORIDADES,
  VIABILIDADES,
  SEGMENTOS_INTERES,
} from "@/lib/constants";
import { useUpdateLeadField } from "@/hooks/use-update-lead-field";
import { SelectField } from "./lead-select-field";
import type { LeadDetailData } from "./types";

export function LeadClassificationCard({
  lead,
  onError,
}: {
  lead: LeadDetailData;
  onError: (msg: string) => void;
}) {
  const { updateField } = useUpdateLeadField(lead.id, { onError });
  const [nuevaCategoria, setNuevaCategoria] = useState(lead.categoria);
  const [nuevaPrioridad, setNuevaPrioridad] = useState(lead.prioridad);
  const [nuevaViabilidad, setNuevaViabilidad] = useState(lead.viabilidad);
  const [nuevoSegmento, setNuevoSegmento] = useState(lead.segmentoInteres ?? "");

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted">
          Clasificación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <SelectField
          label="Categoría"
          value={nuevaCategoria}
          options={CATEGORIAS_INTERNAS as unknown as string[]}
          onChange={(v) => { setNuevaCategoria(v); updateField("categoria", v); }}
        />
        <SelectField
          label="Prioridad"
          value={nuevaPrioridad}
          options={PRIORIDADES as unknown as string[]}
          onChange={(v) => { setNuevaPrioridad(v); updateField("prioridad", v); }}
        />
        <SelectField
          label="Viabilidad"
          value={nuevaViabilidad}
          options={VIABILIDADES as unknown as string[]}
          onChange={(v) => { setNuevaViabilidad(v); updateField("viabilidad", v); }}
        />
        <div>
          <p className="text-[11px] text-muted font-medium mb-1.5">Grupo de interés</p>
          <Select
            value={nuevoSegmento || "sin_clasificar"}
            onValueChange={(v) => {
              const val = v === "sin_clasificar" ? "" : v;
              setNuevoSegmento(val);
              updateField("segmentoInteres", val);
            }}
          >
            <SelectTrigger className="h-8 bg-background border-border text-sm">
              <SelectValue placeholder="Sin clasificar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sin_clasificar">Sin clasificar</SelectItem>
              {(SEGMENTOS_INTERES as unknown as string[]).map((s) => (
                <SelectItem key={s} value={s}>
                  Grupo {s} — {s === "A" ? "Listo para comprar" : s === "B" ? "Interesado con dudas" : "Curioso"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
