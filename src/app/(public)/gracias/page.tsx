import type { Metadata } from "next";
import Link from "next/link";
import { linkWhatsAppEntrante } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Gracias | Pre-Diagnóstico de Pensión IMSS",
  robots: { index: false, follow: false },
};

export default function GraciasPage() {
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
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem 1.5rem", background: "var(--surface-light)" }}
      >
        <div style={{ maxWidth: 580, width: "100%", background: "var(--surface-white)", borderRadius: "var(--radius-xl)", border: "1.5px solid var(--border-light)", padding: "3.5rem 2.5rem", textAlign: "center", boxShadow: "0 20px 60px rgba(0,33,68,0.07)" }}>
          <div
            role="img"
            aria-label="Confirmación de envío"
            style={{ width: 80, height: 80, background: "var(--green-light)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 2rem", color: "var(--green-ok)" }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 style={{ fontSize: "clamp(1.6rem, 4vw, 2.2rem)", color: "var(--navy)", marginBottom: "1rem" }}>
            Gracias, recibimos su información
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: 1.7, marginBottom: "1rem" }}>
            Nuestro equipo revisará los datos que compartió para identificar qué alternativas podrían aplicar a su situación.
          </p>

          <div style={{ background: "var(--gold-pale)", border: "1.5px solid var(--gold-light)", borderRadius: "var(--radius-md)", padding: "1rem 1.25rem", fontSize: "0.95rem", color: "#2a3d10", margin: "1.5rem 0", textAlign: "left" }}>
            <strong style={{ color: "#1a2d08" }}>¿Qué sigue?</strong> Puede escribirnos por WhatsApp ahora. También le daremos seguimiento por correo electrónico dentro de{" "}
            <strong style={{ color: "#1a2d08" }}>24 horas hábiles</strong>. Asegúrese de revisar su carpeta de{" "}
            <strong style={{ color: "#1a2d08" }}>spam o correo no deseado</strong>.
          </div>

          <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: 1.7, marginBottom: "2rem" }}>
            Gracias por su confianza. Estamos disponibles para orientarle en su proceso.
          </p>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
            <a
              href={linkWhatsAppEntrante("Hola, acabo de llenar el prediagnóstico de pensión IMSS en su página y me gustaría que revisaran mi caso.")}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "var(--green-ok)", color: "#fff", fontFamily: "var(--font-body)", fontSize: "1rem", fontWeight: 700, padding: "0.9rem 2rem", borderRadius: "50px", textDecoration: "none", minHeight: 52 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M20 11.5a8.38 8.38 0 0 1-9.21 8.31L4 21l1.19-6.79A8.38 8.38 0 1 1 20 11.5Z" />
                <path d="M8.7 8.5c.2-.5.4-.5.7-.5h.6c.2 0 .4.1.5.4l.7 1.7c.1.3.1.5-.1.7l-.5.7c.5 1 1.3 1.8 2.3 2.3l.7-.5c.2-.2.4-.2.7-.1l1.7.7c.3.1.4.3.4.5v.6c0 .3 0 .5-.5.7-.5.2-1 .3-1.5.2-3.4-.6-6.1-3.3-6.7-6.7-.1-.5 0-1 .2-1.5Z" />
              </svg>
              Escríbanos por WhatsApp
            </a>
            <Link
              href="/"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--navy)", fontFamily: "var(--font-body)", fontSize: "0.95rem", fontWeight: 600, padding: "0.55rem 1rem", borderRadius: "50px", textDecoration: "none", minHeight: 40 }}
            >
              Volver al inicio
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
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
