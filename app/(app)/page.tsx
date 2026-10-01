import Link from "next/link";
import { BotonNuevo } from "@/components/BotonNuevo";
import { GastoDiario } from "@/components/graficas/GastoDiario";
import { ListaMovimientos } from "@/components/ListaMovimientos";
import { cargarMes, cargarPatrimonio, gastosPorDia, resumir } from "@/lib/data";
import { diaBogota, diasEnMes, dinero, hoy, mesActual, mesCorto, moverMes, nombreMes } from "@/lib/format";
import { valorInversion } from "@/lib/types";

export default async function Inicio({ searchParams }: PageProps<"/">) {
  const { mes: mesParam } = await searchParams;
  const actual = mesActual();
  const mes =
    typeof mesParam === "string" && /^\d{4}-\d{2}$/.test(mesParam) && mesParam <= actual ? mesParam : actual;
  const esActual = mes === actual;
  const mesPrev = moverMes(mes, -1);
  const mesSig = moverMes(mes, 1);

  const [{ movimientos, categorias }, { movimientos: movsPrev }, { deudas, inversiones, config }] =
    await Promise.all([cargarMes(mes), cargarMes(mesPrev), cargarPatrimonio()]);

  const { ingresos, gastos, balance, porCategoria } = resumir(movimientos);

  // Patrimonio (no depende del mes)
  const trm = Number(config.trm);
  const totalInversiones = inversiones.reduce((s, i) => s + valorInversion(i, trm).valor, 0);
  const activas = deudas.filter((d) => d.activa);
  const totalDeudas = activas.reduce((s, d) => s + Math.max(0, Number(d.saldo)), 0);
  const disponible = Number(config.dinero_disponible);
  const patrimonio = disponible + totalInversiones - totalDeudas;

  // Ritmo del mes
  const dias = diasEnMes(mes);
  const diaHoy = diaBogota(new Date().toISOString());
  const hastaDia = esActual ? diaHoy : dias;
  const porDia = gastosPorDia(movimientos, dias);
  const diasConGasto = porDia.filter((v) => v > 0).length;
  const gastoPrev = gastosPorDia(movsPrev, diasEnMes(mesPrev))
    .slice(0, hastaDia)
    .reduce((a, b) => a + b, 0);
  const cambio = gastoPrev > 0 && gastos > 0 ? (gastos / gastoPrev - 1) * 100 : null;
  // Con menos de una semana la proyección engaña más de lo que ayuda.
  const proyeccion = esActual && hastaDia >= 7 ? (gastos / hastaDia) * dias : null;
  const usado = ingresos > 0 ? Math.min(100, (gastos / ingresos) * 100) : 0;

  const enQue = [...porCategoria]
    .map(([id, monto]) => {
      const c = categorias.find((c) => c.id === id);
      return { id, monto, nombre: c?.nombre ?? "Sin categoría", icono: c?.icono ?? "❔" };
    })
    .sort((a, b) => b.monto - a.monto);
  const mayor = enQue[0]?.monto ?? 1;
  const sinCategoria = movimientos.filter((m) => m.tipo === "gasto" && !m.categoria_id).length;

  const conPresupuesto = categorias
    .filter((c) => c.tipo === "gasto" && c.presupuesto_mensual)
    .map((c) => ({ ...c, gastado: porCategoria.get(c.id) ?? 0, tope: Number(c.presupuesto_mensual) }))
    .sort((a, b) => b.gastado / b.tope - a.gastado / a.tope);

  const proximosPagos = activas
    .filter((d) => d.dia_pago && Number(d.saldo) > 0)
    .map((d) => ({ ...d, faltan: (d.dia_pago! - diaHoy + 31) % 31 }))
    .sort((a, b) => a.faltan - b.faltan)
    .slice(0, 3);

  const flecha = "flex h-9 w-9 items-center justify-center rounded-full text-lg text-muted hover:bg-card";

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="h1 capitalize">{nombreMes(mes)}</h1>
        <div className="flex items-center gap-1">
          <Link href={`/?mes=${mesPrev}`} aria-label="Mes anterior" className={flecha}>
            ‹
          </Link>
          {esActual ? (
            <span className={`${flecha} opacity-30`} aria-hidden>
              ›
            </span>
          ) : (
            <Link href={mesSig === actual ? "/" : `/?mes=${mesSig}`} aria-label="Mes siguiente" className={flecha}>
              ›
            </Link>
          )}
        </div>
      </header>

      {/* Lo principal: cuánto gasté y cuánto me queda */}
      <section className="card p-5">
        <p className="text-sm text-muted">{esActual ? "Llevas gastado" : "Gastaste"}</p>
        <p className="num mt-0.5 text-4xl font-bold tracking-tight">{dinero(gastos)}</p>

        {ingresos > 0 ? (
          <>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-background">
              <div
                className={`h-full rounded-full ${balance < 0 ? "bg-bad" : usado > 80 ? "bg-warn" : "bg-accent"}`}
                style={{ width: `${Math.max(usado, gastos > 0 ? 2 : 0)}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between gap-2 text-sm">
              <span className="text-muted">
                de <span className="num text-foreground">{dinero(ingresos)}</span> que entraron
              </span>
              {balance >= 0 ? (
                <span className="text-muted">
                  quedan <span className="num font-semibold text-good">{dinero(balance)}</span>
                </span>
              ) : (
                <span className="font-medium text-bad">
                  te pasaste <span className="num">{dinero(-balance)}</span>
                </span>
              )}
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">Aún no registras ingresos este mes.</p>
        )}

        {(cambio !== null || proyeccion !== null) && (
          <div className="mt-4 space-y-1 border-t border-line pt-3 text-sm text-muted">
            {cambio !== null && (
              <p>
                <span className={cambio > 0 ? "text-bad" : "text-good"}>
                  {cambio > 0 ? "▲" : "▼"} <span className="num">{Math.abs(cambio).toFixed(0)}%</span>
                </span>{" "}
                {cambio > 0 ? "más" : "menos"} que {nombreMes(mesPrev).split(" ")[0]} a esta altura
              </p>
            )}
            {proyeccion !== null && (
              <p>
                A este ritmo cerrarás el mes en{" "}
                <span className="num font-medium text-foreground">{dinero(proyeccion)}</span>
              </p>
            )}
          </div>
        )}
      </section>

      {sinCategoria > 0 && (
        <Link
          href={`/movimientos?mes=${mes}&tipo=gasto&cat=sin`}
          className="flex items-center justify-between rounded-2xl border border-warn/30 bg-warn/10 px-4 py-3 text-sm"
        >
          <span>
            ❔ {sinCategoria} {sinCategoria === 1 ? "gasto sin categoría" : "gastos sin categoría"}
          </span>
          <span className="font-medium text-warn">Revisar →</span>
        </Link>
      )}

      {enQue.length > 0 && (
        <section className="card">
          <h2 className="mb-3 text-sm font-semibold">¿En qué se fue?</h2>
          <ul className="space-y-1">
            {enQue.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/movimientos?mes=${mes}&tipo=gasto&cat=${c.id}`}
                  className="-mx-2 block rounded-xl px-2 py-1.5 transition hover:bg-background active:bg-background"
                >
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">
                      {c.icono} {c.nombre}
                    </span>
                    <span className="shrink-0">
                      <span className="num font-semibold">{dinero(c.monto)}</span>{" "}
                      <span className="num text-xs text-muted">{((c.monto / gastos) * 100).toFixed(0)}%</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(c.monto / mayor) * 100}%` }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {diasConGasto >= 3 && <GastoDiario porDia={porDia} hastaDia={hastaDia} mesCorto={mesCorto(mes)} />}

      {conPresupuesto.length > 0 && (
        <section className="card">
          <h2 className="mb-3 text-sm font-semibold">Presupuestos</h2>
          <ul className="space-y-3">
            {conPresupuesto.map((c) => {
              const pct = (c.gastado / c.tope) * 100;
              const color = pct > 100 ? "bg-bad" : pct > 80 ? "bg-warn" : "bg-accent";
              return (
                <li key={c.id}>
                  <div className="mb-1.5 flex justify-between gap-2 text-sm">
                    <span className="truncate">
                      {c.icono} {c.nombre}
                    </span>
                    <span className={`shrink-0 text-xs ${pct > 100 ? "text-bad" : "text-muted"}`}>
                      {pct > 100 ? (
                        <>
                          te pasaste <span className="num font-semibold">{dinero(c.gastado - c.tope)}</span>
                        </>
                      ) : (
                        <>
                          quedan <span className="num font-semibold text-foreground">{dinero(c.tope - c.gastado)}</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-background">
                    <div
                      className={`h-full rounded-full ${color}`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {esActual && proximosPagos.length > 0 && (
        <section className="card">
          <h2 className="mb-2 text-sm font-semibold">Próximos pagos</h2>
          <ul className="divide-y divide-line">
            {proximosPagos.map((d) => (
              <li key={d.id}>
                <Link href="/deudas" className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{d.acreedor}</span>
                    <span className={`text-xs ${d.faltan <= 3 ? "font-medium text-bad" : "text-muted"}`}>
                      {d.faltan === 0 ? "Hoy" : d.faltan === 1 ? "Mañana" : `En ${d.faltan} días`} · día{" "}
                      {d.dia_pago}
                    </span>
                  </span>
                  <span className="num font-semibold">{d.cuota ? dinero(d.cuota) : "—"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Últimos movimientos</h2>
          <Link href={esActual ? "/movimientos" : `/movimientos?mes=${mes}`} className="text-sm text-accent">
            Ver todos
          </Link>
        </div>
        <ListaMovimientos movimientos={movimientos.slice(0, 5)} />
      </section>

      {/* Patrimonio: foto general, compacta */}
      <section className="card">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">Patrimonio neto</h2>
          <p className={`num text-lg font-bold ${patrimonio < 0 ? "text-bad" : ""}`}>{dinero(patrimonio)}</p>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Link href="/ajustes" className="rounded-full bg-background px-3 py-1.5">
            Disponible <span className="num font-semibold">{dinero(disponible)}</span>
          </Link>
          {totalInversiones > 0 && (
            <Link href="/inversiones" className="rounded-full bg-background px-3 py-1.5">
              Inversiones <span className="num font-semibold">{dinero(totalInversiones)}</span>
            </Link>
          )}
          {totalDeudas > 0 && (
            <Link href="/deudas" className="rounded-full bg-background px-3 py-1.5">
              Deudas <span className="num font-semibold text-bad">−{dinero(totalDeudas)}</span>
            </Link>
          )}
        </div>
      </section>

      <BotonNuevo categorias={categorias} hoy={hoy()} />
    </div>
  );
}
