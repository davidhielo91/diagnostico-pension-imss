import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import {
  calcularScoreViabilidad,
  clasificarLead,
  clasificarSegmentoInteres,
  normalizarTelefono,
  extraerMontoPension,
  generarCorreo,
  generarWhatsApp,
  type LeadInput,
} from "@/lib/classification";
import {
  PENSION_MINIMA_GARANTIZADA,
  LANDING_URL,
} from "@/lib/constants";

function baseInput(overrides: Partial<LeadInput> = {}): LeadInput {
  return {
    nombre: "Juan Pérez",
    telefono: "5512345678",
    edad: 45,
    ciudad: "Ciudad Juárez",
    yaEstaPensionado: "no",
    temaInteres: "Ley 73",
    situacion: "Quiero saber si me conviene la modalidad 40 para mi pensión.",
    ...overrides,
  };
}

describe("classification module smoke test", () => {
  it("imports without throwing (prisma boundary mocked)", () => {
    expect(typeof clasificarLead).toBe("function");
  });
});

describe("calcularScoreViabilidad", () => {
  it("adds +30 for Ley 73 via temaInteres", () => {
    const input = baseInput({ temaInteres: "ley 73", situacion: "sin datos relevantes" });
    const { score } = calcularScoreViabilidad(input, "Requiere revisión manual");
    // capped to 40 because categoria === "Requiere revisión manual"
    expect(score).toBeGreaterThanOrEqual(30);
  });

  it("adds +30 for Ley 73 via categoria when temaInteres is not ley 73", () => {
    const input = baseInput({ temaInteres: "otro tema", situacion: "sin datos relevantes", edad: 30 });
    const { score } = calcularScoreViabilidad(input, "Ley 73 relacionada");
    expect(score).toBe(30);
  });

  it("adds +25 for pensionado + cesantía/invalidez", () => {
    const input = baseInput({
      yaEstaPensionado: "si",
      temaInteres: "otro tema",
      situacion: "sin montos mencionados",
      edad: 30,
    });
    const { score } = calcularScoreViabilidad(input, "Cambio cesantía a vejez probable");
    expect(score).toBe(25);
  });

  it("adds +25 when pension amount mentioned is below the minimum guaranteed", () => {
    const montoBajo = PENSION_MINIMA_GARANTIZADA - 1000;
    const input = baseInput({
      temaInteres: "otro tema",
      situacion: `me pagan ${montoBajo} pesos de pensión actualmente`,
      edad: 30,
    });
    const { score } = calcularScoreViabilidad(input, "No clasificado");
    expect(score).toBe(25);
  });

  it("does not add the low-pension bonus when the amount is at or above the minimum", () => {
    const montoAlto = PENSION_MINIMA_GARANTIZADA + 1000;
    const input = baseInput({
      temaInteres: "otro tema",
      situacion: `me pagan ${montoAlto} pesos de pensión actualmente`,
      edad: 30,
    });
    const { score } = calcularScoreViabilidad(input, "No clasificado");
    expect(score).toBe(0);
  });

  it("adds +10 for age exactly 60 and exactly 70", () => {
    const input60 = baseInput({ temaInteres: "otro tema", situacion: "sin datos", edad: 60 });
    const input70 = baseInput({ temaInteres: "otro tema", situacion: "sin datos", edad: 70 });
    expect(calcularScoreViabilidad(input60, "No clasificado").score).toBe(10);
    expect(calcularScoreViabilidad(input70, "No clasificado").score).toBe(10);
  });

  it("does not add the age bonus for 59 or 71", () => {
    const input59 = baseInput({ temaInteres: "otro tema", situacion: "sin datos", edad: 59 });
    const input71 = baseInput({ temaInteres: "otro tema", situacion: "sin datos", edad: 71 });
    expect(calcularScoreViabilidad(input59, "No clasificado").score).toBe(0);
    expect(calcularScoreViabilidad(input71, "No clasificado").score).toBe(0);
  });

  it("adds +10 for tieneSemanasCotizadas === 'si'", () => {
    const input = baseInput({
      temaInteres: "otro tema",
      situacion: "sin datos",
      edad: 30,
      tieneSemanasCotizadas: "si",
    });
    expect(calcularScoreViabilidad(input, "No clasificado").score).toBe(10);
  });

  it("caps the score to 40 when raw sum would be higher and temaInteres/categoria signals lack of data", () => {
    // Ley73 (+30) + age 60-70 (+10) + semanas (+10) = 50, but temaInteres is "otro"
    const input = baseInput({
      temaInteres: "otro",
      situacion: "sin montos mencionados",
      edad: 65,
      tieneSemanasCotizadas: "si",
    });
    const { score } = calcularScoreViabilidad(input, "Ley 73");
    expect(score).toBe(40);
  });

  it("caps to 40 via categoria === 'Requiere revisión manual' even with a specific temaInteres", () => {
    const input = baseInput({
      temaInteres: "ley 73",
      situacion: "sin montos mencionados",
      edad: 65,
      tieneSemanasCotizadas: "si",
    });
    const { score } = calcularScoreViabilidad(input, "Requiere revisión manual");
    expect(score).toBe(40);
  });

  it("clamps the maximum score to 100 when all five bonuses apply", () => {
    const input = baseInput({
      temaInteres: "ley 73",
      yaEstaPensionado: "si",
      situacion: "me pagan 5000 pesos de pensión actualmente",
      edad: 65,
      tieneSemanasCotizadas: "si",
    });
    const { score } = calcularScoreViabilidad(input, "Pensión baja Ley 73 probable, cesantía e invalidez");
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBe(100);
  });

  it("maps the real FUERTE threshold (score >= 70) via calcularScoreViabilidad", () => {
    // All bonuses are multiples of 5, so 69/70 is never reachable — the tightest
    // real boundary around SCORE_UMBRAL_FUERTE (70) is 65 (below) vs 70 (at threshold).
    const montoBajo = PENSION_MINIMA_GARANTIZADA - 1000;

    // 65: Ley73 (+30) + pensión baja (+25) + edad (+10) = 65, no semanas bonus.
    const input65 = baseInput({
      temaInteres: "ley 73",
      situacion: `me pagan ${montoBajo} pesos de pensión`,
      edad: 65,
    });
    const result65 = calcularScoreViabilidad(input65, "Ley 73 relacionada");
    expect(result65.score).toBe(65);
    expect(result65.etiqueta).toBe("Revisar");

    // 70: pensionado+cesantía (+25) + pensión baja (+25) + edad (+10) + semanas (+10) = 70.
    const input70 = baseInput({
      temaInteres: "cesantía",
      yaEstaPensionado: "si",
      situacion: `me pagan ${montoBajo} pesos de pensión`,
      edad: 65,
      tieneSemanasCotizadas: "si",
    });
    const result70 = calcularScoreViabilidad(input70, "Cambio cesantía a vejez probable");
    expect(result70.score).toBe(70);
    expect(result70.etiqueta).toBe("Candidato fuerte");
  });

  it("maps the real REVISAR threshold (score >= 40) via calcularScoreViabilidad", () => {
    const montoBajo = PENSION_MINIMA_GARANTIZADA - 1000;

    // 35: pensión baja (+25) + edad (+10) = 35, temaInteres deliberately not an
    // exact "otro"/"no sé" match so the no-data cap doesn't interfere.
    const input35 = baseInput({
      temaInteres: "otro tema",
      situacion: `me pagan ${montoBajo} pesos de pensión`,
      edad: 65,
    });
    const result35 = calcularScoreViabilidad(input35, "No clasificado");
    expect(result35.score).toBe(35);
    expect(result35.etiqueta).toBe("Baja viabilidad");

    // 40: Ley73 (+30) + edad (+10) = 40.
    const input40 = baseInput({
      temaInteres: "ley 73",
      situacion: "sin montos mencionados",
      edad: 65,
    });
    const result40 = calcularScoreViabilidad(input40, "Ley 73 relacionada");
    expect(result40.score).toBe(40);
    expect(result40.etiqueta).toBe("Revisar");
  });
});

