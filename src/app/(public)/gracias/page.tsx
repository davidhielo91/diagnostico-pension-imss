import type { Metadata } from "next";
import Link from "next/link";

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
            Gracias, recibimos tu información
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: 1.7, marginBottom: "1rem" }}>
            Nuestro equipo revisará los datos que compartiste para identificar qué alternativas podrían aplicar a tu situación.
          </p>

          <div style={{ background: "var(--gold-pale)", border: "1.5px solid var(--gold-light)", borderRadius: "var(--radius-md)", padding: "1rem 1.25rem", fontSize: "0.95rem", color: "#2a3d10", margin: "1.5rem 0", textAlign: "left" }}>
            <strong style={{ color: "#1a2d08" }}>¿Qué sigue?</strong> Revisaremos tu información y te contactaremos en un máximo de{" "}
            <strong style={{ color: "#1a2d08" }}>24 horas hábiles</strong> por correo electrónico o WhatsApp. Asegúrate de revisar tu carpeta de{" "}
            <strong style={{ color: "#1a2d08" }}>spam o correo no deseado</strong> y tener activo el número que nos proporcionaste.
          </div>

          <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: 1.7, marginBottom: "2rem" }}>
            Gracias por tu confianza. Haremos lo posible por orientarte en tu proceso.
          </p>

          <Link
            href="/"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "var(--navy)", color: "#fff", fontFamily: "var(--font-body)", fontSize: "1rem", fontWeight: 700, padding: "0.9rem 2rem", borderRadius: "50px", textDecoration: "none", minHeight: 52 }}
          >
            Volver al inicio
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
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
