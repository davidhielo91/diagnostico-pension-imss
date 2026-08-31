export const TEMAS_INTERES = [
  "Ley 73",
  "Ley 97",
  "Modalidad 40",
  "Modalidad 10",
  "Pensión baja",
  "Invalidez",
  "Viudez",
  "No sé",
  "Ya estoy pensionado / Pensión baja",
  "Otro",
  "Saber cuánto me tocaría de pensión",
  "Ya estoy pensionado",
  "Semanas cotizadas",
  "Saber cuánto le tocaría",
  "AFORE",
  "Conservación de derechos",
] as const;

export const VALORES_SEMANAS_COTIZADAS = ["si", "no", "no_sé"] as const;

export function normalizarSemanasCotizadas(value: string): string {
  if (value === "no_seguro" || value === "no_se") return "no_sé";
  return value;
}

export const OBJETIVOS_PRINCIPALES = [
  "Saber si ya me puedo pensionar",
  "Saber cuánto podría recibir",
  "Mejorar mi pensión",
  "Revisar una pensión baja",
  "Modalidad 40",
  "Modalidad 10",
  "No estoy seguro",
] as const;

export const ESTADOS_LEAD = [
  "Nuevo",
  "Contactado",
  "Archivado",
] as const;

export const CATEGORIAS_INTERNAS = [
  "Ley 73",
  "Ley 97",
  "Modalidad 40",
  "Modalidad 10",
  "Pensión baja Ley 73 probable",
  "Cambio cesantía a vejez probable",
  "Invalidez",
  "Viudez",
  "Beneficiarios",
  "No clasificado",
  "Requiere revisión manual",
  "No viable por ahora",
] as const;

export const PRIORIDADES = ["Alta", "Media", "Baja"] as const;

export const VIABILIDADES = [
  "Recomendar diagnóstico",
  "Necesita más información",
  "No viable por ahora",
  "Revisión manual",
] as const;

export const FUENTES = [
  "TikTok",
  "Facebook",
  "YouTube",
  "Google",
  "Recomendación",
  "Otro",
] as const;

export const TIPOS_ACTIVIDAD = [
  "lead_creado",
  "clasificacion_automatica",
  "formulario_reenviado",
  "whatsapp_enviado",
  "correo_enviado",
  "nota_agregada",
  "estado_cambiado",
  "archivado",
] as const;

export const ESTADOS_TERMINALES = ["Archivado"];

export const PRIORIDAD_COLORS: Record<string, string> = {
  "Alta": "text-red-600 bg-red-50 border-red-200",
  "Media": "text-amber-600 bg-amber-50 border-amber-200",
  "Baja": "text-slate-600 bg-slate-50 border-slate-200",
};

export const SCORE_COLORS: Record<string, string> = {
  "Candidato fuerte": "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800",
  "Revisar": "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-800",
  "Baja viabilidad": "text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-800/40 dark:border-slate-700",
};

export const SEGMENTOS = [
  "Todos",
  "Invalidez",
  "Ley 73",
  "Cambio cesantía",
  "Pensión baja",
  "Requiere revisión",
  "Regresaron",
] as const;

export const COSTO_POR_FUENTE: Record<string, number> = {
  Facebook: 0,
  TikTok: 0,
  YouTube: 0,
  Google: 0,
  Recomendación: 0,
  Otro: 0,
};

export const LANDING_URL = "https://pensiones.contadorgerardohuerta.com";

// Número del despacho para enlaces wa.me entrantes (click-to-chat).
// Formato: 52 + 10 dígitos, sin "+" ni espacios.
export const WHATSAPP_DESPACHO = "526563506014";

export function linkWhatsAppEntrante(mensaje: string): string {
  return `https://wa.me/${WHATSAPP_DESPACHO}?text=${encodeURIComponent(mensaje)}`;
}

export const SCORE_UMBRAL_FUERTE = 70;
export const SCORE_UMBRAL_REVISAR = 40;
export const PENSION_MINIMA_GARANTIZADA = 10_634;
export const HORAS_SIN_CONTACTO_CRITICO = 24;

export const ETIQUETAS_SCORE = {
  FUERTE: "Candidato fuerte",
  REVISAR: "Revisar",
  BAJA: "Baja viabilidad",
} as const;

export const ESTADO_COLORS: Record<string, string> = {
  "Nuevo":      "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-950/40 dark:border-blue-800",
  "Contactado": "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800",
  "Archivado":  "text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-800/40 dark:border-slate-700",
};

export const SEGMENTOS_INTERES = ["A", "B", "C"] as const;

export const SEGMENTO_INTERES_COLORS: Record<string, string> = {
  "A": "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800",
  "B": "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/40 dark:border-amber-800",
  "C": "text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-400 dark:bg-slate-800/40 dark:border-slate-700",
};

export const SEGMENTO_INTERES_LABELS: Record<string, string> = {
  "A": "Listo para comprar",
  "B": "Interesado con dudas",
  "C": "Curioso",
};
