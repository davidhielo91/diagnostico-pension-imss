import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { type LeadInput } from "@/lib/classification";
import { importLeadsInBatches, MAX_IMPORT_ROWS, type LeadImportClient } from "@/lib/lead-import";
import { prisma } from "@/lib/prisma";
import { FUENTES, OBJETIVOS_PRINCIPALES, TEMAS_INTERES } from "@/lib/constants";
import * as XLSX from "xlsx";

const REQUIRED_ROW_FIELDS = ["nombre", "telefono", "edad", "ciudad", "yaEstaPensionado", "temaInteres", "situacion"] as const;
const BOOLEAN_VALUES = ["si", "no", "no_sé"] as const;

function isAllowedValue(value: string, allowedValues: readonly string[]): boolean {
  return allowedValues.includes(value);
}

const COLUMN_ALIASES: Record<string, string> = {
  nombre: "nombre",
  name: "nombre",
  ["nombre completo"]: "nombre",
  telefono: "telefono",
  ["teléfono"]: "telefono",
  tel: "telefono",
  phone: "telefono",
  correo: "correo",
  email: "correo",
  mail: "correo",
  edad: "edad",
  age: "edad",
  ciudad: "ciudad",
  city: "ciudad",
  estado: "estado",
  ["estado (mx)"]: "estado",
  province: "estado",
  pensionado: "yaEstaPensionado",
  ["ya está pensionado"]: "yaEstaPensionado",
  ["ya esta pensionado"]: "yaEstaPensionado",
  tema: "temaInteres",
  ["tema de interés"]: "temaInteres",
  ["tema de interes"]: "temaInteres",
  ["tema interés"]: "temaInteres",
  ["tema interes"]: "temaInteres",
  interest: "temaInteres",
  semanas: "tieneSemanasCotizadas",
  ["semanas cotizadas"]: "tieneSemanasCotizadas",
  ["tiene semanas"]: "tieneSemanasCotizadas",
  fuente: "fuente",
  source: "fuente",
  origen: "fuente",
  ["cómo nos encontró"]: "fuente",
  situacion: "situacion",
  ["situación"]: "situacion",
  ["situación que comenta"]: "situacion",
  situation: "situacion",
  comentario: "situacion",
  objetivo: "objetivoPrincipal",
  ["objetivo principal"]: "objetivoPrincipal",
  fecha: "fechaCreacion",
  ["fecha creacion"]: "fechaCreacion",
  ["fecha creación"]: "fechaCreacion",
  ["fecha de creacion"]: "fechaCreacion",
  ["fecha de creación"]: "fechaCreacion",
  ["fecha de llegada"]: "fechaCreacion",
  ["fecha lead"]: "fechaCreacion",
  ["fecha registro"]: "fechaCreacion",
  ["fecha contacto"]: "fechaCreacion",
  date: "fechaCreacion",
  ["created at"]: "fechaCreacion",
};

function normalizarHeader(header: string): string {
  const lower = header.toLowerCase().trim().replace(/[¿?¡!:;.-]/g, "");
  return COLUMN_ALIASES[lower] ?? "";
}

function parseBooleanish(val: unknown): string | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  const s = String(val).toLowerCase().trim();
  if (["si", "sí", "yes", "y", "1"].includes(s)) return "si";
  if (["no", "n", "0"].includes(s)) return "no";
  if (["no sé", "no se", "nose", "doubt", "tal vez"].includes(s)) return "no_sé";
  return s;
}

function limpiarTelefono(tel: unknown): string {
  return String(tel ?? "").replace(/[\s\-–—()]+/g, "");
}

