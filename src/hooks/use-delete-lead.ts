import { useState } from "react";
import { useRouter } from "next/navigation";

export function useDeleteLead(leadId: string, { onError }: { onError: (msg: string) => void }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function remove(): Promise<boolean> {
    setDeleting(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/leads");
      router.refresh();
      return true;
    } catch {
      onError("Error al eliminar el lead. Intenta de nuevo.");
      setDeleting(false);
      return false;
    }
  }

  return { deleting, remove };
}
