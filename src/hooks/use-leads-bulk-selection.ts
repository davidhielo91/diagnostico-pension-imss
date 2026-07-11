import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ESTADOS_LEAD } from "@/lib/constants";
import type { LeadWithUser } from "@/components/leads/types";

export function useLeadsBulkSelection(leads: LeadWithUser[]) {
  const router = useRouter();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkEstado, setBulkEstado] = useState<string>(ESTADOS_LEAD[0]);
  const [applyingBulk, setApplyingBulk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  const allCurrentIds = leads.map((l) => l.id);
  const allSelected = allCurrentIds.length > 0 && allCurrentIds.every((id) => selectedIds.has(id));

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allCurrentIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => new Set([...prev, ...allCurrentIds]));
    }
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function showError(msg: string) {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setError(msg);
    errorTimerRef.current = setTimeout(() => setError(null), 3000);
  }

  function clearError() {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setError(null);
  }

  async function applyBulkStatus() {
    if (selectedIds.size === 0) return;
    setApplyingBulk(true);
    try {
      const res = await fetch("/api/leads/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selectedIds], estadoLead: bulkEstado }),
      });
      if (!res.ok) {
        showError("Error al aplicar el estado. Intenta de nuevo.");
        return;
      }
      clearSelection();
      router.refresh();
    } catch {
      showError("Error al aplicar el estado. Intenta de nuevo.");
    } finally {
      setApplyingBulk(false);
    }
  }

  return {
    selectedIds,
    allSelected,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    bulkEstado,
    setBulkEstado,
    applyingBulk,
    applyBulkStatus,
    error,
    clearError,
  };
}
