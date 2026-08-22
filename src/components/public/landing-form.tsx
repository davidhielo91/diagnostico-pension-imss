"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const TEMA_MAP: Record<string, string> = {
  saber_cuanto:          "Saber cuánto me tocaría de pensión",
  ley_73:                "Ley 73",
  ley_97:                "Ley 97",
  modalidad_40:          "Modalidad 40",
  modalidad_10:          "Modalidad 10",
  semanas_cotizadas:     "Semanas cotizadas",
  conservacion_derechos: "Conservación de derechos",
  afore:                 "AFORE",
  ya_pensionado:         "Ya estoy pensionado / Pensión baja",
  pension_baja:          "Pensión baja",
  invalidez:             "Invalidez",
  viudez:                "Viudez",
  otro:                  "Otro",
};

const FUENTE_MAP: Record<string, string> = {
  tiktok:        "TikTok",
  youtube:       "YouTube",
  facebook:      "Facebook",
  google:        "Google",
  recomendacion: "Recomendación",
};

const ESTADOS_MAP: Record<string, string> = {
  aguascalientes:      "Aguascalientes",
  baja_california:     "Baja California",
  baja_california_sur: "Baja California Sur",
  campeche:            "Campeche",
  chiapas:             "Chiapas",
  chihuahua:           "Chihuahua",
  cdmx:                "Ciudad de México",
  coahuila:            "Coahuila",
  colima:              "Colima",
  durango:             "Durango",
  guanajuato:          "Guanajuato",
  guerrero:            "Guerrero",
  hidalgo:             "Hidalgo",
  jalisco:             "Jalisco",
  estado_mexico:       "Estado de México",
  michoacan:           "Michoacán",
  morelos:             "Morelos",
  nayarit:             "Nayarit",
  nuevo_leon:          "Nuevo León",
  oaxaca:              "Oaxaca",
  puebla:              "Puebla",
  queretaro:           "Querétaro",
  quintana_roo:        "Quintana Roo",
  san_luis_potosi:     "San Luis Potosí",
  sinaloa:             "Sinaloa",
  sonora:              "Sonora",
  tabasco:             "Tabasco",
  tamaulipas:          "Tamaulipas",
  tlaxcala:            "Tlaxcala",
  veracruz:            "Veracruz",
  yucatan:             "Yucatán",
  zacatecas:           "Zacatecas",
};

type Fields = {
  nombre: string;
  telefono: string;
  edad: string;
  yaEstaPensionado: string;
  situacion: string;
  correo: string;
  ciudad: string;
  estado: string;
  temaInteres: string;
  objetivoPrincipal: string;
  tieneSemanasCotizadas: string;
  fuente: string;
  website: string;
  consentimiento: boolean;
};

type Errors = Partial<Record<keyof Fields, string>>;

const STEP1_FIELDS: (keyof Fields)[] = ["nombre", "telefono", "edad", "yaEstaPensionado", "situacion"];

// Fields rendered as a <fieldset> of radios have no single element whose id matches
// the field key — focus the first radio in that group by its `name` instead.
const FIELDSET_RADIO_NAME: Partial<Record<keyof Fields, string>> = {
  yaEstaPensionado: "pensionado",
  tieneSemanasCotizadas: "semanas",
};

function focusFirstError(errs: Errors) {
  const firstKey = Object.keys(errs)[0] as keyof Fields | undefined;
  if (!firstKey) return;
  const radioName = FIELDSET_RADIO_NAME[firstKey];
  const el = radioName
    ? document.querySelector<HTMLElement>(`input[name="${radioName}"]`)
    : document.getElementById(firstKey);
  el?.focus();
}

