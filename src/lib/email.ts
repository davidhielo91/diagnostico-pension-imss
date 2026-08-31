import { Resend } from "resend";
import { LANDING_URL, linkWhatsAppEntrante, SCORE_UMBRAL_FUERTE, SCORE_UMBRAL_REVISAR } from "./constants";
import { escapeHtml } from "./sanitize";

export interface ConfirmacionClientePayload {
  nombre: string;
  correo: string;
}

export async function enviarConfirmacionCliente({ nombre, correo }: ConfirmacionClientePayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from   = process.env.RESEND_FROM_EMAIL ?? "noreply@contadorgerardohuerta.com";
  if (!apiKey) return;

  const resend = new Resend(apiKey);
  const primerNombre = nombre.split(" ")[0];
  const n = escapeHtml(primerNombre);
  const landingUrl = LANDING_URL;
  const whatsappUrl = linkWhatsAppEntrante(`Hola, soy ${primerNombre}. Llené el prediagnóstico de pensión IMSS y me gustaría que revisaran mi caso.`);

  await resend.emails.send({
    from: `Despacho Fiscal 2087 <${from}>`,
    to:   [correo],
    subject: `${n}, recibimos tu información — Diagnóstico de Pensión IMSS`,
    html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Confirmación</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#002144 0%,#003366 100%);border-radius:12px 12px 0 0;padding:32px 36px 28px">
              <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#7dd3fc;text-transform:uppercase;letter-spacing:1px">Despacho Fiscal 2087</p>
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3">Recibimos tu información</h1>
              <p style="margin:0;font-size:14px;color:#94a3b8">Diagnóstico de Pensión IMSS</p>
            </td>
          </tr>

          <!-- CUERPO -->
          <tr>
            <td style="background:#ffffff;padding:32px 36px">
              <p style="margin:0 0 16px;font-size:16px;color:#0f172a;font-weight:600">Hola, ${n}.</p>
              <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.7">
                Confirmamos que recibimos correctamente la información que nos enviaste sobre tu situación de pensión IMSS.
              </p>
              <p style="margin:0 0 16px;font-size:14px;color:#334155;line-height:1.7">
                Nuestro equipo está revisando tu caso. Pronto nos comunicaremos contigo — ya sea por <strong>WhatsApp</strong> o por <strong>correo electrónico</strong> — para orientarte de forma personalizada y explicarte cuáles podrían ser los siguientes pasos según tu situación.
              </p>
              <p style="margin:0 0 24px;font-size:14px;color:#334155;line-height:1.7">
                Si tienes alguna pregunta mientras tanto, no dudes en escribirnos directamente.
              </p>
              <p style="margin:0 0 24px;text-align:center">
                <a href="${whatsappUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;font-size:14px;font-weight:700;padding:13px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.3px">Escríbanos por WhatsApp</a>
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:8px;border-left:4px solid #002144">
                <tr>
                  <td style="padding:16px 20px">
                    <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.6px">¿Quieres saber más?</p>
                    <p style="margin:0;font-size:13px;color:#334155;line-height:1.6">
                      Conoce en qué consiste el Diagnóstico de Pensión IMSS:&nbsp;
                      <a href="${landingUrl}" style="color:#002144;font-weight:600;text-decoration:underline">ver información</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;padding:20px 36px;text-align:center">
              <p style="margin:0;font-size:13px;color:#0f172a;font-weight:600">Contador Gerardo Huerta</p>
              <p style="margin:4px 0 0;font-size:12px;color:#94a3b8;line-height:1.6">
                Despacho Fiscal 2087 &nbsp;·&nbsp; Diagnóstico de Pensión IMSS<br>
                Este correo es generado automáticamente.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}

export interface NuevoLeadPayload {
  nombre: string;
  telefono: string;
  edad: number;
  ciudad: string;
  temaInteres: string;
  situacion: string;
  fuente?: string;
  categoria: string;
  prioridad: string;
  score: number;
  etiqueta: string;
}

function normalizarDestinatarios(value: string): string[] {
  return [...new Set(value.split(",").map((address) => address.trim()).filter(Boolean))];
}

export async function notificarNuevoLead(lead: NuevoLeadPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to     = normalizarDestinatarios(process.env.NOTIFICATION_EMAIL ?? process.env.ADMIN_EMAIL ?? "");
  const from   = process.env.RESEND_FROM_EMAIL ?? "noreply@contadorgerardohuerta.com";
  if (!apiKey || to.length === 0) return;

  const resend = new Resend(apiKey);

  const prioridadMeta: Record<string, { bg: string; text: string; label: string }> = {
    Alta:  { bg: "#fef2f2", text: "#b91c1c", label: "🔴 Prioridad Alta" },
    Media: { bg: "#fffbeb", text: "#b45309", label: "🟡 Prioridad Media" },
    Baja:  { bg: "#f0fdf4", text: "#15803d", label: "🟢 Prioridad Baja" },
  };
  const prio = prioridadMeta[lead.prioridad] ?? { bg: "#f3f4f6", text: "#374151", label: lead.prioridad };

  const scoreMeta = lead.score >= SCORE_UMBRAL_FUERTE
    ? { bg: "#eff6ff", text: "#1d4ed8" }
    : lead.score >= SCORE_UMBRAL_REVISAR
    ? { bg: "#fffbeb", text: "#92400e" }
    : { bg: "#f9fafb", text: "#6b7280" };

  const situacionCorta =
    lead.situacion.length > 400 ? lead.situacion.slice(0, 400) + "…" : lead.situacion;

  const crmUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://pre-diagnostico.contadorgerardohuerta.com"}/leads`;
  const rawDigits = lead.telefono.replace(/\D/g, "");
  const tel10  = rawDigits.length === 12 && rawDigits.startsWith("52") ? rawDigits.slice(2) : rawDigits;
  const waUrl  = `https://wa.me/52${tel10}`;

  const nombreEscapado   = escapeHtml(lead.nombre);
  const telefonoEscapado = escapeHtml(lead.telefono);
  const ciudadEscapada   = escapeHtml(lead.ciudad);
  const temaEscapado     = escapeHtml(lead.temaInteres);
  const situacionEscapada = escapeHtml(situacionCorta);

  const fila = (label: string, value: string) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;width:140px">
        <span style="font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.6px">${label}</span>
      </td>
      <td style="padding:10px 0 10px 16px;border-bottom:1px solid #f1f5f9;vertical-align:top">
        <span style="font-size:14px;color:#1e293b;font-weight:500">${value}</span>
      </td>
    </tr>`;

  await resend.emails.send({
    from: `Gestor Leads IMSS <${from}>`,
    to,
    subject: `Nuevo lead: ${nombreEscapado} · ${temaEscapado}`,
    html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Nuevo Lead</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:40px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#002144 0%,#003366 100%);border-radius:12px 12px 0 0;padding:32px 36px 28px">
              <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#7dd3fc;text-transform:uppercase;letter-spacing:1px">Despacho Fiscal 2087</p>
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3">Nuevo Lead Recibido</h1>
              <p style="margin:0;font-size:14px;color:#94a3b8">Pre-Diagnóstico de Pensión IMSS</p>
            </td>
          </tr>

          <!-- NOMBRE + BADGES -->
          <tr>
            <td style="background:#ffffff;padding:28px 36px 0">
              <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f172a">${nombreEscapado}</h2>

              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:8px;padding-bottom:8px">
                    <span style="display:inline-block;background:${prio.bg};color:${prio.text};font-size:12px;font-weight:700;padding:5px 14px;border-radius:100px;white-space:nowrap">
                      ${prio.label}
                    </span>
                  </td>
                  <td style="padding-bottom:8px">
                    <span style="display:inline-block;background:${scoreMeta.bg};color:${scoreMeta.text};font-size:12px;font-weight:700;padding:5px 14px;border-radius:100px;white-space:nowrap">
                      Score ${lead.score} · ${lead.etiqueta}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DATOS -->
          <tr>
            <td style="background:#ffffff;padding:8px 36px 4px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${fila("Teléfono", `<a href="${waUrl}" style="color:#16a34a;text-decoration:none;font-weight:600">${telefonoEscapado} (WhatsApp)</a>`)}
                ${fila("Edad", `${lead.edad} años`)}
                ${fila("Ciudad", ciudadEscapada)}
                ${fila("Tema", temaEscapado)}
                ${fila("Categoría", lead.categoria)}
                ${fila("Fuente", lead.fuente ?? "Formulario web")}
              </table>
            </td>
          </tr>

          <!-- SITUACIÓN -->
          <tr>
            <td style="background:#ffffff;padding:20px 36px 28px">
              <p style="margin:0 0 10px;font-size:11px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.6px">Lo que comenta</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#f8fafc;border-left:4px solid #002144;border-radius:0 8px 8px 0;padding:14px 18px">
                    <p style="margin:0;font-size:14px;color:#334155;line-height:1.7">${situacionEscapada}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;padding:24px 36px;text-align:center">
              <a href="${crmUrl}"
                 style="display:inline-block;background:#002144;color:#ffffff;font-size:14px;font-weight:700;padding:13px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.3px">
                Ver lead en el CRM →
              </a>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8fafc;border-radius:0 0 12px 12px;padding:18px 36px;text-align:center">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6">
                Despacho Fiscal 2087 &nbsp;·&nbsp; Sistema de Gestión de Leads<br>
                Este correo es generado automáticamente. No responder.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`,
  });
}
