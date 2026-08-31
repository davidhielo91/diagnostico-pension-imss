import { prisma } from "./prisma";
import {
  LANDING_URL,
  SCORE_UMBRAL_FUERTE,
  SCORE_UMBRAL_REVISAR,
  PENSION_MINIMA_GARANTIZADA,
  ETIQUETAS_SCORE,
} from "./constants";
import { notificarNuevoLead, enviarConfirmacionCliente } from "./email";
import type { Lead } from "@prisma/client";

export interface LeadInput {
  nombre: string;
  telefono: string;
  correo?: string;
  edad: number;
  ciudad: string;
  estado?: string;
  yaEstaPensionado: string;
  temaInteres: string;
  tieneSemanasCotizadas?: string;
  fuente?: string;
  objetivoPrincipal?: string;
  situacion: string;
  createdAt?: Date;
}

interface ClassificationResult {
  categoria: string;
  prioridad: string;
  viabilidad: string;
}

export interface ScoreResult {
  score: number;
  etiqueta: string;
}

function detectarCategoria(input: LeadInput): string {
  const s = input.situacion.toLowerCase();
  const tema = input.temaInteres.toLowerCase();

  if (input.yaEstaPensionado === "si" && tema.includes("pensi") && s.includes("baja")) {
    return "Pensión baja Ley 73 probable";
  }
  if (/me pension[ée] a los 60|cesant[íi]a|pensi[óo]n baja|me pagan poco/.test(s)) {
    return "Cambio cesantía a vejez probable";
  }
  if (s.includes("invalidez")) {
    return "Invalidez";
  }
  if (/viudez|viuda|esposo fallecido/.test(s)) {
    return "Viudez";
  }
  if (tema.includes("modalidad 40")) {
    return "Modalidad 40";
  }
  if (tema.includes("modalidad 10")) {
    return "Modalidad 10";
  }
  if (tema.includes("ley 73")) {
    return "Ley 73";
  }
  if (tema.includes("ley 97")) {
    return "Ley 97";
  }

  return "Requiere revisión manual";
}

function detectarPrioridad(input: LeadInput): string {
  const s = input.situacion.toLowerCase();
  const tema = input.temaInteres.toLowerCase();

  const esUrgente = /urgente|ya me pension[ée]|no alcanza|no me alcanza|necesito ayuda urgente/.test(s);
  if (input.yaEstaPensionado === "si" && s.includes("baja")) return "Alta";
  if (s.includes("invalidez")) return "Alta";
  if (input.edad > 60) return "Alta";
  if (esUrgente) return "Alta";

  if (/modalidad 40|modalidad 10|ley 73|proyecci[óo]n/.test(tema)) return "Media";
  if (input.edad >= 50 && input.edad <= 60) return "Media";

  if (input.edad < 35) return "Baja";
  if (!input.objetivoPrincipal || input.objetivoPrincipal === "No estoy seguro") return "Baja";
  if (!input.situacion || input.situacion.length < 10) return "Baja";

  return "Media";
}

function detectarViabilidad(input: LeadInput): string {
  const s = input.situacion.toLowerCase();

  if (input.edad < 25) return "No viable por ahora";
  if (s.includes("solo quiero saber") && !s.includes("pensi")) return "No viable por ahora";

  const infoSuficiente =
    input.objetivoPrincipal &&
    input.objetivoPrincipal !== "No estoy seguro" &&
    input.situacion &&
    input.situacion.length > 15 &&
    input.tieneSemanasCotizadas === "si";

  if (infoSuficiente) return "Recomendar diagnóstico";
  if (input.edad >= 45 && input.edad <= 70) return "Recomendar diagnóstico";

  return "Necesita más información";
}

export function clasificarLead(input: LeadInput): ClassificationResult {
  return {
    categoria: detectarCategoria(input),
    prioridad: detectarPrioridad(input),
    viabilidad: detectarViabilidad(input),
  };
}

const OBJETIVOS_ESPECIFICOS_A = [
  "Saber cuánto podría recibir",
  "Revisar una pensión baja",
  "Modalidad 40",
  "Modalidad 10",
];

