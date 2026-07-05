import { useState } from "react";
import { useRouter } from "next/navigation";

export function useLeadQuickAction(leadId: string, { onError }: { onError: (msg: string) => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function execute(tipo: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      onError("Error al registrar la acción. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return { loading, execute };
}
