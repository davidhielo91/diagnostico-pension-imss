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

export interface LeadDetailData {
  id: string;
  nombre: string;
  telefono: string;
  correo: string | null;
  edad: number;
  ciudad: string;
  estado: string | null;
  yaEstaPensionado: string;
  temaInteres: string;
  tieneSemanasCotizadas: string | null;
  fuente: string | null;
  objetivoPrincipal: string | null;
  situacion: string;
  categoria: string;
  prioridad: string;
  viabilidad: string;
  estadoLead: string;
  userId: string | null;
  telefonoNormalizado: string | null;
  fechaUltimoContacto: Date | null;
  fechaProximaAccion: Date | null;
  vecesRecibido: number;
  resumenIA: string | null;
  segmentoInteres?: string | null;
  createdAt: Date;
  asignadoA: { id: string; name: string } | null;
  activities: Array<{
    id: string;
    tipo: string;
    nota: string | null;
    createdAt: Date;
    user: { name: string } | null;
  }>;
  notes: Array<{
    id: string;
    contenido: string;
    createdAt: Date;
    user: { name: string } | null;
  }>;
}