export function clasificarSegmentoInteres(input: LeadInput): string {
  const objetivo = input.objetivoPrincipal ?? "";
  const situacion = input.situacion ?? "";

  const objetivoEspecifico = OBJETIVOS_ESPECIFICOS_A.includes(objetivo);
  const tieneSemanas = input.tieneSemanasCotizadas === "si";
  const situacionDetallada = situacion.length >= 40;
  const objetivoVago = !objetivo || objetivo === "No estoy seguro";
  const situacionCorta = situacion.length < 20;

  // A: objetivo claro Y (tiene semanas cotizadas O describió bien su caso)
  if (objetivoEspecifico && (tieneSemanas || situacionDetallada)) {
    return "A";
  }

  // C: sin objetivo claro O descripción mínima
  if (objetivoVago || situacionCorta) {
    return "C";
  }

  // B: interesado pero con dudas
  return "B";
}

const PALABRAS_CLAVE_MONTO = /\b(pensi[óo]n|cheque|actual|me llega|recibo|pagan|paga)\b/;
const RE_SEMANAS = /\bsemanas?\b/;

function crearPatronDolar() { return /(\$[\d,.\s]*(?:\d[\d,.]*)?)/gi; }
function crearPatronMoneda() { return /(\d+(?:[.,]\d+)*)\s*(?:mensuales|pesos|MN\b|MXN)/gi; }

function normalizarNumero(raw: string): number {
  return parseFloat(raw.trim().replace(/\s/g, "").replace(/,/g, ""));
}

export function extraerMontoPension(texto: string): number | null {
  const lower = texto.toLowerCase();
  const matches: { valor: number; contexto: string }[] = [];

  let m: RegExpExecArray | null;

  const p1 = crearPatronDolar();
  while ((m = p1.exec(lower)) !== null) {
    const raw = m[1].replace(/[^0-9.,]/g, "");
    if (!raw) continue;
    const start = Math.max(0, m.index - 35);
    const end = Math.min(lower.length, m.index + m[0].length + 50);
    matches.push({ valor: normalizarNumero(raw), contexto: lower.slice(start, end) });
  }

  const p2 = crearPatronMoneda();
  while ((m = p2.exec(lower)) !== null) {
    const raw = m[1];
    if (!raw) continue;
    const start = Math.max(0, m.index - 35);
    const end = Math.min(lower.length, m.index + m[0].length + 50);
    matches.push({ valor: normalizarNumero(raw), contexto: lower.slice(start, end) });
  }

  if (matches.length === 0) return null;

  const sinSemanas = matches.filter((m) => !RE_SEMANAS.test(m.contexto));
  const candidatos = sinSemanas.length > 0 ? sinSemanas : matches;

  const conKeyword = candidatos.filter((m) => PALABRAS_CLAVE_MONTO.test(m.contexto));

  if (conKeyword.length > 0) {
    return Math.min(...conKeyword.map((m) => m.valor));
  }

  return Math.min(...candidatos.map((m) => m.valor));
}

export function calcularScoreViabilidad(
  input: LeadInput,
  categoria: string,
): ScoreResult {
  const tema = input.temaInteres.toLowerCase();
  const cat = categoria.toLowerCase();
  let score = 0;

  // Ley 73: +30
  if (tema === "ley 73" || cat.includes("ley 73")) {
    score += 30;
  }

  // Pensionado por cesantía o invalidez: +25
  if (
    input.yaEstaPensionado === "si" &&
    (cat.includes("cesant") || cat.includes("invalidez"))
  ) {
    score += 25;
  }

  // Pensión mencionada por debajo de la mínima garantizada: +25
  const monto = extraerMontoPension(input.situacion);
  if (monto !== null && monto < PENSION_MINIMA_GARANTIZADA) {
    score += 25;
  }

  // Edad 60-70: +10
  if (input.edad >= 60 && input.edad <= 70) {
    score += 10;
  }

  // Semanas cotizadas (proxy): +10
  if (input.tieneSemanasCotizadas === "si") {
    score += 10;
  }
  // TODO: cuando se tenga campo numérico de semanas, reemplazar proxy
  // con: if (semanasNumericas > 0) score += 10

  // Penalización: categoría sin datos → cap a 40
  if (
    categoria === "Requiere revisión manual" ||
    tema === "otro" || tema === "no sé" || tema === "no se"
  ) {
    score = Math.min(score, 40);
  }

  score = Math.max(0, Math.min(100, score));

  let etiqueta: string;
  if (score >= SCORE_UMBRAL_FUERTE) {
    etiqueta = ETIQUETAS_SCORE.FUERTE;
  } else if (score >= SCORE_UMBRAL_REVISAR) {
    etiqueta = ETIQUETAS_SCORE.REVISAR;
  } else {
    etiqueta = ETIQUETAS_SCORE.BAJA;
  }

  return { score, etiqueta };
}

