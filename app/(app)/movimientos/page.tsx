import Link from "next/link";
import { ListaMovimientos } from "@/components/ListaMovimientos";
import { BotonNuevo } from "@/components/BotonNuevo";
import { cargarMes, resumir } from "@/lib/data";
import { dinero, hoy, mesActual, moverMes, nombreMes } from "@/lib/format";

export default async function Movimientos({ searchParams }: PageProps<"/movimientos">) {
  const { mes: mesParam, tipo, cat: catParam } = await searchParams;
  const cat = typeof catParam === "string" ? catParam : undefined;
  const mes = typeof mesParam === "string" && /^\d{4}-\d{2}$/.test(mesParam) ? mesParam : mesActual();
  const { movimientos, categorias } = await cargarMes(mes);
  const { ingresos, gastos, balance } = resumir(movimientos);
  const filtrados = movimientos.filter(
    (m) =>
      (tipo !== "gasto" && tipo !== "ingreso" ? true : m.tipo === tipo) &&
      (!cat || (cat === "sin" ? !m.categoria_id : m.categoria_id === cat)),
  );
  const categoria = cat === "sin" ? { icono: "❔", nombre: "Sin categoría" } : categorias.find((c) => c.id === cat);
  const totalFiltro = filtrados.reduce((s, m) => s + Number(m.monto), 0);

  const url = (params: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const m = params.mes ?? mes;
    if (m !== mesActual()) q.set("mes", m);
    const t = "tipo" in params ? params.tipo : (tipo as string | undefined);
    if (t) q.set("tipo", t);
    const c = "cat" in params ? params.cat : cat;
    if (c) q.set("cat", c);
    const s = q.toString();
    return `/movimientos${s ? `?${s}` : ""}`;
  };

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <Link href={url({ mes: moverMes(mes, -1) })} className="btn-ghost" aria-label="Mes anterior">
          ←
        </Link>
        <h1 className="h1 capitalize">{nombreMes(mes)}</h1>
        <Link href={url({ mes: moverMes(mes, 1) })} className="btn-ghost" aria-label="Mes siguiente">
          →
        </Link>
      </header>

      <section className="grid grid-cols-3 gap-2 text-center">
        <div className="card p-3">
          <p className="text-xs text-muted">Ingresos</p>
          <p className="num text-sm font-semibold text-good">{dinero(ingresos)}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-muted">Gastos</p>
          <p className="num text-sm font-semibold">{dinero(gastos)}</p>
        </div>
        <div className="card p-3">
          <p className="text-xs text-muted">Balance</p>
          <p className={`num text-sm font-semibold ${balance < 0 ? "text-bad" : "text-good"}`}>
            {dinero(balance)}
          </p>
        </div>
      </section>


      <section className="card">
        <div className="mb-2 flex gap-2 text-sm">
          {[
            { t: undefined, l: "Todos" },
            { t: "gasto", l: "Gastos" },
            { t: "ingreso", l: "Ingresos" },
          ].map((f) => (
            <Link
              key={f.l}
              href={url({ tipo: f.t })}
              className={`rounded-full px-3 py-1 ${
                tipo === f.t || (!tipo && !f.t) ? "bg-accent text-white dark:text-black" : "bg-background text-muted"
              }`}
            >
              {f.l}
            </Link>
          ))}
        </div>
        {categoria && (
          <div className="mb-2 flex items-center justify-between rounded-xl bg-background px-3 py-2 text-sm">
            <span>
              {categoria.icono} {categoria.nombre} ·{" "}
              <span className="num font-semibold">{dinero(totalFiltro)}</span>
            </span>
            <Link href={url({ cat: undefined })} className="text-muted" aria-label="Quitar filtro">
              ✕
            </Link>
          </div>
        )}
        <ListaMovimientos movimientos={filtrados} borrable />
      </section>

      <BotonNuevo categorias={categorias} hoy={hoy()} />
    </div>
  );
}
