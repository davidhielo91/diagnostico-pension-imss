export function LeadsTabsSwitcher({
  esArchivados,
  totalActivos,
  totalArchivados,
  onSwitch,
}: {
  esArchivados: boolean;
  totalActivos: number;
  totalArchivados: number;
  onSwitch: (tab: "activos" | "archivados") => void;
}) {
  return (
    <div className="flex gap-1 p-1 bg-muted/30 rounded-lg border border-border w-fit">
      <button
        onClick={() => onSwitch("activos")}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          !esArchivados
            ? "bg-card shadow-sm text-card-foreground"
            : "text-muted hover:text-card-foreground"
        }`}
      >
        Activos
        <span className={`text-[11px] tabular-nums px-1.5 py-0.5 rounded-full ${
          !esArchivados ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted"
        }`}>
          {totalActivos}
        </span>
      </button>
      <button
        onClick={() => onSwitch("archivados")}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          esArchivados
            ? "bg-card shadow-sm text-card-foreground"
            : "text-muted hover:text-card-foreground"
        }`}
      >
        Archivados
        <span className={`text-[11px] tabular-nums px-1.5 py-0.5 rounded-full ${
          esArchivados ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300" : "bg-muted/50 text-muted"
        }`}>
          {totalArchivados}
        </span>
      </button>
    </div>
  );
}
