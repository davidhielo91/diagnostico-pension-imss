import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { PRIORIDADES, FUENTES, SEGMENTOS, SEGMENTOS_INTERES, HORAS_SIN_CONTACTO_CRITICO } from "@/lib/constants";
import { LeadsFilterSelect } from "./leads-filter-select";
import type { FilterField } from "./types";

const OPCIONES_SIN_CONTACTO = [
  { value: String(HORAS_SIN_CONTACTO_CRITICO), label: "> 24 horas" },
  { value: "72", label: "> 3 días" },
  { value: "168", label: "> 7 días" },
];

const ACTIVOS_FIELDS: FilterField[] = [
  { placeholder: "Segmento", paramKey: "segmento", options: SEGMENTOS as unknown as string[] },
  {
    placeholder: "Grupo",
    paramKey: "segmentoInteres",
    options: SEGMENTOS_INTERES as unknown as string[],
    optionLabels: SEGMENTOS_INTERES.map((s) => `Grupo ${s}`),
  },
  { placeholder: "Prioridad", paramKey: "prioridad", options: PRIORIDADES as unknown as string[] },
  { placeholder: "Fuente", paramKey: "fuente", options: FUENTES as unknown as string[] },
  {
    placeholder: "Sin contacto",
    paramKey: "sinContacto",
    options: OPCIONES_SIN_CONTACTO.map((o) => o.value),
    optionLabels: OPCIONES_SIN_CONTACTO.map((o) => o.label),
  },
];

const ARCHIVADOS_FIELDS: FilterField[] = [
  { placeholder: "Prioridad", paramKey: "prioridad", options: PRIORIDADES as unknown as string[] },
  { placeholder: "Fuente", paramKey: "fuente", options: FUENTES as unknown as string[] },
];

export function LeadsFilterBar({
  variant,
  searchParams,
  onFilterChange,
}: {
  variant: "activos" | "archivados";
  searchParams: URLSearchParams;
  onFilterChange: (key: string, value: string) => void;
}) {
  const [searchValue, setSearchValue] = useState(searchParams.get("busqueda") || "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearch(value: string) {
    setSearchValue(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onFilterChange("busqueda", value), 350);
  }

  const fields = variant === "archivados" ? ARCHIVADOS_FIELDS : ACTIVOS_FIELDS;

  return (
    <div className="flex flex-wrap gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
        <Input
          placeholder="Buscar nombre, correo o teléfono…"
          className="h-8 pl-8 text-sm bg-card border-border"
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      {fields.map((f) => (
        <LeadsFilterSelect
          key={f.paramKey}
          placeholder={f.placeholder}
          paramKey={f.paramKey}
          options={f.options}
          optionLabels={f.optionLabels}
          value={searchParams.get(f.paramKey) || ""}
          active={!!searchParams.get(f.paramKey)}
          onFilterChange={onFilterChange}
        />
      ))}
    </div>
  );
}
