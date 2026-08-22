import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) =>
    createElement("a", { href, ...rest }, children),
}));

vi.mock("@/components/public/landing-form", () => ({
  LandingForm: () => createElement("div", { "data-testid": "form" }),
}));

vi.mock("@/components/public/landing-faq", () => ({
  LandingFAQ: () => createElement("div", { "data-testid": "faq" }),
}));

import LandingPage, { metadata } from "@/app/(public)/page";
import GraciasPage from "@/app/(public)/gracias/page";
import AvisoPrivacidadPage from "@/app/(public)/aviso-de-privacidad/page";
import { LANDING_FAQS } from "@/lib/landing-content";

const FRASES_PROHIBIDAS = ["Gratis", "gratis", "gratuito", "gratuita", "sin costo", "Sin costo", "sin cargo"];

const anioActual = new Date().getFullYear();

describe("landing copy aligned with brand voice (D20)", () => {
  it("metadata title/description/OG/Twitter contain no free-claim phrases", () => {
    const metas = [
      metadata.title ?? "",
      metadata.description ?? "",
      metadata.openGraph?.title ?? "",
      metadata.openGraph?.description ?? "",
      metadata.twitter?.title ?? "",
      metadata.twitter?.description ?? "",
    ].join(" ");

    for (const frase of FRASES_PROHIBIDAS) {
      expect(metas.toLowerCase()).not.toContain(frase.toLowerCase());
    }
  });

  it("rendered landing HTML contains no free-claim phrases", () => {
    const html = renderToStaticMarkup(createElement(LandingPage));

    for (const frase of FRASES_PROHIBIDAS) {
      expect(html.toLowerCase()).not.toContain(frase.toLowerCase());
    }
  });

  it("landing still communicates the paid-diagnosis funnel without promising free service", () => {
    const html = renderToStaticMarkup(createElement(LandingPage));
    expect(html).toContain("agendar el diagnóstico completo");
    expect(html).toContain("El Diagnóstico de Pensión IMSS");
  });

  it("FAQ copy (landing-content.ts) contains no free-claim phrases either", () => {
    const faqTexto = LANDING_FAQS.flatMap((f) => [f.q, f.a]).join(" ");
    for (const frase of FRASES_PROHIBIDAS) {
      expect(faqTexto.toLowerCase()).not.toContain(frase.toLowerCase());
    }
  });
});

describe("footer year consistency (D21, incl. aviso-de-privacidad)", () => {
  it("landing footer renders the current year, not a hardcoded one", () => {
    const html = renderToStaticMarkup(createElement(LandingPage));
    expect(html).toContain(`© ${anioActual}`);
    expect(html).not.toContain("© 2025");
    expect(html).not.toContain("© 2024");
  });

  it("gracias footer renders the current year", () => {
    const html = renderToStaticMarkup(createElement(GraciasPage));
    expect(html).toContain(`© ${anioActual}`);
    expect(html).not.toContain("© 2025");
  });

  it("aviso-de-privacidad footer renders the current year", () => {
    const html = renderToStaticMarkup(createElement(AvisoPrivacidadPage));
    expect(html).toContain(`© ${anioActual}`);
    expect(html).not.toContain("© 2025");
  });
});