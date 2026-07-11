import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useUpdateLeadField } from "@/hooks/use-update-lead-field";
import type { LeadDetailData } from "./types";

export function LeadFollowupReminder({
  lead,
  onError,
}: {
  lead: LeadDetailData;
  onError: (msg: string) => void;
}) {
  const { updateField } = useUpdateLeadField(lead.id, { onError });
  const [proximaAccion, setProximaAccion] = useState<Date | null>(
    lead.fechaProximaAccion ? new Date(lead.fechaProximaAccion) : null
  );

  async function handleSeguimiento(dias: number | null) {
    const fecha = dias !== null
      ? new Date(Date.now() + dias * 24 * 60 * 60 * 1000)
      : null;
    setProximaAccion(fecha);
    await updateField("fechaProximaAccion", fecha ? fecha.toISOString() : "");
  }

  return (
    <div>
      <p className="text-[10px] text-muted uppercase tracking-wider font-semibold px-0.5 pb-1.5 pt-0.5">
        Recordatorio
      </p>
      {proximaAccion ? (
        <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-2.5 py-1.5 mb-1.5">
          <div className="flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
              {format(proximaAccion, "d MMM yyyy", { locale: es })}
            </span>
          </div>
          <button
            onClick={() => handleSeguimiento(null)}
            className="text-amber-500 hover:text-amber-700 transition-colors"
            aria-label="Quitar recordatorio"
          >
            <BellOff className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
      <div className="flex gap-1 flex-wrap">
        {[{ label: "1d", dias: 1 }, { label: "3d", dias: 3 }, { label: "7d", dias: 7 }, { label: "15d", dias: 15 }].map(({ label, dias }) => (
          <button
            key={dias}
            onClick={() => handleSeguimiento(dias)}
            className="px-2.5 py-1 text-xs rounded-md border border-border bg-background hover:bg-sidebar-accent hover:border-primary/30 text-muted-foreground hover:text-card-foreground transition-colors"
          >
            +{label}
          </button>
        ))}
      </div>
    </div>
  );
}
