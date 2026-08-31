import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LeadWhatsappActions } from "./lead-whatsapp-actions";
import { LeadEmailActions } from "./lead-email-actions";
import { LeadArchiveAction } from "./lead-archive-action";
import { LeadFollowupReminder } from "./lead-followup-reminder";
import { LeadDeleteAction } from "./lead-delete-action";
import type { LeadDetailData } from "./types";

export function LeadContactCard({
  lead,
  isAdmin,
  onError,
}: {
  lead: LeadDetailData;
  isAdmin: boolean;
  onError: (msg: string) => void;
}) {
  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <p className="text-[10px] text-muted uppercase tracking-wider font-semibold px-0.5">
          Contactar
        </p>

        <LeadWhatsappActions lead={lead} onError={onError} />

        <Separator className="my-1" />

        <LeadEmailActions lead={lead} onError={onError} />

        <Separator className="my-1" />

        <LeadArchiveAction leadId={lead.id} onError={onError} />

        <Separator className="my-1" />

        <LeadFollowupReminder lead={lead} onError={onError} />

        {isAdmin && (
          <>
            <Separator className="my-1" />
            <LeadDeleteAction leadId={lead.id} onError={onError} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
