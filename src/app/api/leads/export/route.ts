import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import * as XLSX from "xlsx";
import { sanitizeCellValue } from "@/lib/sanitize";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("No autorizado", { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const filters: Record<string, unknown> = {};
  if (searchParams.get("estado")) filters.estadoLead = searchParams.get("estado");
  if (searchParams.get("categoria")) filters.categoria = searchParams.get("categoria");
  if (searchParams.get("prioridad")) filters.prioridad = searchParams.get("prioridad");
  if (searchParams.get("fuente")) filters.fuente = searchParams.get("fuente");

  const busqueda = searchParams.get("busqueda");
  if (busqueda) {
    filters.OR = [
      { nombre: { contains: busqueda } },
      { correo: { contains: busqueda } },
      { telefono: { contains: busqueda } },
    ];
  }

  const leads = await prisma.lead.findMany({
    where: filters,
    orderBy: { createdAt: "desc" },
    include: { asignadoA: { select: { name: true } } },
  });

  const rows = leads.map((lead) => {
    const fila: Record<string, unknown> = {
      Nombre: lead.nombre,
      Teléfono: lead.telefono,
      Correo: lead.correo ?? "",
      Edad: lead.edad,
      Ciudad: lead.ciudad,
      Estado: lead.estado ?? "",
      ["¿Pensionado?"]: lead.yaEstaPensionado,
      ["Tema de interés"]: lead.temaInteres,
      ["Semanas cotizadas"]: lead.tieneSemanasCotizadas ?? "",
      Fuente: lead.fuente ?? "",
      ["Objetivo principal"]: lead.objetivoPrincipal ?? "",
      Situación: lead.situacion,
      Categoría: lead.categoria,
      Prioridad: lead.prioridad,
      Viabilidad: lead.viabilidad,
      ["Estado lead"]: lead.estadoLead,
      Asesor: lead.asignadoA?.name ?? "",
      ["Fecha creación"]: lead.createdAt.toISOString().split("T")[0],
      ["Último contacto"]: lead.fechaUltimoContacto?.toISOString().split("T")[0] ?? "",
      ["Próxima acción"]: lead.fechaProximaAccion?.toISOString().split("T")[0] ?? "",
      ["Notas internas"]: lead.notasInternas ?? "",
      ["Veces recibido"]: lead.vecesRecibido,
    };
    // D12: neutralizes formula injection (= + - @ tab CR) before the sheet is built.
    return Object.fromEntries(
      Object.entries(fila).map(([k, v]) => [k, sanitizeCellValue(v)])
    );
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
    wch: Math.max(key.length, 12),
  }));
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leads");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const filename = `leads_${new Date().toISOString().split("T")[0]}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
