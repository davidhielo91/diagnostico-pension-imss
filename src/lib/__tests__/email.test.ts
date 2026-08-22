import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }));

vi.mock("resend", () => {
  class ResendMock {
    emails = { send: sendMock };
  }
  return { Resend: ResendMock };
});

import { notificarNuevoLead, enviarConfirmacionCliente } from "@/lib/email";

beforeEach(() => {
  process.env.RESEND_API_KEY = "test-key";
  process.env.NOTIFICATION_EMAIL = "admin@test.com";
  sendMock.mockReset();
  sendMock.mockResolvedValue({ data: { id: "1" }, error: null });
});

afterEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.NOTIFICATION_EMAIL;
});

describe("notificarNuevoLead — HTML injection escaping", () => {
  it("escapes nombre, telefono, ciudad, temaInteres and situacion in the HTML body", async () => {
    const payload = {
      nombre: "<img src=x onerror=alert(1)>",
      telefono: "=cmd|'/C calc'!A0",
      ciudad: "@evil",
      edad: 45,
      temaInteres: "<script>alert('x')</script>",
      situacion: "<b>me pagan poco</b>",
      fuente: "Google",
      categoria: "Ley 73",
      prioridad: "Alta",
      score: 70,
      etiqueta: "Candidato fuerte",
    };

    await notificarNuevoLead(payload);

    expect(sendMock).toHaveBeenCalledTimes(1);
    const html = sendMock.mock.calls[0][0].html as string;
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).toContain("=cmd|&#39;/C calc&#39;!A0");
    expect(html).toContain("@evil");
    expect(html).toContain("&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;");
    expect(html).toContain("&lt;b&gt;me pagan poco&lt;/b&gt;");
  });

  it("never interpolates the raw user payload into the email", async () => {
    const payload = {
      nombre: "<img src=x onerror=alert(1)>",
      telefono: "5512345678",
      edad: 45,
      ciudad: "Ciudad Juárez",
      temaInteres: "<script>alert('x')</script>",
      situacion: "Quiero revisar mi pensión.",
      categoria: "Ley 73",
      prioridad: "Media",
      score: 50,
      etiqueta: "Revisar",
    };

    await notificarNuevoLead(payload);

    const html = sendMock.mock.calls[0][0].html as string;
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
  });

  it("escapes nombre and temaInteres in the subject line", async () => {
    await notificarNuevoLead({
      nombre: "Juan <b>Pérez</b>",
      telefono: "5512345678",
      edad: 45,
      ciudad: "Cd. Juárez",
      temaInteres: "Ley <i>73</i>",
      situacion: "situación normal",
      categoria: "Ley 73",
      prioridad: "Baja",
      score: 20,
      etiqueta: "Baja viabilidad",
    });

    const subject = sendMock.mock.calls[0][0].subject as string;
    expect(subject).toContain("Juan &lt;b&gt;Pérez&lt;/b&gt;");
    expect(subject).toContain("Ley &lt;i&gt;73&lt;/i&gt;");
    expect(subject).not.toContain("<b>");
  });

  it("keeps plain text unescaped so normal emails stay readable", async () => {
    await notificarNuevoLead({
      nombre: "Juan Pérez",
      telefono: "5512345678",
      edad: 45,
      ciudad: "Ciudad Juárez",
      temaInteres: "Ley 73",
      situacion: "Quiero saber si puedo pensionarme.",
      categoria: "Ley 73",
      prioridad: "Media",
      score: 50,
      etiqueta: "Revisar",
    });

    const html = sendMock.mock.calls[0][0].html as string;
    expect(html).toContain("Juan Pérez");
    expect(html).toContain("Ciudad Juárez");
    expect(html).toContain("Quiero saber si puedo pensionarme.");
  });
});

describe("enviarConfirmacionCliente — HTML injection escaping", () => {
  it("escapes the first name used in subject and body", async () => {
    await enviarConfirmacionCliente({
      nombre: "<script>alert(1)</script> Juan",
      correo: "cliente@example.com",
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
    const subject = sendMock.mock.calls[0][0].subject as string;
    const html = sendMock.mock.calls[0][0].html as string;

    expect(subject).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(subject).not.toContain("<script>");
  });

  it("keeps a plain name readable", async () => {
    await enviarConfirmacionCliente({
      nombre: "María López",
      correo: "maria@example.com",
    });

    const subject = sendMock.mock.calls[0][0].subject as string;
    expect(subject).toContain("María, recibimos tu información");
  });
});
