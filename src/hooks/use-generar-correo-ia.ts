import { useState } from "react";

export function useGenerarCorreoIA(leadId: string, { onError }: { onError: (msg: string) => void }) {
  const [correoIA, setCorreoIA] = useState<{ asunto: string; cuerpo: string } | null>(null);
  const [generando, setGenerando] = useState(false);

  async function generar() {
    setGenerando(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/generar-correo`, { method: "POST" });
      const data = await res.json();
      if (data.asunto && data.cuerpo) {
        setCorreoIA({ asunto: data.asunto, cuerpo: data.cuerpo });
      } else {
        onError(data.error ?? "Error al generar el correo. Intenta de nuevo.");
      }
    } catch {
      onError("Error al generar el correo. Intenta de nuevo.");
    }
    setGenerando(false);
  }

  return { correoIA, setCorreoIA, generando, generar };
}
