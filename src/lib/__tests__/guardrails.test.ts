import { describe, it, expect } from "vitest";
import { violaReglasVoz } from "@/lib/ai";

describe("violaReglasVoz — FRASES_PROHIBIDAS_MARCA aligned with the AI prompt (D17)", () => {
  const frasesDelPrompt = [
    "casos de éxito",
    "garantizamos resultados",
    "aseguramos un aumento",
    "te garantizo que sube",
    "aumento asegurado",
    "el mejor beneficio",
    "máximo beneficio",
    "transparencia y compromiso",
    "con toda la transparencia",
    "recálculo automático",
    "le va a subir",
    "le subirá",
    "va a aumentar",
    "su pensión va a subir",
    "su pensión aumentará",
    "no te preocupes, nosotros te ayudamos con todo",
    "el mejor asesor de México",
    "el más completo del país",
    "único en México",
    "sin costo",
    "gratis",
    "gratuito",
    "sin cargo",
    "de forma gratuita",
  ];

  it.each(frasesDelPrompt)("detects the prompt-prohibited phrase: %s", (frase) => {
    expect(violaReglasVoz(`El mensaje dice: ${frase}.`)).toBe(true);
  });

  it("still detects the original guardrail stems (regression)", () => {
    expect(violaReglasVoz("le subiremos su pensión")).toBe(true);
    expect(violaReglasVoz("su pensión puede aumentar")).toBe(true);
  });

  it("does not flag a brand-clean message", () => {
    expect(
      violaReglasVoz(
        "Revisamos su caso de forma individual. Primero se revisa, después se decide. Agenda su diagnóstico."
      )
    ).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(violaReglasVoz("SIN COSTO para usted")).toBe(true);
  });
});