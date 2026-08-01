import type { Metadata } from "next";
import { LandingForm } from "@/components/public/landing-form";
import { LandingFAQ } from "@/components/public/landing-faq";
import { LANDING_FAQS } from "@/lib/landing-content";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://pre-diagnostico.contadorgerardohuerta.com";

const businessSchema = {
  "@context": "https://schema.org",
  "@type": "AccountingService",
  name: "Despacho Fiscal 2087",
  alternateName: "Contador Gerardo Huerta",
  url: BASE_URL,
  email: "contacto@contadorgerardohuerta.com",
  image: `${BASE_URL}/images/contador-gerardo-huerta-perfil.webp`,
  areaServed: "MX",
  address: {
    "@type": "PostalAddress",
    streetAddress: "C. Toronja Roja 6275, Ampliación Aeropuerto",
    addressLocality: "Ciudad Juárez",
    addressRegion: "Chihuahua",
    postalCode: "32698",
    addressCountry: "MX",
  },
  sameAs: [
    "https://www.facebook.com/contadorgerardohuerta",
    "https://www.tiktok.com/@contadorgerardohuerta",
    "https://www.youtube.com/@contadorgerardohuerta",
  ],
  founder: {
    "@type": "Person",
    name: "Gerardo Huerta",
    jobTitle: "Especialista en pensiones IMSS",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: LANDING_FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a.replace(/\n\n/g, " "),
    },
  })),
};

