"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseMonto } from "@/lib/format";

export type Estado = { error?: string; ok?: boolean; token?: string };

function texto(form: FormData, campo: string) {
  const v = String(form.get(campo) ?? "").trim();
  return v === "" ? null : v;
}

/** Fecha "YYYY-MM-DD" del formulario → mediodía de Bogotá. */
function fechaForm(form: FormData) {
  const f = texto(form, "fecha");
  return f ? `${f}T12:00:00-05:00` : new Date().toISOString();
}

function listo(): Estado {
  revalidatePath("/", "layout");
  return { ok: true };
}

// ===== Movimientos =====

export async function crearMovimiento(_prev: Estado, form: FormData): Promise<Estado> {
  const monto = parseMonto(form.get("monto"));
  if (!monto || monto <= 0) return { error: "Monto inválido." };
  const supabase = await createClient();
  const { error } = await supabase.from("movimientos").insert({
    tipo: texto(form, "tipo") ?? "gasto",
    monto,
    fecha: fechaForm(form),
    descripcion: texto(form, "descripcion"),
    categoria_id: texto(form, "categoria_id"),
    metodo: texto(form, "metodo") ?? "efectivo",
  });
  if (error) return { error: error.message };
  return listo();
}

export async function borrarMovimiento(form: FormData) {
  const supabase = await createClient();
  await supabase.from("movimientos").delete().eq("id", String(form.get("id")));
  revalidatePath("/", "layout");
}

// ===== Deudas =====

export async function crearDeuda(_prev: Estado, form: FormData): Promise<Estado> {
  const monto = parseMonto(form.get("monto_inicial"));
  if (!monto || monto <= 0) return { error: "Monto inválido." };
  const acreedor = texto(form, "acreedor");
  if (!acreedor) return { error: "¿A quién le debes?" };
  const dia = Number(texto(form, "dia_pago"));
  const supabase = await createClient();
  const { error } = await supabase.from("deudas").insert({
    acreedor,
    descripcion: texto(form, "descripcion"),
    monto_inicial: monto,
    cuota: parseMonto(form.get("cuota")),
    dia_pago: dia >= 1 && dia <= 31 ? dia : null,
    tasa_interes: parseMonto(form.get("tasa_interes")),
  });
  if (error) return { error: error.message };
  return listo();
}

/** Registra un pago: crea un gasto ligado a la deuda (baja el saldo). */
export async function pagarDeuda(_prev: Estado, form: FormData): Promise<Estado> {
  const monto = parseMonto(form.get("monto"));
  if (!monto || monto <= 0) return { error: "Monto inválido." };
  const deudaId = String(form.get("deuda_id"));
  const supabase = await createClient();

  const [{ data: deuda }, { data: cat }] = await Promise.all([
    supabase.from("deudas").select("acreedor").eq("id", deudaId).single(),
    supabase.from("categorias").select("id").eq("nombre", "Pago de deuda").maybeSingle(),
  ]);
  if (!deuda) return { error: "Deuda no encontrada." };

  const { error } = await supabase.from("movimientos").insert({
    tipo: "gasto",
    monto,
    fecha: fechaForm(form),
    descripcion: `Pago deuda: ${deuda.acreedor}`,
    categoria_id: cat?.id ?? null,
    metodo: texto(form, "metodo") ?? "transferencia",
    deuda_id: deudaId,
  });
  if (error) return { error: error.message };
  return listo();
}

export async function cambiarEstadoDeuda(form: FormData) {
  const supabase = await createClient();
  await supabase
    .from("deudas")
    .update({ activa: form.get("activa") === "true" })
    .eq("id", String(form.get("id")));
  revalidatePath("/", "layout");
}

export async function borrarDeuda(form: FormData) {
  const supabase = await createClient();
  await supabase.from("deudas").delete().eq("id", String(form.get("id")));
  revalidatePath("/", "layout");
}

// ===== Inversiones =====

export async function crearInversion(_prev: Estado, form: FormData): Promise<Estado> {
  const ticker = texto(form, "ticker")?.toUpperCase();
  const cantidad = parseMonto(form.get("cantidad"));
  const precio = parseMonto(form.get("precio_compra"));
  if (!ticker) return { error: "Falta el ticker." };
  if (!cantidad || cantidad <= 0) return { error: "Cantidad inválida." };
  if (precio == null || precio < 0) return { error: "Precio inválido." };
  const mercado = texto(form, "mercado") === "COL" ? "COL" : "EEUU";
  const supabase = await createClient();
  const { error } = await supabase.from("inversiones").insert({
    ticker,
    nombre: texto(form, "nombre"),
    mercado,
    moneda: mercado === "COL" ? "COP" : "USD",
    cantidad,
    precio_compra: precio,
    precio_actual: precio,
    precio_actualizado_at: new Date().toISOString(),
    fecha_compra: texto(form, "fecha_compra"),
  });
  if (error) return { error: error.message };
  return listo();
}

export async function actualizarPrecio(_prev: Estado, form: FormData): Promise<Estado> {
  const precio = parseMonto(form.get("precio_actual"));
  if (precio == null || precio < 0) return { error: "Precio inválido." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("inversiones")
    .update({ precio_actual: precio, precio_actualizado_at: new Date().toISOString() })
    .eq("id", String(form.get("id")));
  if (error) return { error: error.message };
  return listo();
}

export async function borrarInversion(form: FormData) {
  const supabase = await createClient();
  await supabase.from("inversiones").delete().eq("id", String(form.get("id")));
  revalidatePath("/", "layout");
}

// ===== Configuración =====

export async function guardarConfig(_prev: Estado, form: FormData): Promise<Estado> {
  const cambios: Record<string, unknown> = {};
  if (form.has("trm")) {
    const trm = parseMonto(form.get("trm"));
    if (!trm || trm <= 0) return { error: "TRM inválida." };
    cambios.trm = trm;
    cambios.trm_actualizada_at = new Date().toISOString();
  }
  if (form.has("dinero_disponible")) {
    const d = parseMonto(form.get("dinero_disponible"));
    if (d == null) return { error: "Monto inválido." };
    cambios.dinero_disponible = d;
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada." };
  const { error } = await supabase.from("config").upsert({ user_id: user.id, ...cambios });
  if (error) return { error: error.message };
  return listo();
}

export async function guardarCategoria(_prev: Estado, form: FormData): Promise<Estado> {
  const id = texto(form, "id");
  const presupuesto = parseMonto(form.get("presupuesto_mensual"));
  const supabase = await createClient();
  if (id) {
    const { error } = await supabase
      .from("categorias")
      .update({ presupuesto_mensual: presupuesto && presupuesto > 0 ? presupuesto : null })
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const nombre = texto(form, "nombre");
    if (!nombre) return { error: "Falta el nombre." };
    const { error } = await supabase.from("categorias").insert({
      nombre,
      tipo: texto(form, "tipo") === "ingreso" ? "ingreso" : "gasto",
      icono: texto(form, "icono"),
      presupuesto_mensual: presupuesto && presupuesto > 0 ? presupuesto : null,
    });
    if (error) {
      return { error: error.code === "23505" ? "Ya existe esa categoría." : error.message };
    }
  }
  return listo();
}

export async function borrarCategoria(form: FormData) {
  const supabase = await createClient();
  await supabase.from("categorias").delete().eq("id", String(form.get("id")));
  revalidatePath("/", "layout");
}

export async function generarToken(): Promise<Estado> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("generar_token_atajos");
  if (error) return { error: error.message };
  return { ok: true, token: data as string };
}
