import { Mail, Sparkles, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generarCorreo } from "@/lib/classification";
import { useGenerarCorreoIA } from "@/hooks/use-generar-correo-ia";
import { useLeadQuickAction } from "@/hooks/use-lead-quick-action";
import type { LeadDetailData } from "./types";

export function LeadEmailActions({
  lead,
  onError,
}: {
  lead: LeadDetailData;
  onError: (msg: string) => void;
}) {
  const { correoIA, setCorreoIA, generando: generandoCorreoIA, generar: generarCorreoIA } = useGenerarCorreoIA(lead.id, { onError });
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
          const asunto = correoIA?.asunto ?? correo.asunto;
          const cuerpo = correoIA?.cuerpo ?? correo.cuerpo;
          window.open(`mailto:${lead.correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`, "_self");
          execute("correo_enviado");
        }}
      >
        <Mail className="h-3.5 w-3.5 shrink-0" />
        {lead.correo ? "Abrir correo" : "Sin correo registrado"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2 h-8 text-sm text-violet-700 border-violet-200 bg-violet-50 hover:bg-violet-100 dark:text-violet-400 dark:border-violet-900 dark:bg-violet-950/30 disabled:opacity-60"
        onClick={generarCorreoIA}
        disabled={generandoCorreoIA || !lead.correo}
      >
        {generandoCorreoIA ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {generandoCorreoIA ? "Generando…" : correoIA ? "Regenerar correo con IA" : "Generar correo con IA"}
      </Button>
      {correoIA && (
        <div className="rounded-lg border border-violet-200 bg-violet-50/50 dark:border-violet-800 dark:bg-violet-950/20 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Editar antes de enviar
            </p>
            <button
              onClick={generarCorreoIA}
              disabled={generandoCorreoIA}
              className="flex items-center gap-1 text-[10px] text-violet-500 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-200 disabled:opacity-40 transition-colors"
              title="Generar otra versión"
            >
              {generandoCorreoIA ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
              Regenerar
            </button>
          </div>
          <div>
            <p className="text-[10px] text-muted mb-0.5 uppercase tracking-wider">Asunto</p>
            <input
              type="text"
              className="w-full text-xs font-medium text-card-foreground bg-white dark:bg-card border border-border rounded px-2 py-1.5 outline-none focus:ring-1 focus:ring-violet-300"
              value={correoIA.asunto}
              onChange={(e) => setCorreoIA({ ...correoIA, asunto: e.target.value })}
            />
          </div>
          <div>
            <p className="text-[10px] text-muted mb-0.5 uppercase tracking-wider">Cuerpo</p>
            <textarea
              className="w-full text-xs text-card-foreground bg-white dark:bg-card border border-border rounded px-2 py-1.5 resize-none outline-none focus:ring-1 focus:ring-violet-300 leading-relaxed"
              rows={7}
              value={correoIA.cuerpo}
              onChange={(e) => setCorreoIA({ ...correoIA, cuerpo: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
