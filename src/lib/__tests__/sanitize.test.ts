import { describe, it, expect } from "vitest";
import { escapeHtml, sanitizeCellValue } from "@/lib/sanitize";

describe("escapeHtml", () => {
  it("escapes HTML metacharacters that would execute in an email", () => {
    expect(escapeHtml(`<script>alert("xss")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
    );
  });

  it("escapes single quotes and ampersands", () => {
    expect(escapeHtml("O'Brien & Sons")).toBe("O&#39;Brien &amp; Sons");
  });

  it("leaves plain Spanish text untouched", () => {
    expect(escapeHtml("Juan Pérez, Ciudad Juárez")).toBe("Juan Pérez, Ciudad Juárez");
  });

  it("escapes an empty string to an empty string", () => {
    expect(escapeHtml("")).toBe("");
  });
});

describe("sanitizeCellValue (XLSX formula injection)", () => {
  it.each([
    ["=SUM(A1:A9)", "'=SUM(A1:A9)"],
    ["+cmd|'/C calc'!A0", "'+cmd|'/C calc'!A0"],
    ["-2+3", "'-2+3"],
    ["@SUM(A1)", "'@SUM(A1)"],
    ["\t=HYPERLINK(\"http://evil\")", "'\t=HYPERLINK(\"http://evil\")"],
    ["\r=1+1", "'\r=1+1"],
  ])("prefixes a leading %j with an apostrophe", (raw, expected) => {
    expect(sanitizeCellValue(raw)).toBe(expected);
  });

  it("leaves values that do not start with a dangerous character untouched", () => {
    expect(sanitizeCellValue("Juan Pérez")).toBe("Juan Pérez");
    expect(sanitizeCellValue("  =leading space")).toBe("  =leading space");
    expect(sanitizeCellValue("1+1")).toBe("1+1");
  });

  it("passes non-string values through unchanged", () => {
    expect(sanitizeCellValue(42)).toBe(42);
    expect(sanitizeCellValue(true)).toBe(true);
    expect(sanitizeCellValue(null)).toBeNull();
    expect(sanitizeCellValue(undefined)).toBeUndefined();
  });
});