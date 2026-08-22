/**
 * Output sanitization helpers (D12).
 *
 * escapeHtml: render-escape for user fields interpolated into HTML emails so
 *   attacker payloads render as text instead of executing.
 * sanitizeCellValue: neutralizes XLSX formula injection by prefixing cells that
 *   start with = + - @ tab or CR with an apostrophe (Excel treats them as text).
 */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeCellValue(v: unknown): unknown {
  if (typeof v !== "string") return v;
  if (/^[=+\-@\t\r]/.test(v)) return `'${v}`;
  return v;
}