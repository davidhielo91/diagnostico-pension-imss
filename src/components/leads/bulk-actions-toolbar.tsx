import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ESTADOS_LEAD } from "@/lib/constants";
import { AlertTriangle } from "lucide-react";

export function BulkActionsToolbar({
  selectedCount,
  bulkEstado,
  onBulkEstadoChange,
  applyingBulk,
  onApply,
  onCancel,
  error,
}: {
  selectedCount: number;
  bulkEstado: string;
  onBulkEstadoChange: (value: string) => void;
  applyingBulk: boolean;
  onApply: () => void;
  onCancel: () => void;
  error?: string | null;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-primary/30 bg-primary/5">
        <span className="text-sm font-medium text-card-foreground tabular-nums shrink-0">
          {selectedCount} seleccionado{selectedCount !== 1 ? "s" : ""}
        </span>
        <Select value={bulkEstado} onValueChange={onBulkEstadoChange}>
          <SelectTrigger className="h-7 text-sm border-border bg-card w-auto min-w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ESTADOS_LEAD.map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          className="h-7 text-sm"
          disabled={applyingBulk}
          onClick={onApply}
        >
          {applyingBulk ? "Aplicando…" : "Aplicar"}
        </Button>
        <button
          onClick={onCancel}
          className="ml-auto text-xs text-muted hover:text-card-foreground transition-colors"
        >
          Cancelar
        </button>
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive px-0.5">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
