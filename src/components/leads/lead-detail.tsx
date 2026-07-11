"use client";

import { useSession } from "next-auth/react";
import { AlertTriangle } from "lucide-react";
import { useErrorToast } from "@/hooks/use-error-toast";
import { LeadDetailHeader } from "./lead-detail-header";
import { LeadProspectInfoCard } from "./lead-prospect-info-card";
import { LeadActivityTimeline } from "./lead-activity-timeline";
import { LeadNotesCard } from "./lead-notes-card";
import { LeadStatusCard } from "./lead-status-card";
import { LeadClassificationCard } from "./lead-classification-card";
import { LeadContactCard } from "./lead-contact-card";
import type { LeadDetailData } from "./types";

interface LeadDetailProps {
  lead: LeadDetailData;
}

export function LeadDetail({ lead }: LeadDetailProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "administrador";
  const { errorMsg, showError } = useErrorToast();

  return (
    <div className="space-y-5 max-w-5xl pb-8">

      {/* Toasts */}
      {errorMsg && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm text-destructive-foreground shadow-[var(--shadow-dialog)]">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Page header */}
      <LeadDetailHeader lead={lead} />

      {/* Body grid */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* ── Main column ── */}
        <div className="lg:col-span-2 space-y-5">
          <LeadProspectInfoCard lead={lead} onError={showError} />
          <LeadActivityTimeline activities={lead.activities} />
          <LeadNotesCard lead={lead} onError={showError} />
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-4">
          <LeadStatusCard lead={lead} onError={showError} />
          <LeadClassificationCard lead={lead} onError={showError} />
          <LeadContactCard lead={lead} isAdmin={isAdmin} onError={showError} />
        </div>
      </div>
    </div>
  );
}
