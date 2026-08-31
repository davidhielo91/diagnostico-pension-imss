import { describe, expect, it } from "vitest";
import { linkWhatsAppEntrante } from "@/lib/constants";

describe("linkWhatsAppEntrante", () => {
  it("builds an encoded incoming WhatsApp link", () => {
    const url = linkWhatsAppEntrante("Hola señor, pensión");

    expect(url).toMatch(/^https:\/\/wa\.me\/526563506014\?text=/);
    expect(url).toContain("%20");
    expect(url).toContain("%C3%B3");
    expect(url).toContain("%C3%B1");
  });
});
