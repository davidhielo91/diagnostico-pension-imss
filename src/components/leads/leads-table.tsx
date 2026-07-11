"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableHeader,
} from "@/components/ui/table";
import { Inbox } from "lucide-react";
import { useLeadsUrlState } from "@/hooks/use-leads-url-state";
import { useLeadsBulkSelection } from "@/hooks/use-leads-bulk-selection";
import { LeadsTabsSwitcher } from "./leads-tabs-switcher";
import { LeadsFilterBar } from "./leads-filter-bar";
import { ActiveFiltersChips } from "./active-filters-chips";
import { BulkActionsToolbar } from "./bulk-actions-toolbar";
import { LeadsTableHeader } from "./leads-table-header";
import { LeadRow } from "./lead-row";
import { LeadsPagination } from "./leads-pagination";
import type { LeadWithUser } from "./types";

export function LeadsTable({
  leads,
  filteredTotal,
  totalActivos,
  totalArchivados,
  page,
  pageSize,
  tab,
}: {
  leads: LeadWithUser[];
  filteredTotal: number;
  totalActivos: number;
  totalArchivados: number;
  page: number;
  pageSize: number;
  tab: string;
}) {
  const router = useRouter();
  const nav = useLeadsUrlState(tab);
  const bulkSelection = useLeadsBulkSelection(leads);

  const totalPages = Math.ceil(filteredTotal / pageSize);
  const totalForTab = nav.esArchivados ? totalArchivados : totalActivos;

  return (
    <div className="space-y-3">
      <LeadsTabsSwitcher
        esArchivados={nav.esArchivados}
        totalActivos={totalActivos}
        totalArchivados={totalArchivados}
        onSwitch={nav.switchTab}
      />

      <LeadsFilterBar
        key={nav.esArchivados ? "archivados" : "activos"}
        variant={nav.esArchivados ? "archivados" : "activos"}
        searchParams={nav.searchParams}
        onFilterChange={nav.setFilter}
      />

      <ActiveFiltersChips
        activeFilters={nav.activeFilters}
        filteredTotal={filteredTotal}
        totalForTab={totalForTab}
        isFiltered={nav.isFiltered}
        onRemove={(key) => nav.setFilter(key, "")}
        onClearAll={nav.clearAll}
      />

      {bulkSelection.selectedIds.size > 0 && (
        <BulkActionsToolbar
          selectedCount={bulkSelection.selectedIds.size}
          bulkEstado={bulkSelection.bulkEstado}
          onBulkEstadoChange={bulkSelection.setBulkEstado}
          applyingBulk={bulkSelection.applyingBulk}
          onApply={bulkSelection.applyBulkStatus}
          onCancel={bulkSelection.clearSelection}
          error={bulkSelection.error}
        />
      )}

      <div className="rounded-lg border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden">
        {leads.length === 0 ? (
          <div className="py-14 text-center">
            <Inbox className="mx-auto h-9 w-9 text-muted/25" />
            <p className="mt-3 text-sm font-medium text-card-foreground">Sin resultados</p>
            <p className="text-xs text-muted mt-0.5">
              {nav.isFiltered ? "Prueba ajustando los filtros" : "Todavía no hay leads"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <LeadsTableHeader
                  allSelected={bulkSelection.allSelected}
                  onToggleSelectAll={bulkSelection.toggleSelectAll}
                  orden={nav.orden}
                  onOrdenChange={nav.setOrden}
                />
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <LeadRow
                    key={lead.id}
                    lead={lead}
                    selected={bulkSelection.selectedIds.has(lead.id)}
                    esArchivados={nav.esArchivados}
                    onToggleSelect={bulkSelection.toggleSelect}
                    onNavigate={(id) => router.push(`/leads/${id}`)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <LeadsPagination page={page} totalPages={totalPages} onPageChange={nav.goToPage} />
    </div>
  );
}
