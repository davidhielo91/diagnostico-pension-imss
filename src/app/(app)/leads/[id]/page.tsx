import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { LeadDetail } from "@/components/leads/lead-detail";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      telefono: true,
      correo: true,
      edad: true,
      ciudad: true,
      estado: true,
      yaEstaPensionado: true,
      temaInteres: true,
      tieneSemanasCotizadas: true,
      fuente: true,
      objetivoPrincipal: true,
      situacion: true,
      categoria: true,
      prioridad: true,
      viabilidad: true,
      estadoLead: true,
      userId: true,
      telefonoNormalizado: true,
      fechaUltimoContacto: true,
      fechaProximaAccion: true,
      vecesRecibido: true,
      segmentoInteres: true,
      createdAt: true,
      asignadoA: { select: { id: true, name: true } },
      activities: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          tipo: true,
          nota: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      },
      notes: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          contenido: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      },
    },
  });

  if (!lead) notFound();

  return <LeadDetail lead={lead} />;
}
