import { History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { TIPO_LABELS, TIPO_ICONS, TIPO_COLORS, DEFAULT_TIPO_ICON, DEFAULT_TIPO_COLOR } from "./lead-activity-types";
import type { LeadDetailData } from "./types";

export function LeadActivityTimeline({ activities }: { activities: LeadDetailData["activities"] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted" />
          <CardTitle className="text-sm font-semibold">Historial de actividad</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted py-2">Sin actividad registrada</p>
        ) : (
          <div className="space-y-0">
            {activities.map((act, i) => {
              const Icon = TIPO_ICONS[act.tipo] || DEFAULT_TIPO_ICON;
              const colorCls = TIPO_COLORS[act.tipo] || DEFAULT_TIPO_COLOR;
              return (
                <div key={act.id} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < activities.length - 1 && (
                    <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border" />
                  )}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorCls}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-sm font-medium text-card-foreground leading-snug">
                      {TIPO_LABELS[act.tipo] || act.tipo}
                    </p>
                    {act.nota && (
                      <p className="text-xs text-muted mt-0.5 leading-relaxed">{act.nota}</p>
                    )}
                    <p className="text-[11px] text-muted/60 mt-0.5">
                      {act.user?.name || "Sistema"} · {format(new Date(act.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
