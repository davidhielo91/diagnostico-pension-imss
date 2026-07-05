import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDeleteLead } from "@/hooks/use-delete-lead";

export function LeadDeleteAction({
  leadId,
  onError,
}: {
  leadId: string;
  onError: (msg: string) => void;
}) {
  const { deleting, remove } = useDeleteLead(leadId, { onError });
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleDelete() {
    const ok = await remove();
    if (!ok) setConfirmDelete(false);
  }

  return (
    <>
      {!confirmDelete ? (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 h-8 text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Eliminar lead
        </Button>
      ) : (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2.5 space-y-2">
          <p className="text-xs text-destructive font-medium leading-snug">
            ¿Eliminar permanentemente? No se puede deshacer.
          </p>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="destructive"
              className="flex-1 h-7 text-xs"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Eliminando..." : "Sí, eliminar"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7 text-xs"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
