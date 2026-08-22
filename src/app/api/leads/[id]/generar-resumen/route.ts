import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generarResumenConIA } from "@/lib/ai";

/**
 * D13: the client only ever sees a generic message; the raw error detail is
 * logged server-side so operators can debug without leaking internals.
 */
export function formatearErrorResumen(err: unknown): string {
  const detalle =
    err instanceof Error ? err.message :
    typeof err === "string" ? err :
    "Error desconocido";
  console.error(`[generar-resumen] Error interno: ${detalle}`);
  return "No pudimos generar el resumen. Inténtalo de nuevo.";
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!process.env.MISTRAL_API_KEY) {
    return NextResponse.json({ error: "Mistral no configurado" }, { status: 503 });
  }

  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      nombre: true,
      edad: true,
      ciudad: true,
      temaInteres: true,
      situacion: true,
      categoria: true,
      prioridad: true,
      viabilidad: true,
      scoreViabilidad: true,
      yaEstaPensionado: true,
      objetivoPrincipal: true,
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
  }

  try {
    const resumen = await generarResumenConIA(lead);
    await prisma.lead.update({ where: { id }, data: { resumenIA: resumen } });
    return NextResponse.json({ resumen });
  } catch (err) {
    return NextResponse.json({ error: formatearErrorResumen(err) }, { status: 500 });
  }
}
