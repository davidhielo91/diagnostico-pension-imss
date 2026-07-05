import { useState } from "react";
import { useRouter } from "next/navigation";

export function useAddNote(leadId: string, { onError }: { onError: (msg: string) => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function addNote(contenido: string): Promise<boolean> {
    if (!contenido.trim()) return false;
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
      return true;
    } catch {
      onError("Error al guardar la nota. Intenta de nuevo.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { loading, addNote };
}
