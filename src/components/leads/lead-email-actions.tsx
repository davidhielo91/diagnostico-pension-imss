import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generarCorreo } from "@/lib/classification";
import { useLeadQuickAction } from "@/hooks/use-lead-quick-action";
import type { LeadDetailData } from "./types";

export function LeadEmailActions({
  lead,
  onError,
}: {
  lead: LeadDetailData;
  onError: (msg: string) => void;
}) {
  const { execute } = useLeadQuickAction(lead.id, { onError });

  // R4: intentionally uses the original server-provided lead.prioridad, NOT any
  // locally-edited prioridad state from the classification card — preserved as-is.
  const correo = generarCorreo(lead.nombre, lead.prioridad);

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-muted uppercase tracking-wider px-0.5">Correo electrónico</p>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2 h-8 text-sm text-sky-700 border-sky-200 bg-sky-50 hover:bg-sky-100 hover:text-sky-800 dark:text-sky-400 dark:border-sky-900 dark:bg-sky-950/30 disabled:opacity-50"
        disabled={!lead.correo}
        onClick={() => {
          window.open(`mailto:${lead.correo}?subject=${encodeURIComponent(correo.asunto)}&body=${encodeURIComponent(correo.cuerpo)}`, "_self");
          execute("correo_enviado");
        }}
      >
        <Mail className="h-3.5 w-3.5 shrink-0" />
        {lead.correo ? "Abrir correo" : "Sin correo registrado"}
      </Button>
    </div>
  );
}
