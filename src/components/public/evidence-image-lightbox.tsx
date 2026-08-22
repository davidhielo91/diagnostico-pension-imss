"use client";

import { useEffect, useId, useRef, useState } from "react";

const imageAlt = "Solicitud de cambio de modalidad de pensión IMSS con sello oficial de recibido de la Subdelegación Juárez I; datos personales del cliente protegidos";

export function EvidenceImageLightbox() {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  const openLightbox = (trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    setIsOpen(true);
  };

  const closeLightbox = () => setIsOpen(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = Array.from(
        document.querySelectorAll<HTMLElement>(
          '.evidence-lightbox [href], .evidence-lightbox button:not([disabled]), .evidence-lightbox [tabindex]:not([tabindex="-1"])',
        ),
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (!firstElement || !lastElement) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      document.removeEventListener("keydown", handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [isOpen]);

  return (
    <>
      <div className="evidence-visual">
        <div className="evidence-media">
          <button
            type="button"
            className="evidence-image-trigger"
            onClick={(event) => openLightbox(event.currentTarget)}
            aria-haspopup="dialog"
            aria-label="Ver documento ampliado"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/tramite-imss-recibido.webp" alt={imageAlt} width={1200} height={1600} loading="lazy" />
          </button>
          <span className="evidence-badge">Recibido por el IMSS · Subdelegación Juárez I</span>
        </div>
        <button
          type="button"
          className="evidence-expand-button"
          onClick={(event) => openLightbox(event.currentTarget)}
          aria-haspopup="dialog"
        >
          Ver documento ampliado
        </button>
      </div>

      {isOpen && (
        <div className="evidence-lightbox" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closeLightbox();
          }
        }}>
          <section className="evidence-lightbox-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
            <div className="evidence-lightbox-header">
              <div>
                <p className="evidence-lightbox-kicker">Documento recibido</p>
                <h2 id={titleId}>Solicitud presentada ante el IMSS</h2>
              </div>
              <button ref={closeButtonRef} type="button" className="evidence-lightbox-close" onClick={closeLightbox} aria-label="Cerrar documento ampliado">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 18 18M18 6 6 18" /></svg>
              </button>
            </div>
            <p id={descriptionId} className="evidence-lightbox-description">Datos personales del cliente cubiertos para proteger su privacidad.</p>
            <div className="evidence-lightbox-image-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/tramite-imss-recibido.webp" alt={imageAlt} width={1200} height={1600} />
            </div>
          </section>
        </div>
      )}
    </>
  );
}