describe("extraerMontoPension", () => {
  it("extracts amounts from currency-formatted and word-formatted text", () => {
    expect(extraerMontoPension("me pagan $1,200 de pensión")).toBe(1200);
    expect(extraerMontoPension("recibo 1200 pesos de pensión")).toBe(1200);
    expect(extraerMontoPension("me pagan 1200 MXN de pensión")).toBe(1200);
    expect(extraerMontoPension("me llega 1200 mensuales de pensión")).toBe(1200);
  });

  it("excludes matches whose context mentions 'semanas' when not all matches do", () => {
    // "3000 pesos" match has "semanas" in its context window and is excluded;
    // "200 pesos" match has no "semanas" nearby, survives, and wins via the pagan/deben keyword context
    const texto =
      "tengo 500 semanas cotizadas y me pagan 3000 pesos, aparte me deben 200 pesos de aguinaldo por otro concepto sin relacion";
    expect(extraerMontoPension(texto)).toBe(200);
  });

  it("does not exclude any match when ALL matches mention 'semanas'", () => {
    // both currency matches ("3000 pesos" and "200 pesos") have "semanas" in their context window,
    // so none are excluded by the semanas filter; the keyword filter then picks the one
    // whose context also matches PALABRAS_CLAVE_MONTO ("pagan")
    const texto =
      "con 500 semanas cotizadas me pagan 3000 pesos, y con esas mismas semanas también me deben 200 pesos";
    expect(extraerMontoPension(texto)).toBe(3000);
  });

  it("falls back to the minimum candidate when none match the keyword regex", () => {
    const texto =
      "el monto es de 800 pesos por un lado y de 500 pesos por otro concepto totalmente distinto sin relacion alguna";
    expect(extraerMontoPension(texto)).toBe(500);
  });

  it("returns null when there is no numeric mention", () => {
    expect(extraerMontoPension("no tengo ningún monto que compartir")).toBeNull();
  });

  it("parses thousands-separator amounts like 1,234.56", () => {
    expect(extraerMontoPension("me pagan $1,234.56 de pensión")).toBe(1234.56);
  });
});

