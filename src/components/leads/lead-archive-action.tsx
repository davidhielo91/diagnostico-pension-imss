import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLeadQuickAction } from "@/hooks/use-lead-quick-action";

export function LeadArchiveAction({
  leadId,
  onError,
}: {
  leadId: string;
  onError: (msg: string) => void;
}) {
  const { execute } = useLeadQuickAction(leadId, { onError });

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full justify-start gap-2 h-8 text-sm text-slate-600 hover:text-slate-800"
      onClick={() => execute("archivado")}
    >
      <Archive className="h-3.5 w-3.5" />
      Archivar lead
    </Button>
  );
}
