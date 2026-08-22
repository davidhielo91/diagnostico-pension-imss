import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aviso de Privacidad | Despacho Fiscal 2087",
  description: "Aviso de privacidad conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).",
  robots: { index: true, follow: true },
};

const SECCION: React.CSSProperties = {
  marginBottom: "2rem",
};

const H2: React.CSSProperties = {
  fontSize: "1.1rem",
  fontWeight: 700,
  color: "var(--navy)",
  marginBottom: "0.6rem",
  marginTop: "2rem",
};

const P: React.CSSProperties = {
  color: "var(--text-secondary)",
  fontSize: "0.97rem",
  lineHeight: 1.8,
  marginBottom: "0.75rem",
};

const UL: React.CSSProperties = {
  color: "var(--text-secondary)",
  fontSize: "0.97rem",
  lineHeight: 1.8,
  paddingLeft: "1.5rem",
  marginBottom: "0.75rem",
};

export default function AvisoPrivacidadPage() {
  return (
    <>
      <header className="site-header" role="banner">
        <div className="container header-inner">
          <div className="brand">
            <span className="brand-name">Contador Gerardo Huerta</span>
            <span className="brand-sep" aria-hidden="true">|</span>
            <span className="brand-tagline">Pensiones IMSS y Jubilaciones</span>
          </div>
        </div>
      </header>

      <main
        id="contenido-principal"
        style={{ flex: 1, background: "var(--surface-light)", padding: "3rem 1.5rem 4rem" }}
      >
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            background: "var(--surface-white)",
            borderRadius: "var(--radius-xl)",
            border: "1.5px solid var(--border-light)",
            padding: "clamp(2rem, 5vw, 3.5rem)",
            boxShadow: "0 20px 60px rgba(0,33,68,0.07)",
          }}
        >
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
            Última actualización: junio de 2025
          </p>
          <h1
            style={{
              fontSize: "clamp(1.5rem, 4vw, 2rem)",
              color: "var(--navy)",
              fontWeight: 900,
              marginBottom: "0.5rem",
              lineHeight: 1.2,
            }}
          >
            Aviso de Privacidad
          </h1>
          <p style={{ ...P, marginBottom: "2rem" }}>
            Conforme a lo establecido en la{" "}
            <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares</strong>{" "}
            (LFPDPPP) y su Reglamento, el Despacho Fiscal 2087 pone a su disposición el presente
            Aviso de Privacidad.
          </p>

          {/* 1. Identidad del Responsable */}
          <section style={SECCION}>
            <h2 style={H2}>1. Identidad y domicilio del Responsable</h2>
            <p style={P}>
              El responsable del tratamiento de sus datos personales es:
            </p>
            <p style={P}>
              <strong>Gerardo Huerta</strong>, que opera bajo el nombre comercial{" "}
              <strong>Despacho Fiscal 2087</strong>, con domicilio en:
            </p>
            <p style={{ ...P, paddingLeft: "1rem", borderLeft: "3px solid var(--border-mid)" }}>
              C. Toronja Roja 6275, Ampliación Aeropuerto<br />
              C.P. 32698, Ciudad Juárez, Chihuahua, México
            </p>
            <p style={P}>
              Correo de contacto:{" "}
              <a
                href="mailto:contacto@contadorgerardohuerta.com"
                style={{ color: "var(--navy)", fontWeight: 600 }}
              >
                contacto@contadorgerardohuerta.com
              </a>
            </p>
          </section>

          {/* 2. Datos recabados */}
          <section style={SECCION}>
            <h2 style={H2}>2. Datos personales que recabamos</h2>
            <p style={P}>
              A través de nuestro formulario de contacto recopilamos los siguientes datos personales:
            </p>
            <ul style={UL}>
              <li>Nombre completo</li>
              <li>Número de teléfono (WhatsApp)</li>
              <li>Correo electrónico</li>
              <li>Edad</li>
              <li>Ciudad y estado de residencia</li>
              <li>Situación respecto a su pensión IMSS (si ya está pensionado o no)</li>
              <li>Tema de interés relacionado con su pensión</li>
              <li>Descripción de su situación o duda (campo libre)</li>
              <li>Objetivo principal respecto a su pensión</li>
              <li>Si cuenta con reporte de semanas cotizadas</li>
              <li>Medio por el que nos encontró</li>
            </ul>
            <p style={{ ...P, background: "var(--gold-pale)", border: "1.5px solid var(--gold-light)", borderRadius: "var(--radius-sm)", padding: "0.9rem 1.1rem", marginTop: "0.75rem" }}>
              <strong>Datos financieros y patrimoniales:</strong> La información relativa a su pensión,
              semanas cotizadas, modalidad de cotización o montos de pensión tiene carácter patrimonial y
              financiero. Su tratamiento se realiza exclusivamente para los fines descritos en este aviso,
              con las medidas de seguridad adecuadas para su protección.
            </p>
          </section>

          {/* 3. Finalidades */}
          <section style={SECCION}>
            <h2 style={H2}>3. Finalidades del tratamiento</h2>
            <p style={P}><strong>Finalidades primarias</strong> (necesarias para el servicio):</p>
            <ul style={UL}>
              <li>
                Evaluar y clasificar su consulta para determinar si el Despacho Fiscal 2087 puede
                orientarle respecto a su situación de pensión IMSS.
              </li>
              <li>Contactarle por WhatsApp o correo electrónico para brindarle información sobre
                el diagnóstico de pensión y los pasos a seguir.</li>
              <li>Agendar y llevar a cabo una cita de diagnóstico personalizado.</li>
            </ul>
            <p style={P}><strong>Finalidades secundarias</strong> (puede oponerse sin consecuencias al servicio):</p>
            <ul style={UL}>
              <li>
                Envío de información general sobre pensiones IMSS, reformas o temas relacionados
                que puedan ser de su interés.
              </li>
            </ul>
            <p style={P}>
              Si no desea que sus datos sean utilizados para las finalidades secundarias, puede
              manifestarlo enviando un correo a{" "}
              <a href="mailto:contacto@contadorgerardohuerta.com" style={{ color: "var(--navy)", fontWeight: 600 }}>
                contacto@contadorgerardohuerta.com
              </a>{" "}
              con el asunto <em>&quot;Oposición a finalidades secundarias&quot;</em>.
            </p>
          </section>

          {/* 4. Transferencias */}
          <section style={SECCION}>
            <h2 style={H2}>4. Transferencia de datos personales</h2>
            <p style={P}>
              Sus datos personales <strong>no serán compartidos con terceros</strong> para fines
              propios de esos terceros, salvo en los casos previstos por la LFPDPPP.
            </p>
            <p style={P}>
              Para la operación del servicio utilizamos proveedores tecnológicos que actúan como
              encargados del tratamiento y están sujetos a obligaciones de confidencialidad:
            </p>
            <ul style={UL}>
              <li>
                <strong>Resend</strong> — servicio de envío de correos transaccionales. Solo
                recibe la dirección de correo y el contenido del mensaje de confirmación.
              </li>
              <li>
                <strong>Mistral AI</strong> — servicio de inteligencia artificial utilizado
                internamente para redactar mensajes de seguimiento. Procesa datos de forma
                transitoria sin almacenamiento permanente.
              </li>
            </ul>
          </section>

          {/* 5. Derechos ARCO */}
          <section style={SECCION}>
            <h2 style={H2}>5. Derechos ARCO y cómo ejercerlos</h2>
            <p style={P}>
              Usted tiene derecho a <strong>Acceder</strong>, <strong>Rectificar</strong>,{" "}
              <strong>Cancelar</strong> u <strong>Oponerse</strong> (derechos ARCO) al tratamiento
              de sus datos personales.
            </p>
            <p style={P}>Para ejercer cualquiera de estos derechos, envíe una solicitud a:</p>
            <p style={{ ...P, paddingLeft: "1rem", borderLeft: "3px solid var(--border-mid)" }}>
              <strong>Correo:</strong>{" "}
              <a href="mailto:contacto@contadorgerardohuerta.com" style={{ color: "var(--navy)", fontWeight: 600 }}>
                contacto@contadorgerardohuerta.com
              </a>
              <br />
              <strong>Asunto:</strong> Ejercicio de derechos ARCO
            </p>
            <p style={P}>Su solicitud deberá incluir:</p>
            <ul style={UL}>
              <li>Nombre completo e identificación oficial.</li>
              <li>Descripción clara del derecho que desea ejercer y los datos a los que se refiere.</li>
              <li>Cualquier información que facilite la localización de sus datos.</li>
            </ul>
            <p style={P}>
              Responderemos en un plazo máximo de <strong>20 días hábiles</strong> a partir de la
              recepción de su solicitud.
            </p>
          </section>

          {/* 6. Consentimiento */}
          <section style={SECCION}>
            <h2 style={H2}>6. Consentimiento</h2>
            <p style={P}>
              Al completar y enviar el formulario de contacto en nuestro sitio web, usted manifiesta
              su consentimiento libre, específico e informado para el tratamiento de sus datos
              personales conforme a las finalidades primarias descritas en este aviso.
            </p>
            <p style={P}>
              El consentimiento es <strong>voluntario</strong>. Sin embargo, sin él no es posible
              evaluar su caso ni brindarle orientación personalizada, ya que los datos son necesarios
              para prestar el servicio.
            </p>
          </section>

          {/* 7. Medidas de seguridad */}
          <section style={SECCION}>
            <h2 style={H2}>7. Medidas de seguridad</h2>
            <p style={P}>
              El Despacho Fiscal 2087 implementa medidas técnicas, administrativas y físicas para
              proteger sus datos personales contra daño, pérdida, alteración o acceso no autorizado.
              El acceso a la información está restringido únicamente al personal autorizado.
            </p>
          </section>

          {/* 8. Modificaciones */}
          <section style={SECCION}>
            <h2 style={H2}>8. Modificaciones al aviso de privacidad</h2>
            <p style={P}>
              Nos reservamos el derecho de actualizar o modificar este Aviso de Privacidad en
              cualquier momento. Los cambios se publicarán en esta misma página. Le recomendamos
              consultarla periódicamente. La fecha de la última actualización aparece al inicio
              de este documento.
            </p>
          </section>

          {/* 9. INAI */}
          <section style={SECCION}>
            <h2 style={H2}>9. Autoridad competente</h2>
            <p style={P}>
              Si considera que el Despacho Fiscal 2087 no ha atendido debidamente su solicitud o el
              ejercicio de sus derechos ARCO, puede acudir al{" "}
              <strong>
                Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos
                Personales (INAI)
              </strong>{" "}
              en{" "}
              <a
                href="https://www.inai.org.mx"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--navy)", fontWeight: 600 }}
              >
                www.inai.org.mx
              </a>
              .
            </p>
          </section>

          <div
            style={{
              marginTop: "2.5rem",
              paddingTop: "2rem",
              borderTop: "1.5px solid var(--border-light)",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "var(--navy)",
                color: "#fff",
                fontFamily: "var(--font-body)",
                fontSize: "1rem",
                fontWeight: 700,
                padding: "0.8rem 1.8rem",
                borderRadius: "50px",
                textDecoration: "none",
                minHeight: 48,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 5 5 12 12 19" />
              </svg>
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>

      <footer className="site-footer" role="contentinfo">
        <div className="container footer-inner">
          <p className="footer-name">Lic. Gerardo Huerta</p>
          <p className="footer-desc">Pensiones IMSS y Jubilación · Despacho Fiscal 2087</p>
          <p className="footer-contact">
            C. Toronja Roja 6275, Ampliación Aeropuerto · 32698 Ciudad Juárez, Chihuahua
          </p>
          <p className="footer-contact">
            <a href="mailto:contacto@contadorgerardohuerta.com">contacto@contadorgerardohuerta.com</a>
          </p>
          <nav className="footer-social" aria-label="Redes sociales">
            <a href="https://www.facebook.com/contadorgerardohuerta" target="_blank" rel="noopener noreferrer">Facebook</a>
            <a href="https://www.tiktok.com/@contadorgerardohuerta" target="_blank" rel="noopener noreferrer">TikTok</a>
            <a href="https://www.youtube.com/@contadorgerardohuerta" target="_blank" rel="noopener noreferrer">YouTube</a>
          </nav>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Despacho Fiscal 2087 · Todos los derechos reservados</p>
        </div>
      </footer>
    </>
  );
}
