import { LANDING_URL } from "./constants";

const MISTRAL_BASE = "https://api.mistral.ai/v1/chat/completions";

interface MistralMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface MistralOptions {
  model?: string;
  max_tokens?: number;
  temperature?: number;
  response_format?: { type: "json_object" };
}

async function mistral(messages: MistralMessage[], options: MistralOptions = {}): Promise<string> {
  const res = await fetch(MISTRAL_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model ?? "mistral-small-latest",
      messages,
      max_tokens: options.max_tokens ?? 500,
      temperature: options.temperature ?? 0.7,
      ...(options.response_format ? { response_format: options.response_format } : {}),
    }),
  });

  if (!res.ok) throw new Error(`Mistral API error: ${res.status}`);

  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content?.trim() ?? "";
}

const FRASES_PROHIBIDAS_MARCA = [
  "garantiz",
  "asegur",
  "le va a subir",
  "le subirá",
  "le subiremos",
  "recálculo automático",
  "aumento asegurado",
  "pensión va a subir",
  "pensión aumentará",
  "va a aumentar",
  "aumentar",
  "casos de éxito",
  "mejor beneficio",
  "máximo beneficio",
  "transparencia",
  "te ayudamos con todo",
  "el mejor",
  "el más completo",
  "único en méxico",
  "sin costo",
  "sin cargo",
  "gratis",
  "gratuit",
];

export function violaReglasVoz(texto: string): boolean {
  const lower = texto.toLowerCase();
  return FRASES_PROHIBIDAS_MARCA.some((f) => lower.includes(f));
}

const ADVERTENCIA_REINTENTO = `ADVERTENCIA CRÍTICA: El texto anterior contiene frases prohibidas.
Reescribe el mensaje desde cero.
NUNCA digas que la pensión va a subir, va a aumentar o que hay un recálculo automático.
NUNCA garantices montos ni resultados. Cada caso es individual y solo se determina tras la revisión.
Sigue todas las reglas anteriores al pie de la letra.`;

export interface LeadParaMensaje {
  nombre: string;
  edad: number;
  ciudad: string;
  temaInteres: string;
  situacion: string;
  categoria: string;
  prioridad: string;
  yaEstaPensionado: string;
  objetivoPrincipal?: string | null;
}

export async function generarResumenConIA(lead: LeadParaMensaje & { viabilidad: string; scoreViabilidad?: number | null }): Promise<string> {
  const yaEstaP =
    lead.yaEstaPensionado === "si" ? "ya está pensionado" :
    lead.yaEstaPensionado === "no" ? "aún no está pensionado" :
    "no sabe si está pensionado";

  const prompt = `Eres parte del equipo del Despacho Fiscal 2087, especializado en pensiones IMSS.
Redacta un párrafo de resumen interno del caso de este prospecto para que el Contador Gerardo Huerta pueda revisar rápidamente los puntos clave antes de atenderlo.

DATOS DEL PROSPECTO:
- Nombre: ${lead.nombre}
- Edad: ${lead.edad} años
- Ciudad: ${lead.ciudad}
- Tema de interés: ${lead.temaInteres}
- Situación de pensión: ${yaEstaP}
- Lo que comentó: "${lead.situacion}"
${lead.objetivoPrincipal ? `- Objetivo declarado: ${lead.objetivoPrincipal}` : ""}
- Categoría interna: ${lead.categoria}
- Prioridad: ${lead.prioridad}
- Viabilidad: ${lead.viabilidad}

REGLAS:
- Un solo párrafo, máximo 5 oraciones.
- Escrito en tercera persona (él/ella), no dirigido al prospecto.
- Resume: quién es, qué quiere saber, su situación respecto a la pensión, y qué tan viable parece el caso.
- Tono objetivo, sin adornos ni frases de venta.
- No inventes datos que no estén en los campos anteriores.
- No uses bullet points. Solo el párrafo.`;

  return mistral([{ role: "user", content: prompt }], { max_tokens: 300, temperature: 0.4 });
}

