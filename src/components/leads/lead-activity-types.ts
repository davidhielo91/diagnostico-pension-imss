import {
  User,
  Tag,
  RotateCcw,
  MessageSquare,
  Mail,
  FileText,
  Archive,
  History,
} from "lucide-react";

export const TIPO_LABELS: Record<string, string> = {
  lead_creado:             "Lead creado",
  clasificacion_automatica:"Clasificación automática",
  formulario_reenviado:    "Volvió a enviar formulario",
  whatsapp_enviado:        "WhatsApp enviado",
  correo_enviado:          "Correo enviado",
  nota_agregada:           "Nota agregada",
  estado_cambiado:         "Estado cambiado",
  archivado:               "Archivado",
};

export const TIPO_ICONS: Record<string, React.ElementType> = {
  lead_creado:             User,
  clasificacion_automatica:Tag,
  formulario_reenviado:    RotateCcw,
  whatsapp_enviado:        MessageSquare,
  correo_enviado:          Mail,
  nota_agregada:           FileText,
  estado_cambiado:         Tag,
  archivado:               Archive,
};

export const TIPO_COLORS: Record<string, string> = {
  lead_creado:             "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
  clasificacion_automatica:"bg-slate-100 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400",
  formulario_reenviado:    "bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400",
  whatsapp_enviado:        "bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-400",
  correo_enviado:          "bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400",
  nota_agregada:           "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
  estado_cambiado:         "bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
  archivado:               "bg-slate-100 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400",
};

export const DEFAULT_TIPO_ICON = History;
export const DEFAULT_TIPO_COLOR = "bg-slate-100 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400";