export function normalizarTelefono(tel: string): string {
  const digits = tel.replace(/\D/g, "");
  // Strip Mexican country code: +52 makes 12 digits, remove leading 52
  if (digits.length === 12 && digits.startsWith("52")) {
    return digits.slice(2);
  }
  return digits;
}

export interface ClasificacionRecalculada {
  categoria: string;
  prioridad: string;
  viabilidad: string;
  segmentoInteres: string;
  score: number;
  etiqueta: string;
}

/**
 * Duplicate resubmissions use the latest public form as the source of truth
 * for every persisted fact that feeds automatic classification and scoring.
 */
export function recalcularClasificacion(input: LeadInput): ClasificacionRecalculada {
  const clasificacion = clasificarLead(input);
  const scoreResult = calcularScoreViabilidad(input, clasificacion.categoria);
  return {
    categoria: clasificacion.categoria,
    prioridad: clasificacion.prioridad,
    viabilidad: clasificacion.viabilidad,
    segmentoInteres: clasificarSegmentoInteres(input),
    score: scoreResult.score,
    etiqueta: scoreResult.etiqueta,
  };
}

async function encontrarLeadDuplicado(
  input: LeadInput,
  telNorm: string
): Promise<Lead | null> {
  const correoNorm = input.correo?.toLowerCase().trim() ?? null;

  return prisma.lead.findFirst({
    where: {
      OR: [
        { telefonoNormalizado: telNorm },
        { telefono: input.telefono },
        ...(correoNorm ? [{ correo: correoNorm }] : []),
      ],
    },
    orderBy: { createdAt: "asc" },
  });
}

async function manejarLeadDuplicado(
  existente: Lead,
  input: LeadInput
): Promise<Lead> {
  const recalculada = recalcularClasificacion(input);

  const updated = await prisma.lead.update({
    where: { id: existente.id },
    data: {
      vecesRecibido: { increment: 1 },
      // Keep every persisted classification fact in this same update aligned
      // with the fresh input used to derive the fields below. Manual category
      // changes subsequently score from these stored facts.
      edad: input.edad,
      yaEstaPensionado: input.yaEstaPensionado,
      temaInteres: input.temaInteres,
      tieneSemanasCotizadas: input.tieneSemanasCotizadas || null,
      objetivoPrincipal: input.objetivoPrincipal || null,
      situacion: input.situacion,
      fuente: input.fuente ?? existente.fuente,
      categoria: recalculada.categoria,
      prioridad: recalculada.prioridad,
      viabilidad: recalculada.viabilidad,
      segmentoInteres: recalculada.segmentoInteres,
      scoreViabilidad: recalculada.score,
      etiquetaViabilidad: recalculada.etiqueta,
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: existente.id,
      tipo: "formulario_reenviado",
      nota: `Volvió a enviar el formulario (${updated.vecesRecibido}ª vez). Fuente: ${input.fuente ?? "desconocida"} | Score: ${recalculada.score} (${recalculada.etiqueta})`,
    },
  });

  return updated;
}

async function asignarLeadAlAdmin(): Promise<string | null> {
  const admin = await prisma.user.findFirst({
    where: { role: "administrador", active: true },
    select: { id: true },
  });
  return admin?.id ?? null;
}

