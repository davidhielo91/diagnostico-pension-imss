import { useState } from "react";

export function useGenerarResumen(
  leadId: string,
  initialResumen: string | null,
  { onError }: { onError: (msg: string) => void }
) {
  const [resumenIA, setResumenIA] = useState<string | null>(initialResumen);
  const [generando, setGenerando] = useState(false);

  async function generar() {
    setGenerando(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/generar-resumen`, { method: "POST" });
      const data = await res.json();
      if (data.resumen) {
        setResumenIA(data.resumen);
      } else {
        onError(data.error ?? "Error al generar el resumen. Intenta de nuevo.");
      }
    } catch {
      onError("Error al generar el resumen. Intenta de nuevo.");
    }
    setGenerando(false);
  }

  return { resumenIA, generando, generar };
}