function parseFecha(val: unknown): Date | undefined {
  if (!val) return undefined;
  // Date object (xlsx con cellDates:true o valor ya parseado)
  if (val instanceof Date) return isNaN(val.getTime()) ? undefined : val;
  // Número: serial de Excel (días desde 1900-01-01)
  if (typeof val === "number") {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return isNaN(date.getTime()) ? undefined : date;
  }
  const s = String(val).trim();
  if (!s) return undefined;
  // DD/MM/YYYY o DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) return new Date(parseInt(dmy[3]), parseInt(dmy[2]) - 1, parseInt(dmy[1]));
  // YYYY-MM-DD o YYYY/MM/DD
  const ymd = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (ymd) return new Date(parseInt(ymd[1]), parseInt(ymd[2]) - 1, parseInt(ymd[3]));
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Se requiere multipart/form-data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Archivo no encontrado. Campo esperado: 'file'" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["xlsx", "xls", "csv"].includes(ext ?? "")) {
    return NextResponse.json({ error: "Formato no soportado. Usa .xlsx, .xls o .csv" }, { status: 400 });
  }

  if (file.size > 5_000_000) {
    return NextResponse.json({ error: "El archivo no puede superar 5 MB" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  } catch {
    return NextResponse.json({ error: "No se pudo leer el archivo. ¿Está corrupto?" }, { status: 400 });
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return NextResponse.json({ error: "El archivo Excel está vacío" }, { status: 400 });
  }

  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  if (rawData.length === 0) {
    return NextResponse.json({ error: "El archivo no contiene datos" }, { status: 400 });
  }

  if (rawData.length > MAX_IMPORT_ROWS) {
    return NextResponse.json({ error: "El archivo no puede tener más de 1,000 filas por importación" }, { status: 400 });
  }

  const headers = Object.keys(rawData[0]);
  const columnMap: Record<string, string> = {};
  for (const h of headers) {
    const mapped = normalizarHeader(h);
    if (mapped) columnMap[mapped] = h;
  }

  const missing = REQUIRED_ROW_FIELDS.filter((r) => !columnMap[r]);
  if (missing.length > 0) {
    return NextResponse.json({
      error: `No se encontraron las columnas necesarias: ${missing.join(", ")}`,
      headersEncontrados: headers,
    }, { status: 400 });
  }

  const errors: { fila: number; error: string }[] = [];
  const validInputs: LeadInput[] = [];

  for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    const fila = i + 2;

    try {
      const nombre = String(row[columnMap.nombre] ?? "").trim();
      const telefono = limpiarTelefono(row[columnMap.telefono]);
      const ciudad = String(row[columnMap.ciudad] ?? "").trim();
      const temaInteres = String(row[columnMap.temaInteres] ?? "").trim();
      const situacion = String(row[columnMap.situacion] ?? "").trim();
      const requiredValues = {
        nombre,
        telefono,
        edad: String(row[columnMap.edad] ?? "").trim(),
        ciudad,
        yaEstaPensionado: String(row[columnMap.yaEstaPensionado] ?? "").trim(),
        temaInteres,
        situacion,
      };
      const missingValue = Object.entries(requiredValues).find(([, value]) => !value)?.[0];
      if (missingValue) {
        errors.push({ fila, error: `${missingValue} is required` });
        continue;
      }

      const edad = parseInt(String(row[columnMap.edad] ?? "").trim(), 10);
      if (isNaN(edad) || edad < 18 || edad > 120) {
        errors.push({ fila, error: "edad must be between 18 and 120" });
        continue;
      }

      const yaEstaPensionado = parseBooleanish(row[columnMap.yaEstaPensionado]);
      if (!yaEstaPensionado || !isAllowedValue(yaEstaPensionado, BOOLEAN_VALUES)) {
        errors.push({ fila, error: "yaEstaPensionado must be si, no, or no_sé" });
        continue;
      }

      const semanas = parseBooleanish(row[columnMap.tieneSemanasCotizadas]);
      if (semanas && !isAllowedValue(semanas, BOOLEAN_VALUES)) {
        errors.push({ fila, error: "tieneSemanasCotizadas must be si, no, or no_sé" });
        continue;
      }

      if (!isAllowedValue(temaInteres, TEMAS_INTERES)) {
        errors.push({ fila, error: "temaInteres must be a supported interest topic" });
        continue;
      }

      const fuente = String(row[columnMap.fuente] ?? "").trim() || undefined;
      if (fuente && !isAllowedValue(fuente, FUENTES)) {
        errors.push({ fila, error: "fuente must be a supported source" });
        continue;
      }

      const objetivoPrincipal = String(row[columnMap.objetivoPrincipal] ?? "").trim() || undefined;
      if (objetivoPrincipal && !isAllowedValue(objetivoPrincipal, OBJETIVOS_PRINCIPALES)) {
        errors.push({ fila, error: "objetivoPrincipal must be a supported primary objective" });
        continue;
      }

      const fechaCreacion = columnMap.fechaCreacion
        ? parseFecha(row[columnMap.fechaCreacion])
        : undefined;

      validInputs.push({
        nombre,
        telefono,
        correo: String(row[columnMap.correo] ?? "").trim() || undefined,
        edad,
        ciudad,
        estado: String(row[columnMap.estado] ?? "").trim() || undefined,
        yaEstaPensionado,
        temaInteres,
        tieneSemanasCotizadas: semanas,
        fuente,
        objetivoPrincipal,
        situacion,
        createdAt: fechaCreacion,
      });
    } catch (err) {
      errors.push({ fila, error: err instanceof Error ? err.message : "Error desconocido" });
    }
  }

  let creados = 0;
  let duplicados = 0;
  try {
    ({ creados, duplicados } = await importLeadsInBatches(validInputs, prisma as unknown as LeadImportClient));
  } catch (err) {
    errors.push({ fila: 0, error: err instanceof Error ? err.message : "Error desconocido" });
  }

  return NextResponse.json({
    success: true,
    procesados: rawData.length,
    creados,
    duplicados,
    errores: errors.length,
    detalleErrores: errors.slice(0, 20),
  });
}