export async function crearLeadConClasificacion(
  input: LeadInput,
  { enviarNotificacion = true, saltarDuplicados = false }: { enviarNotificacion?: boolean; saltarDuplicados?: boolean } = {}
): Promise<{ lead: Lead; esDuplicado: boolean }> {
  const telNorm = normalizarTelefono(input.telefono);
  const duplicado = await encontrarLeadDuplicado(input, telNorm);

  if (duplicado) {
    if (saltarDuplicados) return { lead: duplicado, esDuplicado: true };
    const lead = await manejarLeadDuplicado(duplicado, input);
    return { lead, esDuplicado: true };
  }

  const clasificacion = clasificarLead(input);
  const scoreResult = calcularScoreViabilidad(input, clasificacion.categoria);
  const segmentoInteres = clasificarSegmentoInteres(input);
  const correoNorm = input.correo?.toLowerCase().trim() ?? null;
  const asignadoA = await asignarLeadAlAdmin();

  const lead = await prisma.lead.create({
    data: {
      nombre: input.nombre,
      telefono: input.telefono,
      correo: correoNorm,
      edad: input.edad,
      ciudad: input.ciudad,
      estado: input.estado || null,
      yaEstaPensionado: input.yaEstaPensionado,
      temaInteres: input.temaInteres,
      tieneSemanasCotizadas: input.tieneSemanasCotizadas || null,
      fuente: input.fuente || null,
      objetivoPrincipal: input.objetivoPrincipal || null,
      situacion: input.situacion,
      categoria: clasificacion.categoria,
      prioridad: clasificacion.prioridad,
      viabilidad: clasificacion.viabilidad,
      estadoLead: "Nuevo",
      telefonoNormalizado: telNorm,
      vecesRecibido: 1,
      scoreViabilidad: scoreResult.score,
      etiquetaViabilidad: scoreResult.etiqueta,
      segmentoInteres,
      userId: asignadoA,
      ...(input.createdAt ? { createdAt: input.createdAt } : {}),
    },
  });

  const asignadoName = asignadoA
    ? (await prisma.user.findUnique({ where: { id: asignadoA }, select: { name: true } }))?.name
    : null;

  await prisma.leadActivity.create({
    data: {
      leadId: lead.id,
      tipo: "lead_creado",
      nota: `Lead creado desde formulario público${asignadoName ? ` · Asignado a: ${asignadoName}` : ""}`,
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: lead.id,
      tipo: "clasificacion_automatica",
      nota: `Clasificado como: ${clasificacion.categoria} | Prioridad: ${clasificacion.prioridad} | Viabilidad: ${clasificacion.viabilidad} | Score: ${scoreResult.score} (${scoreResult.etiqueta}) | Grupo: ${segmentoInteres}`,
    },
  });

  if (enviarNotificacion) {
    notificarNuevoLead({
      nombre:      input.nombre,
      telefono:    input.telefono,
      edad:        input.edad,
      ciudad:      input.ciudad,
      temaInteres: input.temaInteres,
      situacion:   input.situacion,
      fuente:      input.fuente,
      categoria:   clasificacion.categoria,
      prioridad:   clasificacion.prioridad,
      score:       scoreResult.score,
      etiqueta:    scoreResult.etiqueta,
    }).catch((error) => {
      console.error("[email] Error enviando notificación de nuevo lead:", error);
    });

    if (correoNorm) {
      enviarConfirmacionCliente({
        nombre: input.nombre,
        correo: correoNorm,
      }).catch((error) => {
        console.error("[email] Error enviando confirmación al cliente:", error);
      });
    }

  }

  return { lead, esDuplicado: false };
}

export function generarCorreo(nombre: string, prioridad?: string): { asunto: string; cuerpo: string } {
  if (prioridad === "Alta") {
    return {
      asunto: "Revisamos su caso — Diagnóstico de Pensión IMSS",
      cuerpo: `Hola, ${nombre}.

Recibimos su información y la revisamos con atención. Por las características de su situación, le recomendamos conocer nuestro Diagnóstico de Pensión IMSS a la brevedad.

Aquí encuentra toda la información y puede agendar su cita directamente:

${LANDING_URL}

Despacho Fiscal 2087
Contador Gerardo Huerta`,
    };
  }

  if (prioridad === "Baja") {
    return {
      asunto: "Información sobre pensión IMSS — Despacho Fiscal 2087",
      cuerpo: `Hola, ${nombre}.

Recibimos su consulta sobre pensión IMSS. Cuando lo considere oportuno, aquí puede conocer en qué consiste nuestro Diagnóstico de Pensión IMSS y agendar su cita:

${LANDING_URL}

Despacho Fiscal 2087
Contador Gerardo Huerta`,
    };
  }

  return {
    asunto: "Revisión de su caso de pensión IMSS — Despacho Fiscal 2087",
    cuerpo: `Hola, ${nombre}.

Recibimos la información que nos compartió. Para conocer cómo podemos ayudarle y agendar su Diagnóstico de Pensión IMSS, aquí tiene toda la información:

${LANDING_URL}

Despacho Fiscal 2087
Contador Gerardo Huerta`,
  };
}

export function generarWhatsApp(nombre: string, telefonoNormalizado: string | null): { url: string | null; mensaje: string } {
  const primerNombre = nombre.trim().split(/\s+/)[0];
  const mensaje = `Buen día, ${primerNombre}. Le escribimos del despacho del Contador Gerardo Huerta. Recibimos su solicitud de prediagnóstico de pensión IMSS y con gusto la revisamos. ¿Le parece si agendamos para platicar su caso? Primero se revisa; después se decide.`;

  return {
    url: telefonoNormalizado
      ? `https://wa.me/52${telefonoNormalizado}?text=${encodeURIComponent(mensaje)}`
      : null,
    mensaje,
  };
}
