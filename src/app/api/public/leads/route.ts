import { NextRequest, NextResponse } from "next/server";
import { crearLeadConClasificacion } from "@/lib/classification";
import {
  TEMAS_INTERES,
  VALORES_SEMANAS_COTIZADAS,
  normalizarSemanasCotizadas,
} from "@/lib/constants";
import { enviarPushNotificacion } from "@/lib/push";
import { getTrustedRequestIp } from "@/lib/request-ip";

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const requestLog = new Map<string, number[]>();

// Rate limit por instancia — en despliegues multi-instancia o serverless
// este Map no se comparte entre procesos; migrar a Redis u otro store compartido.
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = requestLog.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) return false;

  recent.push(now);
  requestLog.set(ip, recent);

  // Elimina IPs sin actividad reciente para que el Map no crezca sin límite
  for (const [key, times] of requestLog) {
    if (!times.some((t) => now - t < RATE_LIMIT_WINDOW)) {
      requestLog.delete(key);
    }
  }

  return true;
}

const REQUIRED_FIELDS = [
  "nombre",
  "telefono",
  "edad",
  "ciudad",
  "yaEstaPensionado",
  "temaInteres",
  "situacion",
];

export async function POST(request: NextRequest) {
  const ip = getTrustedRequestIp(request.headers);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intente más tarde." },
      { status: 429 }
    );
  }

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "Content-Type debe ser application/json" },
      { status: 415 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "JSON inválido" },
      { status: 400 }
    );
  }

  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  for (const field of REQUIRED_FIELDS) {
    if (!body[field] || (typeof body[field] === "string" && !body[field].toString().trim())) {
      return NextResponse.json(
        { error: `El campo "${field}" es requerido` },
        { status: 400 }
      );
    }
  }

  const edad = parseInt(body.edad as string, 10);
  if (isNaN(edad) || edad < 18 || edad > 120) {
    return NextResponse.json(
      { error: "Edad inválida" },
      { status: 400 }
    );
  }

  if (!VALORES_SEMANAS_COTIZADAS.includes(body.yaEstaPensionado as typeof VALORES_SEMANAS_COTIZADAS[number])) {
    return NextResponse.json(
      { error: "yaEstaPensionado debe ser 'si', 'no' o 'no sé'" },
      { status: 400 }
    );
  }

  if (!TEMAS_INTERES.includes(body.temaInteres as typeof TEMAS_INTERES[number])) {
    return NextResponse.json({ error: "temaInteres debe ser un tema de interés válido" }, { status: 400 });
  }

  const semanasRaw = typeof body.tieneSemanasCotizadas === "string"
    ? body.tieneSemanasCotizadas
    : undefined;
  const tieneSemanasCotizadas = semanasRaw
    ? normalizarSemanasCotizadas(semanasRaw)
    : undefined;
  if (tieneSemanasCotizadas && !VALORES_SEMANAS_COTIZADAS.includes(tieneSemanasCotizadas as typeof VALORES_SEMANAS_COTIZADAS[number])) {
    return NextResponse.json({ error: "tieneSemanasCotizadas debe ser 'si', 'no' o 'no sé'" }, { status: 400 });
  }

  try {
    const { lead, esDuplicado } = await crearLeadConClasificacion({
      nombre: body.nombre as string,
      telefono: body.telefono as string,
      correo: (body.correo as string) || undefined,
      edad,
      ciudad: body.ciudad as string,
      estado: (body.estado as string) || undefined,
      yaEstaPensionado: body.yaEstaPensionado as string,
      temaInteres: body.temaInteres as string,
      tieneSemanasCotizadas,
      fuente: (body.fuente as string) || undefined,
      objetivoPrincipal: (body.objetivoPrincipal as string) || undefined,
      situacion: body.situacion as string,
    });

    if (!esDuplicado) {
      enviarPushNotificacion({
        title: `Nuevo lead · ${lead.prioridad} prioridad`,
        body: `${lead.nombre} · ${lead.temaInteres} · ${lead.ciudad}`,
        url: `/leads/${lead.id}`,
        id: lead.id,
      }, { userId: lead.userId }).catch(() => {});
    }

    return NextResponse.json(
      {
        success: true,
        message: esDuplicado
          ? "Información actualizada en tu expediente existente"
          : "Lead recibido correctamente",
        leadId: lead.id,
        esDuplicado,
      },
      { status: esDuplicado ? 200 : 201 }
    );
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
