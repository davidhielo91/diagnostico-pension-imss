import { TableHead, TableRow } from "@/components/ui/table";
import { ArrowUpDown, ArrowDown } from "lucide-react";

export function LeadsTableHeader({
  allSelected,
  onToggleSelectAll,
  orden,
  onOrdenChange,
}: {
  allSelected: boolean;
  onToggleSelectAll: () => void;
  orden: string;
  onOrdenChange: (orden: string) => void;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableHead className="w-8 pr-0">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={onToggleSelectAll}
          className="h-3.5 w-3.5 rounded border-border accent-primary cursor-pointer"
          aria-label="Seleccionar todos"
        />
      </TableHead>
      <TableHead>Nombre / Tema</TableHead>
      <TableHead className="hidden md:table-cell">Categoría</TableHead>
      <TableHead className="hidden sm:table-cell">
        <button
          onClick={() => onOrdenChange(orden === "score" ? "recientes" : "score")}
          className={`inline-flex items-center gap-1 hover:text-card-foreground transition-colors ${orden === "score" ? "text-primary font-semibold" : "text-muted-foreground"}`}
        >
          Score
          {orden === "score" ? <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-40" />}
        </button>
      </TableHead>
      <TableHead className="hidden sm:table-cell">Prioridad</TableHead>
      <TableHead>Estado</TableHead>
      <TableHead className="text-right hidden sm:table-cell">
        <button
          onClick={() => onOrdenChange(orden === "recientes" ? "score" : "recientes")}
          className={`inline-flex items-center gap-1 hover:text-card-foreground transition-colors ${orden === "recientes" ? "text-primary font-semibold" : "text-muted-foreground"}`}
        >
          Fecha
          {orden === "recientes" ? <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-40" />}
        </button>
      </TableHead>
      <TableHead className="w-8" />
    </TableRow>
  );
}