export const metadata: Metadata = {
  title: "Modalidad 40 y Semanas Cotizadas IMSS | Pre-Diagnóstico Gratis",
  description: "Especialistas en Modalidad 40, Ley 73 y semanas cotizadas del IMSS. Cuéntanos tu caso y en 24 horas hábiles te decimos qué opciones tienes. Sin costo.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Modalidad 40 y Semanas Cotizadas IMSS | Pre-Diagnóstico Gratis",
    description: "Especialistas en Modalidad 40, Ley 73 y semanas cotizadas del IMSS. Cuéntanos tu caso y en 24 horas hábiles te decimos qué opciones tienes. Sin costo.",
    type: "website",
    images: ["/images/pre-diagnostico-imss.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Modalidad 40 y Semanas Cotizadas IMSS | Pre-Diagnóstico Gratis",
    description: "Tu pensión IMSS puede ser mayor de lo que crees. Cuéntanos tu caso y en 24 horas hábiles te decimos qué opciones tienes. Sin costo.",
    images: ["/images/pre-diagnostico-imss.jpg"],
  },
  icons: { icon: "/images/contador-gerardo-huerta-perfil.png" },
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <a href="#contenido-principal" className="skip-link">Saltar al contenido principal</a>

      {/* ── HEADER ── */}
      <header className="site-header" role="banner">
        <div className="container header-inner">
          <div className="brand">
            <span className="brand-name">Contador Gerardo Huerta</span>
            <span className="brand-sep" aria-hidden="true">|</span>
            <span className="brand-tagline">Pensiones IMSS y Jubilaciones</span>
          </div>
        </div>
      </header>

      <main id="contenido-principal">

        {/* ── HERO ── */}
        <section className="hero" aria-labelledby="hero-titulo">
          <div className="hero-bg" aria-hidden="true">
            <div className="hero-shape hero-shape-1" />
            <div className="hero-shape hero-shape-2" />
            <div className="hero-lines" />
          </div>
          <div className="container hero-content">
            <div className="hero-badge" aria-label="Servicio gratuito">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Pre-diagnóstico sin costo
            </div>
            <h1 id="hero-titulo">
              Tu pensión del IMSS<br />
              <em>puede ser mayor de lo que crees.</em>
            </h1>
            <p className="hero-sub">
              Especialistas en Modalidad 40, Ley 73 y semanas cotizadas del IMSS. Cuéntanos tu caso y en menos de 24 horas hábiles te decimos si tiene sentido agendar un diagnóstico completo — sin costo.
            </p>
            <div className="hero-actions">
              <a href="#formulario" className="btn-cta">
                Quiero saber qué opciones tengo
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
            <p className="hero-note">Atención en toda la República Mexicana · Revisión humana de cada caso</p>
          </div>
        </section>

        {/* ── TRUST BAR ── */}
        <section className="trust-bar" aria-label="Características del servicio">
          <div className="container">
            <ul className="trust-list" role="list">
              <li className="trust-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                <span>Información confidencial</span>
              </li>
              <li className="trust-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" /></svg>
                <span>Especialistas en IMSS</span>
              </li>
              <li className="trust-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                <span>Respuesta en 24 h hábiles</span>
              </li>
              <li className="trust-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                <span>Pre-diagnóstico sin costo</span>
              </li>
            </ul>
          </div>
        </section>

        {/* ── POR QUÉ ── */}
        <section className="section section-light" aria-labelledby="sec-porque">
          <div className="container">
            <div className="section-header">
              <p className="eyebrow">¿Por qué esto importa?</p>
              <h2 id="sec-porque">No todos los casos de pensión son iguales</h2>
              <p className="section-desc">Lo que aplica para una persona puede no aplicar para otra. Conocer tu situación nos permite darte una orientación real, no una respuesta genérica.</p>
            </div>
            <div className="cards-grid three-col">
              <article className="card card-outlined">
                <div className="card-icon-wrap" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </div>
                <h3>Tu historial, no el de todos</h3>
                <p>Tus semanas, períodos y modalidades son únicos. Lo que le tocó a tu vecino puede no aplicarte a ti — ni para bien ni para mal.</p>
              </article>
              <article className="card card-outlined">
                <div className="card-icon-wrap" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                </div>
                <h3>Ley 73 o 97 — cambia todo</h3>
                <p>A cuál perteneces determina cuánto cobras y cuándo puedes jubilarte. Muchas personas no lo saben hasta que alguien lo revisa.</p>
              </article>
              <article className="card card-outlined">
                <div className="card-icon-wrap" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                </div>
                <h3>Sabrás qué aplica a tu caso</h3>
                <p>Recibes una respuesta sobre <em>tu</em> situación, no una explicación general que encontrarías en Google.</p>
              </article>
            </div>
          </div>
        </section>

        {/* ── PERFIL ── */}
        <section className="section section-dark" aria-labelledby="sec-gerardo">
          <div className="container">
            <div className="profile-wrap">
              <div className="profile-photo-col">
                <div className="profile-photo-frame">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/contador-gerardo-huerta-perfil.webp"
                    alt="Lic. Gerardo Huerta, especialista en pensiones IMSS"
                    className="profile-img"
                    width={280}
                    height={280}
                    loading="lazy"
                  />
                </div>
              </div>
              <div className="profile-info-col">
                <p className="eyebrow eyebrow-light">Tu caso en manos de un especialista</p>
                <h2 id="sec-gerardo">Lic. Gerardo Huerta</h2>
                <p className="profile-intro">Gerardo se especializa en descubrir lo que el IMSS no siempre te explica: semanas que no sabías que tenías, modalidades que nadie te ofreció y opciones que aún tienes tiempo de aprovechar.</p>
                <dl className="profile-data">
                  <div className="profile-data-row">
                    <dt>Estudios</dt>
                    <dd>Lic. en Contaduría (ITCJ) · Maestría en Derecho Fiscal (U. de Durango)</dd>
                  </div>
                  <div className="profile-data-row">
                    <dt>Especialidad</dt>
                    <dd>Seguridad Social, Retiro, Modalidad 40 y Modalidad 10</dd>
                  </div>
                </dl>
                <div className="profile-chips" role="list" aria-label="Características del despacho">
                  {["Revisión individual y humana", "Respuesta personalizada, no automática", "Diagnóstico basado en tu situación real"].map((chip) => (
                    <div key={chip} className="profile-chip" role="listitem">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                      {chip}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CONFIANZA ── */}
        <section className="section section-light" aria-labelledby="sec-confianza">
          <div className="container">
            <div className="section-header">
              <p className="eyebrow">Nuestro compromiso</p>
              <h2 id="sec-confianza">Revisión humana, caso por caso — así es como trabajamos</h2>
            </div>
            <div className="cards-grid three-col">
              {[
                { n: "01", t: "Especialización en pensiones IMSS", d: "Ley 73, Ley 97, Modalidad 40 y 10, conservación de derechos y planeación para el retiro son nuestro foco." },
                { n: "02", t: "Análisis basado en información real", d: "Cada orientación parte de lo que tú nos compartes, no de suposiciones o promesas generales." },
                { n: "03", t: "Sin compromisos de tu parte", d: "Si tu caso no tiene opciones claras en este momento, te lo decimos directo. No vendemos nada que no necesites." },
              ].map(({ n, t, d }) => (
                <article key={n} className="card card-filled">
                  <div className="card-number" aria-hidden="true">{n}</div>
                  <h3>{t}</h3>
                  <p>{d}</p>
                </article>
              ))}
            </div>
            <div className="evidence-wrap">
              <div className="evidence-media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/tramite-imss-recibido.webp"
                  alt="Solicitud de cambio de modalidad de pensión IMSS con sello oficial de recibido de la Subdelegación Juárez I; datos personales del cliente protegidos"
                  width={1200}
                  height={1600}
                  loading="lazy"
                />
                <span className="evidence-badge">Recibido por el IMSS · Subdelegación Juárez I</span>
              </div>
              <div className="evidence-text">
                <p className="eyebrow">Prueba real, no promesas</p>
                <h3>Así se ve un trámite que ya gestionamos ante el IMSS</h3>
                <p>Este es un caso real: encontramos que a este cliente le correspondía cambiar de modalidad de pensión — de cesantía en edad avanzada a pensión por vejez, una opción con mayor monto y sin reducción por edad que nadie le había explicado. Presentamos el trámite ante el IMSS y este es el sello oficial de recibido.</p>
                <p className="evidence-note">Datos personales del cliente cubiertos para proteger su privacidad.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── PROCESO ── */}
        <section className="section section-accent" aria-labelledby="sec-proceso">
          <div className="container">
            <div className="section-header">
              <p className="eyebrow">Proceso claro</p>
              <h2 id="sec-proceso">¿Qué pasa después de enviar tu información?</h2>
            </div>
            <ol className="steps-list" role="list">
              {[
                { n: 1, t: "Revisamos tu caso — sin costo", d: "Nuestro equipo analiza los datos que nos compartes para entender tu situación e identificar si existe algo concreto que valga la pena revisar a fondo." },
                { n: 2, t: "Te contactamos por correo o WhatsApp", d: "En máximo 24 horas hábiles te escribimos con nuestra conclusión. Si encontramos opciones para tu caso, te lo hacemos saber. Si no hay nada que revisar, también te lo decimos directo." },
                { n: 3, t: "Si hay opciones, te invitamos a agendar el diagnóstico completo", d: "El Diagnóstico de Pensión IMSS es una cita a fondo donde se revisan tus documentos, se hace la proyección y se define la estrategia. Este servicio tiene un costo que podrás consultar al momento de agendar." },
              ].map(({ n, t, d }) => (
                <li key={n} className="step">
                  <div className="step-num" aria-label={`Paso ${n}`}>{n}</div>
                  <div className="step-body">
                    <h3>{t}</h3>
                    <p>{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="important-note" role="note">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              <p><strong>Importante:</strong> Una vez que recibamos tu solicitud, te contactaremos por correo electrónico o WhatsApp. Revisa que tu correo y número de WhatsApp estén correctos antes de enviar.</p>
            </div>
          </div>
        </section>

        {/* ── TEMAS ── */}
        <section className="section section-light" aria-labelledby="sec-temas">
          <div className="container">
            <div className="section-header">
              <p className="eyebrow">¿Tu situación entra aquí?</p>
              <h2 id="sec-temas">Temas que revisamos en el pre-diagnóstico</h2>
            </div>
            <div className="tags-wrap" role="list" aria-label="Temas de asesoría disponibles">
              {["Pensión IMSS", "Ley 73", "Ley 97", "Modalidad 40", "Modalidad 10", "Semanas cotizadas", "Conservación de derechos", "AFORE", "Pensiones bajas", "Planeación para el retiro", "Jubilación anticipada", "Pensión por viudez"].map((tag) => (
                <span key={tag} className="topic-tag" role="listitem">{tag}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="section section-neutral" aria-labelledby="sec-faq">
          <div className="container">
            <div className="section-header">
              <p className="eyebrow">Antes de enviar</p>
              <h2 id="sec-faq">Preguntas frecuentes</h2>
            </div>
            <LandingFAQ />
          </div>
        </section>

        {/* ── VIDEO ── */}
        <section className="section section-light" aria-labelledby="sec-video">
          <div className="container">
            <div className="section-header">
              <p className="eyebrow">En sus propias palabras</p>
              <h2 id="sec-video">El Contador Gerardo te lo explica</h2>
              <p className="section-desc">Mira por qué revisamos cada caso de forma individual — y cómo puedes descubrir qué opciones tienes tú.</p>
            </div>
            <div className="video-shorts-wrap">
              <iframe
                src="https://www.youtube.com/embed/INVsGOmeP6w"
                title="El Contador Gerardo Huerta explica el pre-diagnóstico de pensión IMSS"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                className="video-shorts-iframe"
              />
            </div>
            <div className="video-cta">
              <a href="#formulario" className="btn-cta">
                Quiero saber qué opciones tengo
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* ── FORMULARIO ── */}
        <section className="section section-form" id="formulario" aria-labelledby="sec-form">
          <div className="container">
            <div className="section-header">
              <p className="eyebrow">Pre-diagnóstico sin costo</p>
              <h2 id="sec-form">Cuéntanos tu situación</h2>
              <p className="section-desc">Completa los datos y nuestro equipo revisará tu caso para decirte si tiene sentido agendar un diagnóstico completo. El pre-diagnóstico es gratuito.</p>
            </div>
            <LandingForm />
          </div>
        </section>

        {/* ── PRIVACIDAD ── */}
        <section className="section section-privacy" aria-labelledby="sec-privacidad">
          <div className="container">
            <div className="privacy-box">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              <div>
                <h2 id="sec-privacidad">Aviso de confidencialidad</h2>
                <p>La información que compartas será utilizada únicamente para revisar tu caso y contactarte. Tus datos no serán compartidos con terceros sin tu autorización. Al enviar el formulario, consientes el tratamiento de tu información de acuerdo con nuestro aviso de privacidad.</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="site-footer" role="contentinfo">
        <div className="container footer-inner">
          <div className="footer-brand">
            <p className="footer-name">Lic. Gerardo Huerta</p>
            <p className="footer-desc">Pensiones IMSS y Jubilación · Despacho Fiscal 2087</p>
          </div>
          <div className="footer-contact">
            <p>C. Toronja Roja 6275, Ampliación Aeropuerto</p>
            <p>32698 Ciudad Juárez, Chihuahua</p>
            <a href="mailto:contacto@contadorgerardohuerta.com">contacto@contadorgerardohuerta.com</a>
          </div>
          <nav className="footer-social" aria-label="Redes sociales">
            <a href="https://www.facebook.com/contadorgerardohuerta" target="_blank" rel="noopener noreferrer" aria-label="Facebook de Contador Gerardo Huerta (abre en nueva ventana)">Facebook</a>
            <a href="https://www.tiktok.com/@contadorgerardohuerta" target="_blank" rel="noopener noreferrer" aria-label="TikTok de Contador Gerardo Huerta (abre en nueva ventana)">TikTok</a>
            <a href="https://www.youtube.com/@contadorgerardohuerta" target="_blank" rel="noopener noreferrer" aria-label="YouTube de Contador Gerardo Huerta (abre en nueva ventana)">YouTube</a>
          </nav>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Despacho Fiscal 2087 · Todos los derechos reservados</p>
        </div>
      </footer>
    </>
  );
}
