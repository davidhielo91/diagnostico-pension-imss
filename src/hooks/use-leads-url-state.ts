import { useRouter, useSearchParams } from "next/navigation";

export function useLeadsUrlState(tab: string) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const esArchivados = tab === "archivados";
  const orden = searchParams.get("orden") || "score";

  const FILTER_KEYS = esArchivados
    ? ["categoria", "prioridad", "fuente", "busqueda"]
    : ["categoria", "prioridad", "fuente", "busqueda", "segmento", "segmentoInteres", "sinContacto"];
  const activeFilters = FILTER_KEYS
    .filter((k) => searchParams.get(k))
    .map((k) => ({ key: k, value: searchParams.get(k)! }));

  const isFiltered = activeFilters.length > 0;

  function updateParams(mutate: (params: URLSearchParams) => void, opts?: { resetPage?: boolean }) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    if (opts?.resetPage !== false) {
      params.delete("pagina");
    }
    router.push(`/leads?${params.toString()}`);
  }

  function setFilter(key: string, value: string) {
    updateParams((params) => {
      if (value && value !== "todas") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
  }

  function setOrden(nuevoOrden: string) {
    updateParams((params) => {
      if (nuevoOrden === "score") {
        params.delete("orden");
      } else {
        params.set("orden", nuevoOrden);
      }
    });
  }

  function switchTab(nuevoTab: "activos" | "archivados") {
    router.push(nuevoTab === "archivados" ? "/leads?tab=archivados" : "/leads");
  }

  function goToPage(p: number) {
    updateParams(
      (params) => {
        params.set("pagina", String(p));
      },
      { resetPage: false }
    );
  }

  function clearAll() {
    router.push(esArchivados ? "/leads?tab=archivados" : "/leads");
  }

  return {
    searchParams,
    esArchivados,
    orden,
    activeFilters,
    isFiltered,
    setFilter,
    setOrden,
    switchTab,
    goToPage,
    clearAll,
  };
}
