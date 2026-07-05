import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FilterField } from "./types";

export function LeadsFilterSelect({
  placeholder,
  paramKey,
  options,
  optionLabels,
  value,
  active,
  onFilterChange,
}: FilterField & {
  value: string;
  active: boolean;
  onFilterChange: (key: string, value: string) => void;
}) {
  return (
    <Select
      value={value || "todas"}
      onValueChange={(v) => onFilterChange(paramKey, v)}
    >
      <SelectTrigger
        className={`h-8 text-sm border-border ${
          active
            ? "bg-primary/8 border-primary/40 text-primary font-medium"
            : "bg-card"
        } w-auto min-w-[110px] max-w-[150px]`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todas">{placeholder}: Todos</SelectItem>
        {options.map((opt, i) => (
          <SelectItem key={opt} value={opt}>
            {optionLabels?.[i] ?? opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
