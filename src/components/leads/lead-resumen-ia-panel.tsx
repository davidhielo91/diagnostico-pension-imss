import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGenerarResumen } from "@/hooks/use-generar-resumen";

export function LeadResumenIaPanel({
  leadId,
  initialResumen,
  onError,
}: {
  leadId: string;
  initialResumen: string | null;
  onError: (msg: string) => void;
}) {
  const { resumenIA, generando, generar } = useGenerarResumen(leadId, initialResumen, { onError });

  return (
    <div className="pt-3 border-t border-border space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted uppercase tracking-wider font-medium">
          Resumen del caso
        </p>
        {!resumenIA && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs text-violet-700 border-violet-200 bg-violet-50 hover:bg-violet-100 dark:text-violet-400 dark:border-violet-900 dark:bg-violet-950/30 disabled:opacity-60"
            onClick={generar}
            disabled={generando}
          >
            {generando ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            {generando ? "Generando…" : "Generar con IA"}
          </Button>
        )}
      </div>
      {resumenIA ? (
        <p className="text-sm text-card-foreground bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-md px-3.5 py-3 leading-relaxed">
          {resumenIA}
        </p>
      ) : (
        <p className="text-xs text-muted italic">
          Genera un resumen del caso con IA para revisión rápida.
        </p>
      )}
    </div>
  );
}
