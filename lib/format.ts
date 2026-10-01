export const TZ = "America/Bogota";

const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function dinero(n: number | null | undefined, moneda: "COP" | "USD" = "COP") {
  // es-CO pone un espacio entre "$" y el número: "$ 70.000" → "$70.000"
  return (moneda === "USD" ? usd : cop).format(Number(n ?? 0)).replace(/\$\s/, "$");
}

export function porcentaje(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export function fecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
  });
}

/** "2026-09" del mes actual en Bogotá. */
export function mesActual() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ }).slice(0, 7);
}

/** "2026-09-30" de hoy en Bogotá. */
export function hoy() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

/** Rango [inicio, fin) en ISO para un mes "YYYY-MM" en hora de Bogotá (UTC-5). */
export function rangoMes(mes: string) {
  const [y, m] = mes.split("-").map(Number);
  const inicio = new Date(Date.UTC(y, m - 1, 1, 5)).toISOString();
  const fin = new Date(Date.UTC(y, m, 1, 5)).toISOString();
  return { inicio, fin };
}

export function nombreMes(mes: string) {
  const [y, m] = mes.split("-").map(Number);
  const nombre = new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("es-CO", {
    month: "long",
    timeZone: "UTC",
  });
  return `${nombre} ${y}`;
}

export function moverMes(mes: string, delta: number) {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

/** Convierte "$45.000", "45.000,50", "12.99" en número (misma lógica que parse_monto en SQL). */
export function parseMonto(txt: FormDataEntryValue | null): number | null {
  let s = String(txt ?? "").replace(/[^0-9.,]/g, "");
  if (!s) return null;
  const dot = s.lastIndexOf(".");
  const comma = s.lastIndexOf(",");
  if (dot >= 0 && comma >= 0) {
    s = comma > dot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (comma >= 0) {
    s = s.length - comma - 1 === 3 ? s.replace(/,/g, "") : s.replace(",", ".");
  } else if (dot >= 0 && s.length - dot - 1 === 3) {
    s = s.replace(/\./g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const compactoFmt = new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 });

/** "$1,2 M", "$450 mil" — para ejes de gráficas. */
export function compacto(n: number) {
  return `$${compactoFmt.format(n)}`;
}

/** Días que tiene un mes "YYYY-MM". */
export function diasEnMes(mes: string) {
  const [y, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Día del mes (1–31) de una fecha ISO, en hora de Bogotá. */
export function diaBogota(iso: string) {
  return Number(new Date(iso).toLocaleDateString("en-US", { timeZone: TZ, day: "numeric" }));
}

/** "oct" para un mes "YYYY-MM". */
export function mesCorto(mes: string) {
  const [y, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 15))
    .toLocaleDateString("es-CO", { month: "short", timeZone: "UTC" })
    .replace(".", "");
}
