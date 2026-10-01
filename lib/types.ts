export type Categoria = {
  id: string;
  nombre: string;
  tipo: "gasto" | "ingreso";
  presupuesto_mensual: number | null;
  icono: string | null;
};

export type Movimiento = {
  id: string;
  fecha: string;
  tipo: "gasto" | "ingreso";
  monto: number;
  descripcion: string | null;
  comercio: string | null;
  metodo: "wallet" | "efectivo" | "transferencia" | "tarjeta" | "otro";
  tarjeta: string | null;
  categoria_id: string | null;
  deuda_id: string | null;
  categorias: Pick<Categoria, "nombre" | "icono"> | null;
};

export type Deuda = {
  id: string;
  acreedor: string;
  descripcion: string | null;
  monto_inicial: number;
  cuota: number | null;
  dia_pago: number | null;
  tasa_interes: number | null;
  fecha_inicio: string;
  activa: boolean;
  pagado: number;
  saldo: number;
};

export type Inversion = {
  id: string;
  ticker: string;
  nombre: string | null;
  mercado: "EEUU" | "COL";
  moneda: "USD" | "COP";
  cantidad: number;
  precio_compra: number;
  precio_actual: number | null;
  precio_actualizado_at: string | null;
  fecha_compra: string | null;
};

export type Config = {
  trm: number;
  trm_actualizada_at: string;
  dinero_disponible: number;
};

export const METODOS = [
  { valor: "efectivo", etiqueta: "Efectivo" },
  { valor: "transferencia", etiqueta: "Transferencia" },
  { valor: "tarjeta", etiqueta: "Tarjeta" },
  { valor: "wallet", etiqueta: "Wallet" },
  { valor: "otro", etiqueta: "Otro" },
] as const;

/** Valor en COP de una posición, usando precio actual (o de compra si no hay). */
export function valorInversion(i: Inversion, trm: number) {
  const fx = i.moneda === "USD" ? trm : 1;
  const precio = Number(i.precio_actual ?? i.precio_compra);
  const valor = Number(i.cantidad) * precio * fx;
  const costo = Number(i.cantidad) * Number(i.precio_compra) * fx;
  const rendimiento =
    Number(i.precio_compra) > 0 ? (precio / Number(i.precio_compra) - 1) * 100 : 0;
  return { valor, costo, ganancia: valor - costo, rendimiento };
}