describe("clasificarSegmentoInteres", () => {
  it("returns segment A when objetivo is specific and semanas cotizadas is 'si'", () => {
    const input = baseInput({
      objetivoPrincipal: "Saber cuánto podría recibir",
      tieneSemanasCotizadas: "si",
      situacion: "corta",
    });
    expect(clasificarSegmentoInteres(input)).toBe("A");
  });

  it("returns segment A when objetivo is specific and situacion is detailed (>=40 chars)", () => {
    const input = baseInput({
      objetivoPrincipal: "Modalidad 40",
      tieneSemanasCotizadas: "no",
      situacion: "a".repeat(40),
    });
    expect(clasificarSegmentoInteres(input)).toBe("A");
  });

  it("returns segment C when situacion is short even if objetivo is in the A allowlist", () => {
    const input = baseInput({
      objetivoPrincipal: "Revisar una pensión baja",
      tieneSemanasCotizadas: "no",
      situacion: "a".repeat(19),
    });
    expect(clasificarSegmentoInteres(input)).toBe("C");
  });

  it("returns segment C when objetivo is vague (empty or 'No estoy seguro')", () => {
    const inputEmpty = baseInput({ objetivoPrincipal: "", situacion: "a".repeat(50) });
    const inputVago = baseInput({ objetivoPrincipal: "No estoy seguro", situacion: "a".repeat(50) });
    expect(clasificarSegmentoInteres(inputEmpty)).toBe("C");
    expect(clasificarSegmentoInteres(inputVago)).toBe("C");
  });

  it("returns segment B for a specific-but-not-allowlisted objetivo, mid-length situacion, no semanas", () => {
    const input = baseInput({
      objetivoPrincipal: "Mejorar mi pensión",
      tieneSemanasCotizadas: "no",
      situacion: "a".repeat(25),
    });
    expect(clasificarSegmentoInteres(input)).toBe("B");
  });

  it("respects the situacion length boundaries at 19/20 and 39/40", () => {
    const vagueObjetivo = baseInput({ objetivoPrincipal: "No estoy seguro" });
    expect(
      clasificarSegmentoInteres({ ...vagueObjetivo, objetivoPrincipal: "Mejorar mi pensión", situacion: "a".repeat(19) })
    ).toBe("C");
    expect(
      clasificarSegmentoInteres({ ...vagueObjetivo, objetivoPrincipal: "Mejorar mi pensión", situacion: "a".repeat(20) })
    ).toBe("B");

    expect(
      clasificarSegmentoInteres({
        ...vagueObjetivo,
        objetivoPrincipal: "Modalidad 40",
        tieneSemanasCotizadas: "no",
        situacion: "a".repeat(39),
      })
    ).toBe("B");
    expect(
      clasificarSegmentoInteres({
        ...vagueObjetivo,
        objetivoPrincipal: "Modalidad 40",
        tieneSemanasCotizadas: "no",
        situacion: "a".repeat(40),
      })
    ).toBe("A");
  });
});

describe("normalizarTelefono", () => {
  it("passes through a 10-digit local number unchanged", () => {
    expect(normalizarTelefono("5512345678")).toBe("5512345678");
  });

  it("strips the Mexico country code from a 12-digit number starting with 52", () => {
    expect(normalizarTelefono("525512345678")).toBe("5512345678");
  });

  it("does not strip a 12-digit number that does not start with 52", () => {
    expect(normalizarTelefono("125512345678")).toBe("125512345678");
  });

  it("removes formatting characters before applying the length/prefix rules", () => {
    expect(normalizarTelefono("+52 (55) 1234-5678")).toBe("5512345678");
  });

  it("passes through other lengths unchanged", () => {
    expect(normalizarTelefono("1234567890123")).toBe("1234567890123");
  });
});

