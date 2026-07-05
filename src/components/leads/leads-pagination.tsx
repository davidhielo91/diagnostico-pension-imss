import { ChevronLeft, ChevronRight } from "lucide-react";

export function LeadsPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-muted tabular-nums">
        Página <span className="font-medium text-card-foreground">{page}</span> de{" "}
        <span className="font-medium text-card-foreground">{totalPages}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border bg-card text-muted-foreground hover:bg-sidebar-accent hover:text-card-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | "…")[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("…");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "…" ? (
              <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={`inline-flex items-center justify-center h-7 min-w-[28px] rounded-md border text-xs font-medium transition-colors ${
                  p === page
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-sidebar-accent hover:text-card-foreground"
                }`}
              >
                {p}
              </button>
            )
          )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-border bg-card text-muted-foreground hover:bg-sidebar-accent hover:text-card-foreground disabled:opacity-40 disabled:pointer-events-none transition-colors"
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
