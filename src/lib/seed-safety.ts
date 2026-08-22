export interface SeedEnv {
  RESET_ON_STARTUP?: string;
  ALLOW_RESET_ON_STARTUP?: string;
  NODE_ENV?: string;
  ADMIN_PASSWORD?: string;
}

/**
 * Reset gate (D2): the data wipe only runs when the operator explicitly opts in
 * with ALLOW_RESET_ON_STARTUP=true AND NODE_ENV=staging. Production data is
 * never wiped on boot, even if the old RESET_ON_STARTUP=true flag is present.
 */
export function debeEjecutarReset(env: SeedEnv): boolean {
  return (
    env.RESET_ON_STARTUP === "true" &&
    env.ALLOW_RESET_ON_STARTUP === "true" &&
    env.NODE_ENV === "staging"
  );
}

export type DecisionAdmin =
  | { accion: "crear"; password: string }
  | { accion: "omitir" }
  | { accion: "fallar" };

/**
 * Admin seed decision (D1): an existing admin's password is NEVER overwritten;
 * a first boot without ADMIN_PASSWORD fails loudly (exit 1) instead of falling
 * back to a hardcoded default.
 */
export function decidirAccionAdmin(
  adminExiste: boolean,
  adminPassword: string | undefined
): DecisionAdmin {
  if (adminExiste) return { accion: "omitir" };
  if (!adminPassword) return { accion: "fallar" };
  return { accion: "crear", password: adminPassword };
}