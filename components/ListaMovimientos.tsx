import { borrarMovimiento } from "@/app/(app)/actions";
import { ConfirmButton } from "@/components/Form";
import { dinero, fecha } from "@/lib/format";
import { METODOS, type Movimiento } from "@/lib/types";

const etiquetaMetodo = Object.fromEntries(METODOS.map((m) => [m.valor, m.etiqueta]));

export function ListaMovimientos({
  movimientos,
  borrable = false,
}: {
  movimientos: Movimiento[];
  borrable?: boolean;
}) {
  if (movimientos.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">Sin movimientos todavía.</p>;
  }
  return (
    <ul className="divide-y divide-line">
      {movimientos.map((m) => (
        <li key={m.id} className="flex items-center gap-3 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background text-lg">
            {m.categorias?.icono ?? (m.tipo === "ingreso" ? "💰" : "📦")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {m.descripcion ?? m.comercio ?? m.categorias?.nombre ?? "Sin descripción"}
            </p>
            <p className="truncate text-xs text-muted">
              {fecha(m.fecha)} · {m.categorias?.nombre ?? "Sin categoría"} ·{" "}
              {etiquetaMetodo[m.metodo]}
              {m.tarjeta ? ` (${m.tarjeta})` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className={`num text-sm font-semibold ${m.tipo === "ingreso" ? "text-good" : ""}`}>
              {m.tipo === "ingreso" ? "+" : "−"}
              {dinero(m.monto)}
            </p>
            {borrable && (
              <form action={borrarMovimiento}>
                <input type="hidden" name="id" value={m.id} />
                <ConfirmButton mensaje="¿Borrar este movimiento?">Borrar</ConfirmButton>
              </form>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
