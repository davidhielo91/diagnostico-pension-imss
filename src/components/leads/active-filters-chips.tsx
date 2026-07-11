import { X } from "lucide-react";

const FILTER_LABELS: Record<string, string> = {
  estado: "Estado",
  categoria: "Categoría",
  prioridad: "Prioridad",
  fuente: "Fuente",
  segmento: "Segmento",
  sinContacto: "Sin contacto",
  segmentoInteres: "Grupo",
};

export function ActiveFiltersChips({
  activeFilters,
  filteredTotal,
  totalForTab,
  isFiltered,
  onRemove,
  onClearAll,
}: {
  activeFilters: { key: string; value: string }[];
  filteredTotal: number;
  totalForTab: number;
  isFiltered: boolean;
  onRemove: (key: string) => void;
  onClearAll: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 flex-wrap">
        {activeFilters.map(({ key, value }) => {
          const label = key === "sinContacto"
            ? `> ${value}h`
            : value;
          return (
            <button
              key={key}
              onClick={() => onRemove(key)}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/8 px-2.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/15 transition-colors"
            >
              <span className="text-primary/60">{FILTER_LABELS[key] ?? key}:</span>
              {label}
              <X className="h-3 w-3 ml-0.5 opacity-60" />
            </button>
          );
        })}
        {activeFilters.length > 1 && (
          <button
            onClick={onClearAll}
            className="text-[11px] text-muted hover:text-card-foreground transition-colors underline underline-offset-2"
          >
            Limpiar todo
          </button>
        )}
      </div>
      <p className="text-xs text-muted shrink-0 tabular-nums">
        {isFiltered ? (
          <><span className="font-medium text-card-foreground">{filteredTotal}</span> de {totalForTab} leads</>
        ) : (
          <><span className="font-medium text-card-foreground">{filteredTotal}</span> lead{filteredTotal !== 1 ? "s" : ""}</>
        )}
      </p>
    </div>
  );
}
