import { useState } from "react";
import { useRouter } from "next/navigation";

export function useUpdateLeadField(leadId: string, { onError }: { onError: (msg: string) => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateField(field: string, value: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      onError("Error al actualizar el campo. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return { loading, updateField };
}
