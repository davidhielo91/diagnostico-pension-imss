import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { debeEjecutarReset, decidirAccionAdmin } from "../src/lib/seed-safety";

const prisma = new PrismaClient();

async function main() {
  // ── Limpieza de datos ────────────────────────────────────────────────────────
  // El borrado solo ocurre con ALLOW_RESET_ON_STARTUP=true Y NODE_ENV=staging.
  // En producción, RESET_ON_STARTUP=true ya no borra nada (gate de staging D2).
  if (debeEjecutarReset(process.env)) {
    await prisma.leadActivity.deleteMany({});
    await prisma.leadStatusHistory.deleteMany({});
    await prisma.leadNote.deleteMany({});
    await prisma.lead.deleteMany({});
    console.log("✓ Base de datos limpiada (RESET_ON_STARTUP=true + NODE_ENV=staging)");
  } else if (process.env.RESET_ON_STARTUP === "true") {
    console.warn(
      "✗ RESET_ON_STARTUP ignorado: requiere ALLOW_RESET_ON_STARTUP=true y NODE_ENV=staging. No se borró ningún dato."
    );
  }

  // ── Admin ────────────────────────────────────────────────────────────────────
  // D1: si ya existe un administrador, su contraseña NUNCA se sobrescribe.
  // Primer arranque sin ADMIN_PASSWORD → falla con exit(1) (no hay fallback admin123).
  const adminEmail = process.env.ADMIN_EMAIL || "admin@despacho.com";
  const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });

  const decision = decidirAccionAdmin(Boolean(existingUser), process.env.ADMIN_PASSWORD);

  if (decision.accion === "fallar") {
    console.error(
      "✗ ADMIN_PASSWORD no está definido y no existe un administrador. Configura ADMIN_PASSWORD para el primer arranque."
    );
    process.exit(1);
  }

  if (decision.accion === "omitir") {
    console.log(`✓ Administrador existente (${adminEmail}): no se modifica su contraseña.`);
  } else {
    const hashedPassword = await hash(decision.password, 12);
    await prisma.user.create({
      data: {
        name: "Administrador",
        email: adminEmail,
        password: hashedPassword,
        role: "administrador",
      },
    });
    console.log(`✓ Usuario administrador creado: ${adminEmail}`);
  }

  // Reasignar leads sin asignar al administrador
  const adminUser = await prisma.user.findFirst({
    where: { role: "administrador", active: true },
    select: { id: true },
  });
  if (adminUser) {
    const { count } = await prisma.lead.updateMany({
      where: { userId: null },
      data: { userId: adminUser.id },
    });
    if (count > 0) console.log(`✓ ${count} leads reasignados al administrador`);
  }

  console.log("✓ Sistema listo");
}

if (process.env.NODE_ENV !== "test") {
  main()
    .catch((e) => {
      console.error("Error en seed:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
