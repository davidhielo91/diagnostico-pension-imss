import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

async function source(relativePath: string) {
  return readFile(path.join(root, relativePath), "utf8");
}

async function exists(relativePath: string) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

describe("AI-free lead detail guard", () => {
  it("selects only detail fields and never serializes the historical AI summary", async () => {
    const [page, types, prospectCard, detail] = await Promise.all([
      source("src/app/(app)/leads/[id]/page.tsx"),
      source("src/components/leads/types.ts"),
      source("src/components/leads/lead-prospect-info-card.tsx"),
      source("src/components/leads/lead-detail.tsx"),
    ]);

    expect(page).toContain("select: {");
    expect(page).not.toContain("resumenIA");
    expect(types).not.toContain("resumenIA");
    expect(prospectCard).not.toContain("ResumenIa");
    expect(detail).not.toContain("LeadResumenIaPanel");
  });

  it("keeps the historical database field while excluding it from detail code", async () => {
    const [postgresSchema, sqliteSchema, migration] = await Promise.all([
      source("prisma/schema.prisma"),
      source("prisma/schema.sqlite.prisma"),
      source("prisma/migrations/20260618000000_add_push_and_resumen/migration.sql"),
    ]);

    expect(postgresSchema).toContain("resumenIA           String?");
    expect(sqliteSchema).toContain("resumenIA           String?");
    expect(migration).toContain('ADD COLUMN "resumenIA" TEXT');
  });
});

describe("manual lead email guard", () => {
  it("uses the deterministic template, encoded mailto, and existing email activity", async () => {
    const emailActions = await source("src/components/leads/lead-email-actions.tsx");

    expect(emailActions).toContain("generarCorreo(lead.nombre, lead.prioridad)");
    expect(emailActions).toContain("encodeURIComponent(correo.asunto)");
    expect(emailActions).toContain("encodeURIComponent(correo.cuerpo)");
    expect(emailActions).toContain('execute("correo_enviado")');
    expect(emailActions).not.toContain("useGenerarCorreoIA");
    expect(emailActions).not.toContain("correoIA");
  });

  it("does not initiate mail or record activity when the recipient is missing", async () => {
    const emailActions = await source("src/components/leads/lead-email-actions.tsx");

    expect(emailActions).toContain("disabled={!lead.correo}");
    expect(emailActions).toMatch(/onClick=\{\(\) => \{[\s\S]*window\.open[\s\S]*execute\("correo_enviado"\)[\s\S]*\}\}/);
    expect(emailActions).toContain('{lead.correo ? "Abrir correo" : "Sin correo registrado"}');
  });
});

describe("AI runtime removal guard", () => {
  it("removes the Mistral client and former AI route modules", async () => {
    const removedRuntimePaths = [
      "src/lib/ai.ts",
      "src/app/api/leads/[id]/generar-correo/route.ts",
      "src/app/api/leads/[id]/generar-resumen/route.ts",
    ];

    await expect(Promise.all(removedRuntimePaths.map(exists))).resolves.toEqual([false, false, false]);
  });

  it("keeps manual contact runtime free from Mistral credentials and AI endpoint paths", async () => {
    const [emailActions, actionRoute] = await Promise.all([
      source("src/components/leads/lead-email-actions.tsx"),
      source("src/app/api/leads/[id]/action/route.ts"),
    ]);
    const manualRuntime = `${emailActions}\n${actionRoute}`;

    expect(manualRuntime).not.toContain("MISTRAL_API_KEY");
    expect(manualRuntime).not.toContain("mistral.ai");
    expect(manualRuntime).not.toContain("generar-correo");
    expect(manualRuntime).not.toContain("generar-resumen");
    expect(actionRoute).toContain('correo_enviado');
  });

});
