export type FilterField = {
  placeholder: string;
  paramKey: string;
  options: string[];
  optionLabels?: string[];
};

export interface LeadWithUser {
  id: string;
  nombre: string;
  edad: number;
  temaInteres: string;
  fuente: string | null;
  categoria: string;
  prioridad: string;
  estadoLead: string;
  createdAt: Date;
  scoreViabilidad: number | null;
  etiquetaViabilidad: string | null;
  fechaUltimoContacto: Date | null;
  vecesRecibido: number;
  segmentoInteres?: string | null;
}
