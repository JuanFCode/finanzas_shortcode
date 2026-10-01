import { borrarDeuda, cambiarEstadoDeuda, crearDeuda, pagarDeuda } from "@/app/(app)/actions";
import { ConfirmButton, Form, Submit } from "@/components/Form";
import { cargarPatrimonio } from "@/lib/data";
import { dinero, hoy } from "@/lib/format";
import { METODOS } from "@/lib/types";

export default async function Deudas() {
  const { deudas } = await cargarPatrimonio();
  const activas = deudas.filter((d) => d.activa);
  const saldadas = deudas.filter((d) => !d.activa);
  const total = activas.reduce((s, d) => s + Math.max(0, Number(d.saldo)), 0);
  const cuotas = activas.reduce((s, d) => s + Number(d.cuota ?? 0), 0);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="h1">Deudas</h1>
        <p className="text-sm text-muted">Lo que debes y cuánto te falta.</p>
      </header>

      <section className="grid grid-cols-2 gap-2">
        <div className="card">
          <p className="text-xs text-muted">Total que debes</p>
          <p className="num text-xl font-bold text-bad">{dinero(total)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-muted">Cuotas al mes</p>
          <p className="num text-xl font-bold">{dinero(cuotas)}</p>
        </div>
      </section>

      <details>
        <summary className="btn w-full cursor-pointer list-none">+ Nueva deuda</summary>
        <Form action={crearDeuda} className="card mt-3 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">¿A quién le debes?</label>
            <input name="acreedor" required placeholder="Banco, tarjeta, persona…" className="input" />
          </div>
          <div className="col-span-2">
            <label className="label">Descripción (opcional)</label>
            <input name="descripcion" placeholder="Crédito carro, préstamo…" className="input" />
          </div>
          <div>
            <label className="label">Monto total</label>
            <input name="monto_inicial" inputMode="decimal" required placeholder="5.000.000" className="input num" />
          </div>
          <div>
            <label className="label">Cuota mensual</label>
            <input name="cuota" inputMode="decimal" placeholder="350.000" className="input num" />
          </div>
          <div>
            <label className="label">Día de pago</label>
            <input name="dia_pago" type="number" min={1} max={31} placeholder="15" className="input num" />
          </div>
          <div>
            <label className="label">Interés % (opcional)</label>
            <input name="tasa_interes" inputMode="decimal" placeholder="1,8" className="input num" />
          </div>
          <div className="col-span-2">
            <Submit className="btn w-full">Guardar deuda</Submit>
          </div>
        </Form>
      </details>

      {activas.length === 0 && (
        <p className="card text-center text-sm text-muted">No tienes deudas activas. 🎉</p>
      )}

      {activas.map((d) => {
        const pct = Math.min(100, (Number(d.pagado) / Number(d.monto_inicial)) * 100);
        const saldo = Math.max(0, Number(d.saldo));
        const mesesRestantes = d.cuota ? Math.ceil(saldo / Number(d.cuota)) : null;
        return (
          <article key={d.id} className="card space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{d.acreedor}</h2>
                <p className="text-xs text-muted">
                  {[
                    d.descripcion,
                    d.dia_pago && `paga el día ${d.dia_pago}`,
                    d.tasa_interes && `${d.tasa_interes}% interés`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="text-right">
                <p className="num font-bold text-bad">{dinero(saldo)}</p>
                <p className="text-xs text-muted">de {dinero(d.monto_inicial)}</p>
              </div>
            </div>

            <div>
              <div className="h-2 overflow-hidden rounded-full bg-background">
                <div className="h-full rounded-full bg-good" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted">
                Pagado {dinero(d.pagado)} ({pct.toFixed(0)}%)
                {mesesRestantes ? ` · ~${mesesRestantes} cuotas restantes` : ""}
              </p>
            </div>

            <Form action={pagarDeuda} className="grid grid-cols-2 gap-2 border-t border-line pt-3 sm:grid-cols-4">
              <input type="hidden" name="deuda_id" value={d.id} />
              <input
                name="monto"
                inputMode="decimal"
                required
                defaultValue={d.cuota ? String(d.cuota) : ""}
                placeholder="Monto"
                className="input num"
              />
              <input name="fecha" type="date" defaultValue={hoy()} className="input" />
              <select name="metodo" defaultValue="transferencia" className="input">
                {METODOS.map((m) => (
                  <option key={m.valor} value={m.valor}>
                    {m.etiqueta}
                  </option>
                ))}
              </select>
              <Submit className="btn">Registrar pago</Submit>
            </Form>

            <div className="flex justify-end gap-4">
              <form action={cambiarEstadoDeuda}>
                <input type="hidden" name="id" value={d.id} />
                <input type="hidden" name="activa" value="false" />
                <button className="text-xs text-muted hover:text-good">Marcar como saldada</button>
              </form>
              <form action={borrarDeuda}>
                <input type="hidden" name="id" value={d.id} />
                <ConfirmButton mensaje="¿Borrar esta deuda? Los pagos quedan como gastos.">Borrar</ConfirmButton>
              </form>
            </div>
          </article>
        );
      })}

      {saldadas.length > 0 && (
        <section className="card">
          <h2 className="h2">Saldadas</h2>
          <ul className="divide-y divide-line text-sm">
            {saldadas.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-2">
                <span className="text-muted line-through">{d.acreedor}</span>
                <form action={cambiarEstadoDeuda}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="activa" value="true" />
                  <button className="text-xs text-accent">Reactivar</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