describe("clasificarLead", () => {
  it.each([
    "Ya estoy pensionado / Pensión baja",
    "Otro",
    "Saber cuánto me tocaría de pensión",
    "Ya estoy pensionado",
    "Semanas cotizadas",
    "Saber cuánto le tocaría",
    "AFORE",
    "Conservación de derechos",
  ])("keeps the compatibility topic %s in manual review without inflating its score", (temaInteres) => {
    const input = baseInput({
      temaInteres,
      edad: 30,
      situacion: "Necesito orientación sobre mi caso de pensión.",
    });

    const clasificacion = clasificarLead(input);
    expect(clasificacion.categoria).toBe("Requiere revisión manual");
    expect(calcularScoreViabilidad(input, clasificacion.categoria).score).toBe(0);
  });

  it("resolves categoria precedence: Ley-73-pension-baja combo wins first", () => {
    const input = baseInput({
      yaEstaPensionado: "si",
      temaInteres: "pension",
      situacion: "mi pensión está baja y también tengo invalidez y viudez",
    });
    expect(clasificarLead(input).categoria).toBe("Pensión baja Ley 73 probable");
  });

  it("resolves categoria precedence: cesantía branch wins over invalidez/viudez", () => {
    const input = baseInput({
      yaEstaPensionado: "no",
      situacion: "me pensioné a los 60 y también tengo invalidez y viudez",
    });
    expect(clasificarLead(input).categoria).toBe("Cambio cesantía a vejez probable");
  });

  it("resolves categoria precedence: invalidez branch wins over viudez", () => {
    const input = baseInput({
      yaEstaPensionado: "no",
      situacion: "tengo invalidez y también viudez",
    });
    expect(clasificarLead(input).categoria).toBe("Invalidez");
  });

  it("resolves categoria precedence: viudez branch when nothing else matches", () => {
    const input = baseInput({
      yaEstaPensionado: "no",
      situacion: "soy viuda y mi esposo falleció",
    });
    expect(clasificarLead(input).categoria).toBe("Viudez");
  });

  it("forces prioridad to Alta when edad > 60 even with a vague objetivo", () => {
    const input = baseInput({
      edad: 65,
      objetivoPrincipal: "No estoy seguro",
      situacion: "no sé mucho de mi caso",
    });
    expect(clasificarLead(input).prioridad).toBe("Alta");
  });

  it("forces viabilidad to 'No viable por ahora' when edad < 25 despite otherwise-qualifying info", () => {
    const input = baseInput({
      edad: 24,
      objetivoPrincipal: "Saber cuánto podría recibir",
      tieneSemanasCotizadas: "si",
      situacion: "tengo toda la información completa sobre mi caso de pensión",
    });
    expect(clasificarLead(input).viabilidad).toBe("No viable por ahora");
  });
});

describe("generarCorreo", () => {
  it("returns Alta-priority copy", () => {
    const { asunto, cuerpo } = generarCorreo("Juan Pérez", "Alta");
    expect(asunto).toContain("Revisamos su caso");
    expect(cuerpo).toContain("Juan Pérez");
    expect(cuerpo).toContain(LANDING_URL);
  });

  it("returns Baja-priority copy", () => {
    const { asunto, cuerpo } = generarCorreo("Juan Pérez", "Baja");
    expect(asunto).toContain("Información sobre pensión IMSS");
    expect(cuerpo).toContain(LANDING_URL);
  });

  it("returns default copy when prioridad is undefined", () => {
    const { asunto, cuerpo } = generarCorreo("Juan Pérez");
    expect(asunto).toContain("Revisión de su caso");
    expect(cuerpo).toContain(LANDING_URL);
  });
});

describe("generarWhatsApp", () => {
  it("builds a URL with the Mexico prefix and normalized phone", () => {
    const { url } = generarWhatsApp("Juan Pérez", "5512345678");

    expect(url).toMatch(/^https:\/\/wa\.me\/525512345678/);
  });

  it("URL-encodes the message in the text parameter", () => {
    const { url, mensaje } = generarWhatsApp("Juan Pérez", "5512345678");

    expect(url).toContain(`text=${encodeURIComponent(mensaje)}`);
  });

  it("returns a null URL while preserving the message when no phone is registered", () => {
    const { url, mensaje } = generarWhatsApp("Juan Pérez", null);

    expect(url).toBeNull();
    expect(mensaje).toContain("Juan");
  });

  it("uses only the first name and includes the exact closing", () => {
    const { mensaje } = generarWhatsApp("Juan Pérez García", "5512345678");

    expect(mensaje).toContain("Buen día, Juan.");
    expect(mensaje).not.toContain("Juan Pérez");
    expect(mensaje).toContain("Primero se revisa; después se decide.");
  });
});
