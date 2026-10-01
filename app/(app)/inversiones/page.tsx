import { actualizarPrecio, borrarInversion, crearInversion, guardarConfig } from "@/app/(app)/actions";
import { ConfirmButton, Form, Submit } from "@/components/Form";
import { cargarPatrimonio } from "@/lib/data";
import { dinero, fecha, hoy, porcentaje } from "@/lib/format";
import { valorInversion } from "@/lib/types";

export default async function Inversiones() {
  const { inversiones, config } = await cargarPatrimonio();
  const trm = Number(config.trm);
  const filas = inversiones.map((i) => ({ ...i, ...valorInversion(i, trm) }));
  const valor = filas.reduce((s, f) => s + f.valor, 0);
  const costo = filas.reduce((s, f) => s + f.costo, 0);
  const ganancia = valor - costo;
  const rendimiento = costo > 0 ? (ganancia / costo) * 100 : 0;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="h1">Inversiones</h1>
        <p className="text-sm text-muted">Acciones en EE.UU. y Colombia, todo sumado en pesos.</p>
      </header>

      <section className="card">
        <p className="text-xs uppercase tracking-wide text-muted">Valor del portafolio</p>
        <p className="num text-3xl font-bold">{dinero(valor)}</p>
        <p className={`num text-sm ${ganancia >= 0 ? "text-good" : "text-bad"}`}>
          {ganancia >= 0 ? "+" : ""}
          {dinero(ganancia)} ({porcentaje(rendimiento)})
        </p>
        <Form action={guardarConfig} reset={false} className="mt-4 flex items-end gap-2 border-t border-line pt-3">
          <div className="flex-1">
            <label className="label">TRM (dólar hoy) · actualizada {fecha(config.trm_actualizada_at)}</label>
            <input name="trm" inputMode="decimal" defaultValue={String(config.trm)} className="input num" />
          </div>
          <Submit className="btn-ghost">Actualizar</Submit>
        </Form>
      </section>

      <details>
        <summary className="btn w-full cursor-pointer list-none">+ Nueva acción</summary>
        <Form action={crearInversion} className="card mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="label">Ticker</label>
            <input name="ticker" required placeholder="AAPL, ECOPETROL" className="input uppercase" />
          </div>
          <div>
            <label className="label">Mercado</label>
            <select name="mercado" className="input">
              <option value="EEUU">EE.UU. (USD)</option>
              <option value="COL">Colombia (COP)</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Nombre (opcional)</label>
            <input name="nombre" placeholder="Apple Inc." className="input" />
          </div>
          <div>
            <label className="label">Cantidad</label>
            <input name="cantidad" inputMode="decimal" required placeholder="10" className="input num" />
          </div>
          <div>
            <label className="label">Precio de compra (c/u)</label>
            <input name="precio_compra" inputMode="decimal" required placeholder="185.50" className="input num" />
          </div>
          <div>
            <label className="label">Fecha de compra</label>
            <input name="fecha_compra" type="date" defaultValue={hoy()} className="input" />
          </div>
          <div className="flex items-end">
            <Submit className="btn w-full">Guardar</Submit>
          </div>
        </Form>
      </details>

      {filas.length === 0 && (
        <p className="card text-center text-sm text-muted">Agrega tu primera acción.</p>
      )}

      <div className="space-y-3">
        {filas.map((f) => (
          <article key={f.id} className="card space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">
                  {f.ticker}{" "}
                  <span className="rounded-md bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted">
                    {f.mercado === "EEUU" ? "🇺🇸 USD" : "🇨🇴 COP"}
                  </span>
                </h2>
                <p className="text-xs text-muted">
                  {f.nombre ? `${f.nombre} · ` : ""}
                  {Number(f.cantidad)} × {dinero(f.precio_compra, f.moneda)}
                </p>
              </div>
              <div className="text-right">
                <p className="num font-bold">{dinero(f.valor)}</p>
                <p className={`num text-xs ${f.ganancia >= 0 ? "text-good" : "text-bad"}`}>
                  {f.ganancia >= 0 ? "+" : ""}
                  {dinero(f.ganancia)} ({porcentaje(f.rendimiento)})
                </p>
              </div>
            </div>
            <Form
              action={actualizarPrecio}
              reset={false}
              className="flex items-end gap-2 border-t border-line pt-3"
            >
              <input type="hidden" name="id" value={f.id} />
              <div className="flex-1">
                <label className="label">
                  Precio actual ({f.moneda})
                  {f.precio_actualizado_at ? ` · ${fecha(f.precio_actualizado_at)}` : ""}
                </label>
                <input
                  name="precio_actual"
                  inputMode="decimal"
                  defaultValue={String(f.precio_actual ?? f.precio_compra)}
                  className="input num"
                />
              </div>
              <Submit className="btn-ghost">Actualizar</Submit>
            </Form>
            <form action={borrarInversion} className="text-right">
              <input type="hidden" name="id" value={f.id} />
              <ConfirmButton mensaje={`¿Borrar ${f.ticker}?`}>Borrar</ConfirmButton>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
