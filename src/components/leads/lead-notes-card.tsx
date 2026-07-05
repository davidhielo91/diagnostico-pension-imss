import { useState } from "react";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useAddNote } from "@/hooks/use-add-note";
import type { LeadDetailData } from "./types";

export function LeadNotesCard({
  lead,
  onError,
}: {
  lead: LeadDetailData;
  onError: (msg: string) => void;
}) {
  const { loading, addNote } = useAddNote(lead.id, { onError });
  const [nuevaNota, setNuevaNota] = useState("");

  async function handleAddNote() {
    if (!nuevaNota.trim()) return;
    const ok = await addNote(nuevaNota);
    if (ok) setNuevaNota("");
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted" />
          <CardTitle className="text-sm font-semibold">Notas internas</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Escribe una nota interna…"
          value={nuevaNota}
          onChange={(e) => setNuevaNota(e.target.value)}
          className="min-h-[72px] text-sm bg-background border-border resize-none"
        />
        <Button
          size="sm"
          onClick={handleAddNote}
          disabled={loading || !nuevaNota.trim()}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar nota
        </Button>

        {lead.notes.length > 0 && (
          <div className="space-y-2 pt-1">
            {lead.notes.map((note) => (
              <div
                key={note.id}
                className="rounded-lg bg-surface border border-border px-3.5 py-3 text-sm"
              >
                <p className="text-card-foreground leading-relaxed">{note.contenido}</p>
                <p className="text-[11px] text-muted mt-1.5">
                  {note.user?.name || "Sistema"} · {format(new Date(note.createdAt), "dd MMM yyyy HH:mm", { locale: es })}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
