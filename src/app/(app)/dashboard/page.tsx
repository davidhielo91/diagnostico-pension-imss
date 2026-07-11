import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRIORIDAD_COLORS } from "@/lib/constants";
import {
  format, subDays, differenceInDays, differenceInMinutes,
  startOfDay, endOfDay,
} from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Flame,
  Inbox,
  PhoneCall,
  BarChart3,
  CheckCircle2,
  Sparkles,
  Tag,
  Bell,
  RefreshCw,
} from "lucide-react";

const TIPOS_CONTACTO = ["whatsapp_enviado", "correo_enviado"];

function formatHoras(totalMinutos: number): string {
  if (totalMinutos < 60) return `${totalMinutos} min`;
  const h = Math.floor(totalMinutos / 60);
  const m = totalMinutos % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

async function getDashboardData() {
  const hoy        = new Date();
  const hace7dias  = subDays(hoy, 7);
  const hace24h    = subDays(hoy, 1);
  const inicioHoy  = startOfDay(hoy);

  const [
    nuevosHoy,
    sinContactar,
    contactados,
    archivados,
    candidatosCriticos,
    prioridadRaw,
    categoriaRaw,
    urgentes,
    atorados,
    contactosRaw,
    fuenteRaw,
    seguimientosHoy,
    seguimientosPendientes,
    regresaron,
  ] = await Promise.all([
    // Hoy
    prisma.lead.count({ where: { createdAt: { gte: inicioHoy } } }),

    // Sin contactar
    prisma.lead.count({ where: { estadoLead: "Nuevo" } }),

    // Contactados
    prisma.lead.count({ where: { estadoLead: "Contactado" } }),

    // Archivados
    prisma.lead.count({ where: { estadoLead: "Archivado" } }),

    // Críticos: score ≥70, Nuevo, >24h
    prisma.lead.count({
      where: { scoreViabilidad: { gte: 70 }, estadoLead: "Nuevo", createdAt: { lte: hace24h } },
    }),

    // Desglose por prioridad (excluye archivados)
    prisma.lead.groupBy({
      by: ["prioridad"],
      where: { estadoLead: { not: "Archivado" } },
      _count: { id: true },
    }),

    // Desglose por categoría (excluye archivados)
    prisma.lead.groupBy({
      by: ["categoria"],
      where: { estadoLead: { not: "Archivado" } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 8,
    }),

    // Candidatos fuertes sin contacto
    prisma.lead.findMany({
      where: { scoreViabilidad: { gte: 70 }, estadoLead: "Nuevo" },
      orderBy: { createdAt: "asc" },
      take: 8,
      select: {
        id: true, nombre: true, temaInteres: true, ciudad: true,
        createdAt: true, scoreViabilidad: true,
      },
    }),

    // Leads atorados
    prisma.lead.findMany({
      where: { estadoLead: { in: ["Nuevo", "Contactado"] }, updatedAt: { lte: hace7dias } },
      orderBy: { updatedAt: "asc" },
      take: 6,
      select: {
        id: true, nombre: true, estadoLead: true, updatedAt: true, prioridad: true,
        asignadoA: { select: { name: true } },
      },
    }),

    // Tiempo promedio de primer contacto
    prisma.leadActivity.findMany({
      where: { tipo: { in: TIPOS_CONTACTO } },
      orderBy: { createdAt: "asc" },
      select: { leadId: true, createdAt: true },
    }),

    // Canales
    prisma.lead.findMany({
      where: { fuente: { not: null } },
      select: { fuente: true, prioridad: true },
    }),

    // Seguimientos hoy
    prisma.lead.count({
      where: {
        fechaProximaAccion: { lte: endOfDay(hoy) },
        estadoLead: { not: "Archivado" },
      },
    }),

    // Lista de seguimientos pendientes
    prisma.lead.findMany({
      where: {
        fechaProximaAccion: { lte: endOfDay(hoy) },
        estadoLead: { not: "Archivado" },
      },
      orderBy: { fechaProximaAccion: "asc" },
      take: 6,
      select: { id: true, nombre: true, prioridad: true, estadoLead: true, fechaProximaAccion: true },
    }),

    // Leads que regresaron
    prisma.lead.count({
      where: { vecesRecibido: { gt: 1 }, estadoLead: { not: "Archivado" } },
    }),
  ]);

  // Tiempo promedio de primer contacto
  const contactoLeadIds = [...new Set(contactosRaw.map((a) => a.leadId))];
  let tiempoContactoMin: number | null = null;
  if (contactoLeadIds.length > 0) {
    const leadsContactados = await prisma.lead.findMany({
      where: { id: { in: contactoLeadIds } },
      select: { id: true, createdAt: true },
    });
    const createdAtMap = new Map(leadsContactados.map((l) => [l.id, l.createdAt]));
    const primerosContactos = new Map<string, Date>();
    for (const act of contactosRaw) {
      if (!primerosContactos.has(act.leadId)) primerosContactos.set(act.leadId, act.createdAt);
    }
    const diffs: number[] = [];
    for (const [id, contactoAt] of primerosContactos) {
      const creado = createdAtMap.get(id);
      if (creado) diffs.push(differenceInMinutes(contactoAt, creado));
    }
    if (diffs.length > 0) {
      tiempoContactoMin = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
    }
  }

  // % contactados de leads activos
  const totalActivos = sinContactar + contactados;
  const pctContactados = totalActivos > 0 ? Math.round((contactados / totalActivos) * 100) : 0;

  // Prioridades → objeto
  const prioridades: Record<string, number> = { Alta: 0, Media: 0, Baja: 0 };
  for (const r of prioridadRaw) prioridades[r.prioridad] = r._count.id;

  // Canales
  const fuenteMap: Record<string, { total: number; alta: number }> = {};
  for (const l of fuenteRaw) {
    if (!l.fuente) continue;
    fuenteMap[l.fuente] ??= { total: 0, alta: 0 };
    fuenteMap[l.fuente].total++;
    if (l.prioridad === "Alta") fuenteMap[l.fuente].alta++;
  }
  const fuenteStats = Object.entries(fuenteMap)
    .map(([fuente, s]) => ({
      fuente, ...s,
      pctAlta: s.total > 0 ? Math.round((s.alta / s.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    kpis: { nuevosHoy, sinContactar, candidatosCriticos, pctContactados, tiempoContactoMin, seguimientosHoy, regresaron },
    estados: { sinContactar, contactados, archivados },
    prioridades,
    categoriaRaw,
    urgentes,
    atorados,
    fuenteStats,
    seguimientosPendientes,
  };
}

function diasEsperando(fecha: Date) {
  const d = differenceInDays(new Date(), fecha);
  if (d === 0) return "Hoy";
  if (d === 1) return "1 día";
  return `${d} días`;
}

export default async function DashboardPage() {
  const { kpis, estados, prioridades, categoriaRaw, urgentes, atorados, fuenteStats, seguimientosPendientes } =
    await getDashboardData();

  const tiempoLabel = kpis.tiempoContactoMin !== null ? formatHoras(kpis.tiempoContactoMin) : "—";

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-primary">Dashboard</h1>
          <p className="text-sm text-muted mt-0.5 capitalize">
            {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>
        <Link
          href="/leads"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary-light transition-colors shrink-0"
        >
          Ver leads <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ── Fila 1: KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted uppercase tracking-wider">Hoy</p>
                <p className="text-2xl font-bold text-card-foreground mt-0.5">{kpis.nuevosHoy}</p>
              </div>
              <div className="rounded-lg bg-slate-100 dark:bg-slate-800/40 p-2.5">
                <Sparkles className="h-5 w-5 text-slate-500" />
              </div>
            </div>
            <p className="text-[10px] text-muted mt-2">Leads recibidos hoy</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted uppercase tracking-wider">Sin contactar</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{kpis.sinContactar}</p>
              </div>
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 p-2.5">
                <Inbox className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-[10px] text-muted mt-2">Nuevos esperando contacto</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted uppercase tracking-wider">Críticos {">"}24h</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-0.5">{kpis.candidatosCriticos}</p>
              </div>
              <div className="rounded-lg bg-red-50 dark:bg-red-950/40 p-2.5">
                <Flame className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-[10px] text-muted mt-2">Score ≥70 · {">"}24h sin contacto</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted uppercase tracking-wider">% contactados</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{kpis.pctContactados}%</p>
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-[10px] text-muted mt-2">De leads activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted uppercase tracking-wider">Primer contacto</p>
                <p className={`text-2xl font-bold mt-0.5 tabular-nums ${
                  kpis.tiempoContactoMin !== null && kpis.tiempoContactoMin <= 60
                    ? "text-emerald-600 dark:text-emerald-400"
                    : kpis.tiempoContactoMin !== null && kpis.tiempoContactoMin <= 240
                    ? "text-amber-600 dark:text-amber-400"
                    : kpis.tiempoContactoMin !== null
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground"
                }`}>{tiempoLabel}</p>
              </div>
              <div className="rounded-lg bg-primary/10 dark:bg-primary/20 p-2.5">
                <PhoneCall className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-[10px] text-muted mt-2">Promedio lead → primer contacto</p>
          </CardContent>
        </Card>

        <Card className={kpis.seguimientosHoy > 0 ? "border-amber-200 dark:border-amber-800" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted uppercase tracking-wider">Seguimientos</p>
                <p className={`text-2xl font-bold mt-0.5 ${kpis.seguimientosHoy > 0 ? "text-amber-600 dark:text-amber-400" : "text-card-foreground"}`}>
                  {kpis.seguimientosHoy}
                </p>
              </div>
              <div className={`rounded-lg p-2.5 ${kpis.seguimientosHoy > 0 ? "bg-amber-50 dark:bg-amber-950/40" : "bg-slate-100 dark:bg-slate-800/40"}`}>
                <Bell className={`h-5 w-5 ${kpis.seguimientosHoy > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}`} />
              </div>
            </div>
            <p className="text-[10px] text-muted mt-2">Pendientes para hoy o antes</p>
          </CardContent>
        </Card>

        <Card className={`col-span-2 lg:col-span-1 ${kpis.regresaron > 0 ? "border-violet-200 dark:border-violet-800" : ""}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted uppercase tracking-wider">Regresaron</p>
                <p className={`text-2xl font-bold mt-0.5 ${kpis.regresaron > 0 ? "text-violet-600 dark:text-violet-400" : "text-card-foreground"}`}>
                  {kpis.regresaron}
                </p>
              </div>
              <div className={`rounded-lg p-2.5 ${kpis.regresaron > 0 ? "bg-violet-50 dark:bg-violet-950/40" : "bg-slate-100 dark:bg-slate-800/40"}`}>
                <RefreshCw className={`h-5 w-5 ${kpis.regresaron > 0 ? "text-violet-600 dark:text-violet-400" : "text-slate-400"}`} />
              </div>
            </div>
            <p className="text-[10px] text-muted mt-2">Llenaron el form más de 1 vez</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Fila 2: estados + prioridades ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Estados */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted">Estado de leads</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Nuevo", count: estados.sinContactar, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30", href: "/leads?estado=Nuevo" },
                { label: "Contactado", count: estados.contactados, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30", href: "/leads?estado=Contactado" },
                { label: "Archivado", count: estados.archivados, color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800/40", href: "/leads?estado=Archivado" },
              ].map(({ label, count, color, bg, href }) => (
                <Link key={label} href={href} className="block">
                  <div className={`rounded-lg ${bg} px-3 py-3 text-center hover:opacity-80 transition-opacity`}>
                    <p className={`text-2xl font-bold ${color}`}>{count}</p>
                    <p className="text-[10px] text-muted mt-0.5">{label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Prioridades */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted">Prioridad (leads activos)</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Alta", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/30", href: "/leads?prioridad=Alta" },
                { label: "Media", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30", href: "/leads?prioridad=Media" },
                { label: "Baja", color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800/40", href: "/leads?prioridad=Baja" },
              ].map(({ label, color, bg, href }) => (
                <Link key={label} href={href} className="block">
                  <div className={`rounded-lg ${bg} px-3 py-3 text-center hover:opacity-80 transition-opacity`}>
                    <p className={`text-2xl font-bold ${color}`}>{prioridades[label] ?? 0}</p>
                    <p className="text-[10px] text-muted mt-0.5">{label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Contactar primero ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-red-500" />
              <CardTitle className="text-sm font-semibold">Contactar primero</CardTitle>
            </div>
            <Link href="/leads" className="text-xs font-medium text-primary hover:text-primary-light flex items-center gap-1 transition-colors">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Candidatos fuertes (score ≥70) sin contacto, ordenados por tiempo de espera.
            El badge &quot;Críticos&quot; de arriba solo cuenta los que llevan más de 24h.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          {urgentes.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400/60" />
              <p className="mt-2 text-sm text-muted">Sin candidatos fuertes pendientes</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {["Nombre", "Tema", "Ciudad", "Esperando", "Score", ""].map((h) => (
                      <th key={h} className="pb-2.5 pl-5 first:pl-5 last:pr-5 pr-4 text-left text-xs font-medium text-muted uppercase tracking-wider last:text-right">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {urgentes.map((lead) => {
                    const dias = differenceInDays(new Date(), new Date(lead.createdAt));
                    return (
                      <tr key={lead.id} className="border-b border-border/50 last:border-0 hover:bg-sidebar-accent/60 transition-colors">
                        <td className="py-3 pl-5 pr-4 font-medium text-card-foreground">{lead.nombre}</td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground">{lead.temaInteres}</td>
                        <td className="py-3 pr-4 text-xs text-muted-foreground">{lead.ciudad}</td>
                        <td className="py-3 pr-4 whitespace-nowrap">
                          <span className={`text-xs font-semibold tabular-nums ${dias >= 1 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
                            {diasEsperando(new Date(lead.createdAt))}
                          </span>
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap">
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {lead.scoreViabilidad ?? "—"}
                          </span>
                        </td>
                        <td className="py-3 pr-5 text-right">
                          <Link href={`/leads/${lead.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-light transition-colors">
                            Ver <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Fila inferior A: atorados + categorías ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leads atorados */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-500" />
              <CardTitle className="text-sm font-semibold">Leads atorados</CardTitle>
            </div>
            <p className="text-xs text-muted mt-0.5">Sin movimiento hace más de 7 días</p>
          </CardHeader>
          <CardContent className="pt-0">
            {atorados.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">Todos los leads están activos</p>
            ) : (
              <div className="space-y-2">
                {atorados.map((lead) => {
                  const diasSinMov = differenceInDays(new Date(), new Date(lead.updatedAt));
                  return (
                    <div key={lead.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-sidebar-accent/60 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-card-foreground truncate">{lead.nombre}</p>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${PRIORIDAD_COLORS[lead.prioridad] || ""}`}>{lead.prioridad}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted">{lead.estadoLead}</span>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">· {diasSinMov}d sin mov.</span>
                        </div>
                      </div>
                      <Link href={`/leads/${lead.id}`} className="shrink-0 text-xs font-medium text-primary hover:text-primary-light flex items-center gap-0.5 transition-colors">
                        Ver <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Por categoría */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Tipo de casos</CardTitle>
            </div>
            <p className="text-xs text-muted mt-0.5">Distribución de leads activos por categoría</p>
          </CardHeader>
          <CardContent className="pt-0">
            {categoriaRaw.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">Sin datos todavía</p>
            ) : (
              <div className="space-y-2">
                {categoriaRaw.map((r) => {
                  const total = categoriaRaw.reduce((s, x) => s + x._count.id, 0);
                  const pct   = total > 0 ? Math.round((r._count.id / total) * 100) : 0;
                  return (
                    <div key={r.categoria} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-card-foreground font-medium truncate">{r.categoria}</span>
                          <span className="text-xs text-muted tabular-nums ml-2 shrink-0">{r._count.id}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-border overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary/70"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-muted tabular-nums w-7 text-right shrink-0">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Fila inferior B: canales + asesores ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Canales */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-sm font-semibold">Canales de captación</CardTitle>
            </div>
            <p className="text-xs text-muted mt-0.5">Fuente de leads y % de prioridad alta</p>
          </CardHeader>
          <CardContent className="pt-0">
            {fuenteStats.length === 0 ? (
              <p className="text-xs text-muted py-4 text-center">Sin datos de fuente todavía</p>
            ) : (() => {
              const maxTotal = Math.max(...fuenteStats.map((f) => f.total));
              return (
                <div className="space-y-3">
                  {fuenteStats.map((f) => (
                    <div key={f.fuente} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-card-foreground capitalize">{f.fuente}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted tabular-nums">{f.total} leads</span>
                          <span className={`text-[11px] font-semibold tabular-nums ${
                            f.pctAlta >= 50 ? "text-emerald-600 dark:text-emerald-400"
                            : f.pctAlta >= 25 ? "text-amber-600 dark:text-amber-400"
                            : "text-muted-foreground"
                          }`}>
                            {f.pctAlta}% alta
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-400/70"
                          style={{ width: `${Math.round((f.total / maxTotal) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Seguimientos pendientes */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-sm font-semibold">Seguimientos pendientes</CardTitle>
            </div>
            <p className="text-xs text-muted mt-0.5">Leads con recordatorio para hoy o antes</p>
          </CardHeader>
          <CardContent className="pt-0">
            {seguimientosPendientes.length === 0 ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-400/60" />
                <p className="mt-2 text-xs text-muted">Sin seguimientos pendientes</p>
              </div>
            ) : (
              <div className="space-y-2">
                {seguimientosPendientes.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-card-foreground truncate">{lead.nombre}</p>
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                        {lead.fechaProximaAccion
                          ? format(new Date(lead.fechaProximaAccion), "d MMM", { locale: es })
                          : ""}
                        {" · "}{lead.estadoLead}
                      </p>
                    </div>
                    <Link href={`/leads/${lead.id}`} className="shrink-0 text-xs font-medium text-primary hover:text-primary-light flex items-center gap-0.5 transition-colors">
                      Ver <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
