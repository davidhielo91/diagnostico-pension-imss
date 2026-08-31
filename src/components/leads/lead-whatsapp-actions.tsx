"use client";

import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generarWhatsApp } from "@/lib/classification";
import { useLeadQuickAction } from "@/hooks/use-lead-quick-action";
import type { LeadDetailData } from "./types";

export function LeadWhatsappActions({
  lead,
  onError,
}: {
  lead: LeadDetailData;
  onError: (msg: string) => void;
}) {
  const { execute } = useLeadQuickAction(lead.id, { onError });
  const whatsapp = generarWhatsApp(lead.nombre, lead.telefonoNormalizado);

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-muted uppercase tracking-wider px-0.5">WhatsApp</p>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2 h-8 text-sm text-green-700 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-800 dark:text-green-400 dark:border-green-900 dark:bg-green-950/30 disabled:opacity-50"
        disabled={!whatsapp.url}
        onClick={() => {
          if (!whatsapp.url) return;
          window.open(whatsapp.url, "_blank");
          execute("whatsapp_enviado");
        }}
      >
        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
        {whatsapp.url ? "Abrir WhatsApp" : "Sin teléfono registrado"}
      </Button>
    </div>
  );
}