function validate(fields: Fields, keys: (keyof Fields)[]): Errors {
  const errs: Errors = {};
  for (const k of keys) {
    switch (k) {
      case "nombre":
        if (!fields.nombre.trim() || fields.nombre.trim().length < 2)
          errs.nombre = "Escribe tu nombre completo.";
        break;
      case "telefono":
        if (fields.telefono.replace(/\D/g, "").length < 10)
          errs.telefono = "Ingresa un número de WhatsApp válido (10 dígitos).";
        break;
      case "edad": {
        const n = parseInt(fields.edad);
        if (isNaN(n) || n < 18 || n > 110)
          errs.edad = "Ingresa una edad válida (18–110).";
        break;
      }
      case "yaEstaPensionado":
        if (!fields.yaEstaPensionado)
          errs.yaEstaPensionado = "Selecciona si ya estás pensionado.";
        break;
      case "situacion":
        if (fields.situacion.trim().length < 10)
          errs.situacion = "Cuéntanos un poco más sobre tu situación (mínimo 10 caracteres).";
        break;
      case "correo":
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.correo.trim()))
          errs.correo = "Escribe un correo electrónico válido.";
        break;
      case "ciudad":
        if (!fields.ciudad.trim() || fields.ciudad.trim().length < 2)
          errs.ciudad = "Escribe tu ciudad.";
        break;
      case "estado":
        if (!fields.estado) errs.estado = "Selecciona tu estado.";
        break;
      case "temaInteres":
        if (!fields.temaInteres) errs.temaInteres = "Selecciona el tema que deseas revisar.";
        break;
      case "objetivoPrincipal":
        if (!fields.objetivoPrincipal) errs.objetivoPrincipal = "Selecciona tu objetivo principal.";
        break;
      case "tieneSemanasCotizadas":
        if (!fields.tieneSemanasCotizadas)
          errs.tieneSemanasCotizadas = "Indica si tienes reporte de semanas cotizadas.";
        break;
      case "fuente":
        if (!fields.fuente) errs.fuente = "Indica cómo nos encontraste.";
        break;
      case "consentimiento":
        if (!fields.consentimiento) errs.consentimiento = "Debes aceptar para continuar.";
        break;
    }
  }
  return errs;
}