export async function generarCorreoConIA(lead: LeadParaMensaje): Promise<{ asunto: string; cuerpo: string }> {
  const yaEstaP =
    lead.yaEstaPensionado === "si" ? "ya está pensionado" :
    lead.yaEstaPensionado === "no" ? "aún no está pensionado" :
    "no sabe si está pensionado";

  const prompt = `Eres parte del equipo del Despacho Fiscal 2087, despacho especializado en pensiones IMSS dirigido por el Contador Gerardo Huerta, con sede en Ciudad Juárez, Chihuahua.

Tu tarea es redactar el correo de primer contacto con un prospecto que dejó sus datos.

DATOS DEL PROSPECTO:
- Nombre: ${lead.nombre.split(" ")[0]}
- Tema de interés: ${lead.temaInteres}
- Edad: ${lead.edad} años
- Ciudad: ${lead.ciudad}
- Situación de pensión: ${yaEstaP}
- Lo que comentó: "${lead.situacion}"
${lead.objetivoPrincipal ? `- Objetivo: ${lead.objetivoPrincipal}` : ""}

REGLAS DE CONTENIDO:
- 3 párrafos cortos. Máximo 3 oraciones por párrafo.
- Escribe en nombre del despacho (nosotros), NO en nombre personal del contador.
- Tono: directo, claro, cercano. Sin tecnicismos innecesarios. Sin exagerar.

ESTRUCTURA OBLIGATORIA:
- Párrafo 1: saluda al prospecto por su nombre, confirma que recibimos su consulta y reconoce brevemente su situación o tema de interés sin asumir nada que no se dijo.
- Párrafo 2: explica qué puede revisar el despacho en un diagnóstico de pensión IMSS (semanas cotizadas, ley aplicable, AFORE, conservación de derechos, monto estimado). NO prometas resultados ni montos. NO uses ejemplos numéricos específicos.
- Párrafo 3: invita a dar el siguiente paso con una frase clara y directa. Menciona que al agendar su cita, el prospecto será atendido personalmente por el Contador Gerardo Huerta. El enlace lleva a una página donde puede conocer en qué consiste el diagnóstico y cómo agendar su cita. Incluye el enlace: ${LANDING_URL}

CIERRE FIJO (copia exacto):
Atentamente,
Equipo del Despacho Fiscal 2087
Contador Gerardo Huerta

PALABRAS Y FRASES PROHIBIDAS:
- "casos de éxito"
- "garantizamos" / "aseguramos" / "te garantizo" / "aumento asegurado"
- "el mejor beneficio" / "máximo beneficio"
- "transparencia y compromiso" / "con toda la transparencia"
- "recálculo automático" / "le va a subir" / "le subirá" / "va a aumentar" / "su pensión va a subir" / "su pensión aumentará" — NUNCA prometas que la pensión va a aumentar ni garantices montos
- "no te preocupes, nosotros te ayudamos con todo"
- Superlativos vacíos: "el mejor", "el más completo", "único en México"
- Signos de exclamación en exceso
- "sin costo" / "gratis" / "gratuito" / "sin cargo" / "de forma gratuita" (el diagnóstico tiene costo, no ofrecer nada gratuito)

TRATO Y TONO:
- Usa siempre "usted" para dirigirte al prospecto. Nunca uses "tú", "te", "tu" ni "tus" en segunda persona.
${(lead.temaInteres?.toLowerCase().includes("viudez") || lead.categoria?.toLowerCase().includes("viudez")) ? "- NOTA VIUDEZ: La pensión por viudez es una pensión derivada; en la mayoría de los casos no aplica el mismo tipo de revisión de monto. Sé honesto, no generes expectativas de aumento para este caso." : ""}

PRINCIPIO RECTOR DE LA MARCA:
Primero se revisa. Después se decide.
No se promete lo que no se puede demostrar.
Cada caso es diferente y debe analizarse de forma individual.

NO hagas preguntas al final del correo.
NO uses bullet points dentro del cuerpo del correo.
NO repitas el tema de interés con tecnicismos si el prospecto dijo "no sé por dónde empezar".

Responde ÚNICAMENTE con un JSON válido con este formato exacto (sin markdown, sin bloques de código):
{"asunto":"...","cuerpo":"..."}

El asunto debe ser máximo 60 caracteres, directo, menciona su tema de pensión, sin signos de exclamación.`;

  const fallbackCorreo = {
    asunto: `Su consulta de pensión IMSS — Despacho Fiscal 2087`,
    cuerpo: `Hola, ${lead.nombre.split(" ")[0]}.\n\nRecibimos su consulta sobre pensión IMSS. En el Despacho Fiscal 2087 podemos hacer una revisión detallada de su situación para que usted cuente con información clara antes de tomar cualquier decisión.\n\nPara conocer en qué consiste el Diagnóstico de Pensión IMSS y agendar su cita con el Contador Gerardo Huerta, aquí tiene más información: ${LANDING_URL}\n\nAtentamente,\nEquipo del Despacho Fiscal 2087\nContador Gerardo Huerta`,
  };

  async function llamarCorreo(msgs: MistralMessage[]): Promise<{ asunto: string; cuerpo: string }> {
    const raw = await mistral(msgs, {
      max_tokens: 800,
      temperature: 0.7,
      response_format: { type: "json_object" },
    });
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const parsed = JSON.parse(clean) as { asunto?: string; cuerpo?: string };
    return { asunto: parsed.asunto ?? "", cuerpo: parsed.cuerpo ?? "" };
  }

  const msgs: MistralMessage[] = [{ role: "user", content: prompt }];
  let resultado: { asunto: string; cuerpo: string };
  try {
    resultado = await llamarCorreo(msgs);
  } catch (err) {
    console.error(`[ai] generarCorreoConIA: fallo en primer intento para "${lead.nombre}", usando fallback`, err);
    return fallbackCorreo;
  }

  if (violaReglasVoz(resultado.asunto + " " + resultado.cuerpo)) {
    const msgsRetry: MistralMessage[] = [
      ...msgs,
      { role: "assistant", content: JSON.stringify(resultado) },
      { role: "user", content: ADVERTENCIA_REINTENTO },
    ];
    try {
      resultado = await llamarCorreo(msgsRetry);
    } catch (err) {
      console.error(`[ai] generarCorreoConIA: fallo en reintento para "${lead.nombre}", usando fallback`, err);
      return fallbackCorreo;
    }
    if (violaReglasVoz(resultado.asunto + " " + resultado.cuerpo)) {
      console.warn(`[ai] generarCorreoConIA: el reintento volvió a violar la voz de marca para "${lead.nombre}", usando fallback`);
      return fallbackCorreo;
    }
  }

  return resultado;
}
