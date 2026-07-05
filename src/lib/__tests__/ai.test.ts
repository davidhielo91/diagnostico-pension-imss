import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generarResumenConIA, generarCorreoConIA, type LeadParaMensaje } from "@/lib/ai";

const okResp = (content: string) => ({
  ok: true,
  status: 200,
  json: async () => ({ choices: [{ message: { content } }] }),
});
const errResp = (status = 500) => ({ ok: false, status, json: async () => ({}) });

let fetchMock: ReturnType<typeof vi.fn>;
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const fallbackCorreo = {
  asunto: "Su consulta de pensión IMSS — Despacho Fiscal 2087",
  cuerpo:
    "Hola, Juan.\n\nRecibimos su consulta sobre pensión IMSS. En el Despacho Fiscal 2087 podemos hacer una revisión detallada de su situación para que usted cuente con información clara antes de tomar cualquier decisión.\n\nPara conocer en qué consiste el Diagnóstico de Pensión IMSS y agendar su cita con el Contador Gerardo Huerta, aquí tiene más información: https://pensiones.contadorgerardohuerta.com\n\nAtentamente,\nEquipo del Despacho Fiscal 2087\nContador Gerardo Huerta",
};

function baseLead(overrides: Partial<LeadParaMensaje> = {}): LeadParaMensaje {
  return {
    nombre: "Juan Pérez",
    edad: 45,
    ciudad: "Ciudad Juárez",
    temaInteres: "Ley 73",
    situacion: "Quiero saber si me conviene la modalidad 40 para mi pensión.",
    categoria: "Ley 73",
    prioridad: "Media",
    yaEstaPensionado: "no",
    ...overrides,
  };
}

describe("generarCorreoConIA — first-call fallback bugfix guard", () => {
  it("does NOT throw and returns the exact fallbackCorreo when the first response is malformed JSON", async () => {
    fetchMock.mockResolvedValueOnce(okResp("this is not valid json"));

    await expect(generarCorreoConIA(baseLead())).resolves.toEqual(fallbackCorreo);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  it("does NOT throw and returns the exact fallbackCorreo when the first fetch call rejects (network error)", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));

    await expect(generarCorreoConIA(baseLead())).resolves.toEqual(fallbackCorreo);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });
});

describe("generarCorreoConIA — brand-voice guardrail flow", () => {
  it("returns the parsed {asunto, cuerpo} directly and calls fetch exactly once on a clean first response", async () => {
    const clean = { asunto: "Su caso de pensión IMSS", cuerpo: "Contenido limpio sin frases prohibidas." };
    fetchMock.mockResolvedValueOnce(okResp(JSON.stringify(clean)));

    const result = await generarCorreoConIA(baseLead());

    expect(result).toEqual(clean);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries once when the first response contains a forbidden phrase, then returns the clean retry output", async () => {
    const forbidden = { asunto: "Su pensión", cuerpo: "Le garantizamos un aumento en su pensión." };
    const clean = { asunto: "Su caso de pensión IMSS", cuerpo: "Contenido limpio sin frases prohibidas." };
    fetchMock
      .mockResolvedValueOnce(okResp(JSON.stringify(forbidden)))
      .mockResolvedValueOnce(okResp(JSON.stringify(clean)));

    const result = await generarCorreoConIA(baseLead());

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual(clean);

    const secondCallBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    const secondCallMessages = secondCallBody.messages as Array<{ role: string; content: string }>;
    expect(secondCallMessages.some((m) => m.role === "assistant" && m.content === JSON.stringify(forbidden))).toBe(
      true
    );
    expect(secondCallMessages.some((m) => m.role === "user" && m.content.includes("ADVERTENCIA CRÍTICA"))).toBe(true);
  });

  it("falls back when the first response and the retry both contain forbidden phrases", async () => {
    const forbidden1 = { asunto: "Su pensión", cuerpo: "Le garantizamos un aumento en su pensión." };
    const forbidden2 = { asunto: "Su pensión", cuerpo: "Su pensión va a subir pronto." };
    fetchMock
      .mockResolvedValueOnce(okResp(JSON.stringify(forbidden1)))
      .mockResolvedValueOnce(okResp(JSON.stringify(forbidden2)));

    const result = await generarCorreoConIA(baseLead());

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual(fallbackCorreo);
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
  });

  it("falls back when the first response is forbidden and the retry call throws", async () => {
    const forbidden1 = { asunto: "Su pensión", cuerpo: "Le garantizamos un aumento en su pensión." };
    fetchMock.mockResolvedValueOnce(okResp(JSON.stringify(forbidden1))).mockRejectedValueOnce(new Error("network"));

    const result = await generarCorreoConIA(baseLead());

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual(fallbackCorreo);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
  });

  it("strips a markdown JSON fence and parses the body successfully", async () => {
    const clean = { asunto: "Su caso de pensión IMSS", cuerpo: "Contenido limpio sin frases prohibidas." };
    fetchMock.mockResolvedValueOnce(okResp("```json\n" + JSON.stringify(clean) + "\n```"));

    const result = await generarCorreoConIA(baseLead());

    expect(result).toEqual(clean);
  });

  it("includes the NOTA VIUDEZ instruction in the prompt when temaInteres or categoria mentions viudez", async () => {
    const clean = { asunto: "Su caso", cuerpo: "Contenido limpio." };
    fetchMock.mockResolvedValueOnce(okResp(JSON.stringify(clean)));

    await generarCorreoConIA(baseLead({ temaInteres: "Viudez", categoria: "Viudez" }));

    const firstCallBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    const prompt = firstCallBody.messages[0].content as string;
    expect(prompt).toContain("NOTA VIUDEZ");
  });
});

describe("generarResumenConIA", () => {
  it.each([
    ["si", "ya está pensionado"],
    ["no", "aún no está pensionado"],
    [undefined, "no sabe si está pensionado"],
  ])("includes the derived phrase for yaEstaPensionado=%s and sends max_tokens:300, temperature:0.4", async (yaEstaPensionado, fraseEsperada) => {
    fetchMock.mockResolvedValueOnce(okResp("Resumen generado."));

    await generarResumenConIA({
      ...baseLead({ yaEstaPensionado: yaEstaPensionado as string }),
      viabilidad: "Recomendar diagnóstico",
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.max_tokens).toBe(300);
    expect(body.temperature).toBe(0.4);
    expect(body.messages[0].content).toContain(fraseEsperada);
  });

  it("returns the trimmed content from a successful response", async () => {
    fetchMock.mockResolvedValueOnce(okResp("  Resumen con espacios.  "));

    const result = await generarResumenConIA({
      ...baseLead(),
      viabilidad: "Recomendar diagnóstico",
    });

    expect(result).toBe("Resumen con espacios.");
  });

  it("throws an error containing the status when the response is not 2xx", async () => {
    fetchMock.mockResolvedValueOnce(errResp(500));

    await expect(
      generarResumenConIA({ ...baseLead(), viabilidad: "Recomendar diagnóstico" })
    ).rejects.toThrow("500");
  });
});