export function LandingForm() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const [fields, setFields] = useState<Fields>({
    nombre: "",
    telefono: "",
    edad: "",
    yaEstaPensionado: "",
    situacion: "",
    correo: "",
    ciudad: "",
    estado: "",
    temaInteres: "",
    objetivoPrincipal: "",
    tieneSemanasCotizadas: "",
    fuente: "",
    website: "",
    consentimiento: false,
  });

  function set(key: keyof Fields, value: string | boolean) {
    setFields((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function scrollToForm() {
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function handleNext() {
    const errs = validate(fields, STEP1_FIELDS);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      focusFirstError(errs);
      return;
    }
    setStep(2);
    scrollToForm();
  }

  function handleBack() {
    setStep(1);
    scrollToForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const STEP2_FIELDS: (keyof Fields)[] = [
      "correo", "ciudad", "estado", "temaInteres", "objetivoPrincipal",
      "tieneSemanasCotizadas", "fuente", "consentimiento",
    ];
    const errs = validate(fields, STEP2_FIELDS);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setGlobalError("Por favor corrige los campos marcados antes de continuar.");
      focusFirstError(errs);
      return;
    }
    setLoading(true);
    setGlobalError("");

    try {
      const res = await fetch("/api/public/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre:               fields.nombre.trim(),
          telefono:             fields.telefono.trim(),
          correo:               fields.correo.trim(),
          edad:                 parseInt(fields.edad),
          ciudad:               fields.ciudad.trim(),
          estado:               ESTADOS_MAP[fields.estado] ?? fields.estado,
          yaEstaPensionado:     fields.yaEstaPensionado,
          temaInteres:          TEMA_MAP[fields.temaInteres] ?? fields.temaInteres,
          objetivoPrincipal:    fields.objetivoPrincipal,
          tieneSemanasCotizadas: fields.tieneSemanasCotizadas,
          fuente:               FUENTE_MAP[fields.fuente] ?? fields.fuente,
          situacion:            fields.situacion.trim(),
          website:              fields.website,
        }),
      });

      if (res.ok) {
        router.push("/gracias");
      } else {
        const body = await res.json().catch(() => ({}));
        setGlobalError((body as { error?: string }).error || "Ocurrió un error al enviar. Intenta de nuevo.");
      }
    } catch {
      setGlobalError("Error de conexión. Verifica tu internet e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function fg(key: keyof Fields) {
    return `field-group${errors[key] ? " has-error" : ""}`;
  }

  return (
    <div className="form-card" ref={formRef}>
      <form onSubmit={handleSubmit} noValidate autoComplete="on">
        <div aria-hidden="true" style={{ position: "absolute", left: "-10000px" }}>
          <label htmlFor="website">Website</label>
          <input
            type="text"
            id="website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={fields.website}
            onChange={(e) => set("website", e.target.value)}
          />
        </div>
        {/* Step indicator */}
        <div className="step-indicator" role="progressbar" aria-label="Progreso del formulario" aria-valuenow={step} aria-valuemin={1} aria-valuemax={2}>
          <div className="step-progress">
            <div className={`step-dot${step === 1 ? " active" : " done"}`}>
              {step > 1 ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : "1"}
            </div>
            <div className="step-bar">
              <div className="step-bar-fill" style={{ width: step === 2 ? "100%" : "0%" }} />
            </div>
            <div className={`step-dot${step === 2 ? " active" : ""}`}>2</div>
          </div>
          <div className="step-labels">
            <span className={step === 1 ? "active" : ""}>Datos básicos</span>
            <span className={step === 2 ? "active" : ""}>Detalle adicional</span>
          </div>
        </div>

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="form-step form-step-1">
            <div className={fg("nombre")}>
              <label className="field-label" htmlFor="nombre">
                Nombre completo <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <p className="field-hint">Si estás ayudando a un familiar, escribe el nombre de quien necesita la pensión.</p>
              <input
                type="text"
                id="nombre"
                className="field-input"
                placeholder="Ej. Juan Pérez López"
                autoComplete="name"
                value={fields.nombre}
                onChange={(e) => set("nombre", e.target.value)}
                onBlur={() => setErrors((er) => ({ ...er, ...validate(fields, ["nombre"]) }))}
              />
              {errors.nombre && <p className="field-error" role="alert">{errors.nombre}</p>}
            </div>

            <div className={fg("telefono")}>
              <label className="field-label" htmlFor="telefono">
                Teléfono / WhatsApp <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <p className="field-hint">El número donde podemos escribirte por WhatsApp.</p>
              <input
                type="tel"
                id="telefono"
                className="field-input"
                placeholder="Ej. 5512345678"
                autoComplete="tel"
                inputMode="tel"
                value={fields.telefono}
                onChange={(e) => set("telefono", e.target.value)}
                onBlur={() => setErrors((er) => ({ ...er, ...validate(fields, ["telefono"]) }))}
              />
              {errors.telefono && <p className="field-error" role="alert">{errors.telefono}</p>}
            </div>

            <div className={fg("edad")}>
              <label className="field-label" htmlFor="edad">
                Edad <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <input
                type="text"
                id="edad"
                className="field-input"
                placeholder="Ej. 60"
                inputMode="numeric"
                maxLength={3}
                value={fields.edad}
                onChange={(e) => set("edad", e.target.value.replace(/\D/g, ""))}
                onBlur={() => setErrors((er) => ({ ...er, ...validate(fields, ["edad"]) }))}
              />
              {errors.edad && <p className="field-error" role="alert">{errors.edad}</p>}
            </div>

            <fieldset className={`field-group fieldset-group${errors.yaEstaPensionado ? " has-error" : ""}`}>
              <legend className="field-label">
                ¿Ya estás pensionado? <span className="required-mark" aria-hidden="true">*</span>
              </legend>
              <div className="radio-row">
                {[{ v: "si", l: "Sí" }, { v: "no", l: "No" }].map(({ v, l }) => (
                  <label key={v} className="radio-label">
                    <input
                      type="radio"
                      name="pensionado"
                      value={v}
                      className="radio-input"
                      checked={fields.yaEstaPensionado === v}
                      onChange={() => set("yaEstaPensionado", v)}
                    />
                    <span className="radio-custom" aria-hidden="true" />
                    {l}
                  </label>
                ))}
              </div>
              {errors.yaEstaPensionado && <p className="field-error" role="alert">{errors.yaEstaPensionado}</p>}
            </fieldset>

            <div className={fg("situacion")}>
              <label className="field-label" htmlFor="situacion">
                Cuéntanos tu situación o tu duda principal <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <p className="field-hint">Mientras más detalles compartas, mejor podremos orientarte.</p>
              <textarea
                id="situacion"
                className="field-input field-textarea"
                placeholder={"Por ejemplo:\nTengo 61 años. Dejé de trabajar hace varios años.\nNo sé si pertenezco a Ley 73.\nQuiero saber si puedo pensionarme."}
                maxLength={1000}
                value={fields.situacion}
                onChange={(e) => set("situacion", e.target.value)}
                onBlur={() => setErrors((er) => ({ ...er, ...validate(fields, ["situacion"]) }))}
              />
              {errors.situacion && <p className="field-error" role="alert">{errors.situacion}</p>}
            </div>

            <button type="button" className="btn-next-step" onClick={handleNext}>
              Continuar
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="form-step form-step-2">
            <div className={fg("correo")}>
              <label className="field-label" htmlFor="correo">
                Correo electrónico <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <input
                type="email"
                id="correo"
                className="field-input"
                placeholder="Ej. correo@ejemplo.com"
                autoComplete="email"
                inputMode="email"
                value={fields.correo}
                onChange={(e) => set("correo", e.target.value)}
                onBlur={() => setErrors((er) => ({ ...er, ...validate(fields, ["correo"]) }))}
              />
              {errors.correo && <p className="field-error" role="alert">{errors.correo}</p>}
            </div>

            <div className={fg("ciudad")}>
              <label className="field-label" htmlFor="ciudad">
                Ciudad <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <input
                type="text"
                id="ciudad"
                className="field-input"
                placeholder="Ej. Monterrey"
                autoComplete="address-level2"
                value={fields.ciudad}
                onChange={(e) => set("ciudad", e.target.value)}
                onBlur={() => setErrors((er) => ({ ...er, ...validate(fields, ["ciudad"]) }))}
              />
              {errors.ciudad && <p className="field-error" role="alert">{errors.ciudad}</p>}
            </div>

            <div className={fg("estado")}>
              <label className="field-label" htmlFor="estado">
                Estado de la República <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <select
                id="estado"
                className="field-input field-select"
                value={fields.estado}
                onChange={(e) => set("estado", e.target.value)}
              >
                <option value="">Selecciona tu estado...</option>
                <option value="aguascalientes">Aguascalientes</option>
                <option value="baja_california">Baja California</option>
                <option value="baja_california_sur">Baja California Sur</option>
                <option value="campeche">Campeche</option>
                <option value="chiapas">Chiapas</option>
                <option value="chihuahua">Chihuahua</option>
                <option value="cdmx">Ciudad de México</option>
                <option value="coahuila">Coahuila</option>
                <option value="colima">Colima</option>
                <option value="durango">Durango</option>
                <option value="guanajuato">Guanajuato</option>
                <option value="guerrero">Guerrero</option>
                <option value="hidalgo">Hidalgo</option>
                <option value="jalisco">Jalisco</option>
                <option value="estado_mexico">Estado de México</option>
                <option value="michoacan">Michoacán</option>
                <option value="morelos">Morelos</option>
                <option value="nayarit">Nayarit</option>
                <option value="nuevo_leon">Nuevo León</option>
                <option value="oaxaca">Oaxaca</option>
                <option value="puebla">Puebla</option>
                <option value="queretaro">Querétaro</option>
                <option value="quintana_roo">Quintana Roo</option>
                <option value="san_luis_potosi">San Luis Potosí</option>
                <option value="sinaloa">Sinaloa</option>
                <option value="sonora">Sonora</option>
                <option value="tabasco">Tabasco</option>
                <option value="tamaulipas">Tamaulipas</option>
                <option value="tlaxcala">Tlaxcala</option>
                <option value="veracruz">Veracruz</option>
                <option value="yucatan">Yucatán</option>
                <option value="zacatecas">Zacatecas</option>
              </select>
              {errors.estado && <p className="field-error" role="alert">{errors.estado}</p>}
            </div>

            <div className={fg("temaInteres")}>
              <label className="field-label" htmlFor="temaInteres">
                ¿Qué tema deseas revisar? <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <select
                id="temaInteres"
                className="field-input field-select"
                value={fields.temaInteres}
                onChange={(e) => set("temaInteres", e.target.value)}
              >
                <option value="">Selecciona un tema...</option>
                <option value="saber_cuanto">Saber cuánto me tocaría de pensión</option>
                <option value="ley_73">Ley 73</option>
                <option value="ley_97">Ley 97</option>
                <option value="modalidad_40">Modalidad 40</option>
                <option value="modalidad_10">Modalidad 10</option>
                <option value="semanas_cotizadas">Semanas cotizadas</option>
                <option value="conservacion_derechos">Conservación de derechos</option>
                <option value="afore">AFORE</option>
                <option value="ya_pensionado">Ya estoy pensionado</option>
                <option value="pension_baja">Pensión baja</option>
                <option value="invalidez">Invalidez</option>
                <option value="viudez">Viudez</option>
                <option value="otro">Otro</option>
              </select>
              {errors.temaInteres && <p className="field-error" role="alert">{errors.temaInteres}</p>}
            </div>

            <div className={fg("objetivoPrincipal")}>
              <label className="field-label" htmlFor="objetivoPrincipal">
                ¿Cuál es tu objetivo principal? <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <select
                id="objetivoPrincipal"
                className="field-input field-select"
                value={fields.objetivoPrincipal}
                onChange={(e) => set("objetivoPrincipal", e.target.value)}
              >
                <option value="">Selecciona un objetivo...</option>
                <option value="Saber si ya me puedo pensionar">Saber si ya me puedo pensionar</option>
                <option value="Saber cuánto podría recibir">Saber cuánto podría recibir</option>
                <option value="Mejorar mi pensión">Mejorar mi pensión</option>
                <option value="Revisar una pensión baja">Revisar una pensión baja</option>
                <option value="Modalidad 40">Modalidad 40</option>
                <option value="Modalidad 10">Modalidad 10</option>
                <option value="No estoy seguro">No estoy seguro</option>
              </select>
              {errors.objetivoPrincipal && <p className="field-error" role="alert">{errors.objetivoPrincipal}</p>}
            </div>

            <fieldset className={`field-group fieldset-group${errors.tieneSemanasCotizadas ? " has-error" : ""}`}>
              <legend className="field-label">
                ¿Tienes reporte de semanas cotizadas? <span className="required-mark" aria-hidden="true">*</span>
              </legend>
              <div className="radio-row">
                {[{ v: "si", l: "Sí" }, { v: "no", l: "No" }, { v: "no_seguro", l: "No estoy seguro" }].map(({ v, l }) => (
                  <label key={v} className="radio-label">
                    <input
                      type="radio"
                      name="semanas"
                      value={v}
                      className="radio-input"
                      checked={fields.tieneSemanasCotizadas === v}
                      onChange={() => set("tieneSemanasCotizadas", v)}
                    />
                    <span className="radio-custom" aria-hidden="true" />
                    {l}
                  </label>
                ))}
              </div>
              {errors.tieneSemanasCotizadas && <p className="field-error" role="alert">{errors.tieneSemanasCotizadas}</p>}
            </fieldset>

            <div className={fg("fuente")}>
              <label className="field-label" htmlFor="fuente">
                ¿Cómo nos encontraste? <span className="required-mark" aria-hidden="true">*</span>
              </label>
              <select
                id="fuente"
                className="field-input field-select"
                value={fields.fuente}
                onChange={(e) => set("fuente", e.target.value)}
              >
                <option value="">Selecciona una opción...</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
                <option value="facebook">Facebook</option>
                <option value="google">Google</option>
                <option value="recomendacion">Recomendación de alguien</option>
              </select>
              {errors.fuente && <p className="field-error" role="alert">{errors.fuente}</p>}
            </div>

            <div className={`field-group${errors.consentimiento ? " has-error" : ""}`}>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  id="consentimiento"
                  className="checkbox-input"
                  checked={fields.consentimiento}
                  onChange={(e) => set("consentimiento", e.target.checked)}
                />
                <span className="checkbox-custom" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>
                  He leído y acepto el{" "}
                  <a
                    href="/aviso-de-privacidad"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="privacy-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    aviso de privacidad
                  </a>
                  . Mis datos serán utilizados únicamente para contactarme respecto a mi consulta de pensión.
                </span>
              </label>
              {errors.consentimiento && <p className="field-error" role="alert">{errors.consentimiento}</p>}
            </div>

            {globalError && (
              <div className="form-error-global" role="alert">
                {globalError}
              </div>
            )}

            <div className="step-nav">
              <button type="button" className="btn-prev-step" onClick={handleBack}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 5 5 12 12 19" />
                </svg>
                Atrás
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  <span className="btn-spinner" aria-label="Enviando..." />
                ) : (
                  <>
                    <span>Quiero que revisen mi caso</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </div>

            <p className="form-disclaimer">
              Este formulario no sustituye una consulta personalizada. La información enviada será revisada para identificar si existe alguna orientación que pueda ayudarte.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
