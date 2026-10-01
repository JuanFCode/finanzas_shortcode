import { createClient } from "@/lib/supabase/server";
import { diaBogota, rangoMes } from "@/lib/format";
import type { Categoria, Config, Deuda, Inversion, Movimiento } from "@/lib/types";

export async function cargarMes(mes: string) {
  const supabase = await createClient();
  const { inicio, fin } = rangoMes(mes);
  const [movs, cats] = await Promise.all([
    supabase
      .from("movimientos")
      .select("*, categorias(nombre, icono)")
      .gte("fecha", inicio)
      .lt("fecha", fin)
      .order("fecha", { ascending: false }),
    supabase.from("categorias").select("*").order("nombre"),
  ]);
  return {
    movimientos: (movs.data ?? []) as Movimiento[],
    categorias: (cats.data ?? []) as Categoria[],
  };
}

export async function cargarPatrimonio() {
  const supabase = await createClient();
  const [deudas, inversiones, config] = await Promise.all([
    supabase.from("deudas_saldo").select("*").order("fecha_inicio"),
    supabase.from("inversiones").select("*").order("ticker"),
    supabase.from("config").select("*").maybeSingle(),
  ]);
  return {
    deudas: (deudas.data ?? []) as Deuda[],
    inversiones: (inversiones.data ?? []) as Inversion[],
    config: (config.data ?? {
      trm: 4000,
      trm_actualizada_at: new Date().toISOString(),
      dinero_disponible: 0,
    }) as Config,
  };
}

/** Totales del mes por tipo y gasto por categoría. */
export function resumir(movimientos: Movimiento[]) {
  let ingresos = 0;
  let gastos = 0;
  const porCategoria = new Map<string, number>();
  for (const m of movimientos) {
    const monto = Number(m.monto);
    if (m.tipo === "ingreso") ingresos += monto;
    else {
      gastos += monto;
      const k = m.categoria_id ?? "sin";
      porCategoria.set(k, (porCategoria.get(k) ?? 0) + monto);
    }
  }
  return { ingresos, gastos, balance: ingresos - gastos, porCategoria };
}

/** Gasto total de cada día del mes (índice 0 = día 1). */
export function gastosPorDia(movimientos: Movimiento[], dias: number) {
  const porDia = Array<number>(dias).fill(0);
  for (const m of movimientos) {
    if (m.tipo !== "gasto") continue;
    const d = diaBogota(m.fecha);
    if (d >= 1 && d <= dias) porDia[d - 1] += Number(m.monto);
  }
  return porDia;
}
