import { borrarCategoria, guardarCategoria, guardarConfig } from "@/app/(app)/actions";
import { cerrarSesion } from "@/app/login/actions";
import { ConfirmButton, Form, Submit } from "@/components/Form";
import { TokenAtajos } from "@/components/TokenAtajos";
import { cargarMes, cargarPatrimonio } from "@/lib/data";
import { mesActual } from "@/lib/format";

export default async function Ajustes() {
  const [{ categorias }, { config }] = await Promise.all([cargarMes(mesActual()), cargarPatrimonio()]);
  const gastos = categorias.filter((c) => c.tipo === "gasto");
  const ingresos = categorias.filter((c) => c.tipo === "ingreso");
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/registrar_movimiento`;

  return (
    <div className="space-y-5">
      <h1 className="h1">Ajustes</h1>

      <section className="card space-y-2">
        <h2 className="h2">Dinero disponible</h2>
        <p className="text-sm text-muted">
          Lo que tienes hoy en cuentas y efectivo. Se suma al patrimonio neto. Actualízalo cuando quieras.
        </p>
        <Form action={guardarConfig} reset={false} className="flex gap-2">
          <input
            name="dinero_disponible"
            inputMode="decimal"
            defaultValue={String(config.dinero_disponible)}
            className="input num flex-1"
          />
          <Submit>Guardar</Submit>
        </Form>
      </section>

      <section className="card">
        <h2 className="h2">Presupuesto mensual por categoría</h2>
        <p className="mb-3 text-sm text-muted">Pon un tope y el inicio te avisa si te pasas. Vacío = sin tope.</p>
        <ul className="divide-y divide-line">
          {gastos.map((c) => (
            <li key={c.id} className="flex items-center gap-2 py-2">
              <span className="w-36 shrink-0 truncate text-sm">
                {c.icono} {c.nombre}
              </span>
              <Form action={guardarCategoria} reset={false} className="flex flex-1 gap-2">
                <input type="hidden" name="id" value={c.id} />
                <input
                  name="presupuesto_mensual"
                  inputMode="decimal"
                  placeholder="Sin tope"
                  defaultValue={c.presupuesto_mensual ? String(c.presupuesto_mensual) : ""}
                  className="input num py-1.5 text-sm"
                />
                <Submit className="btn-ghost py-1.5">✓</Submit>
              </Form>
              <form action={borrarCategoria}>
                <input type="hidden" name="id" value={c.id} />
                <ConfirmButton mensaje={`¿Borrar la categoría ${c.nombre}?`}>✕</ConfirmButton>
              </form>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          Ingresos: {ingresos.map((c) => `${c.icono ?? ""} ${c.nombre}`).join(" · ")}
        </p>
      </section>

      <section className="card">
        <h2 className="h2">Nueva categoría</h2>
        <Form action={guardarCategoria} className="grid grid-cols-[4rem_1fr] gap-2 sm:grid-cols-[4rem_1fr_8rem_auto]">
          <input name="icono" placeholder="🐶" maxLength={4} className="input text-center" />
          <input name="nombre" required placeholder="Mascotas" className="input" />
          <select name="tipo" className="input col-span-2 sm:col-span-1">
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
          </select>
          <Submit className="btn col-span-2 sm:col-span-1">Agregar</Submit>
        </Form>
      </section>

      <section className="card space-y-3">
        <h2 className="h2">Atajos del iPhone</h2>
        <p className="text-sm text-muted">
          El token le permite a tus atajos guardar gastos sin iniciar sesión. Trátalo como una contraseña.
        </p>
        <TokenAtajos />
        <div className="space-y-2 rounded-xl bg-background p-3 text-xs">
          <p className="font-semibold">Datos para el atajo (acción “Obtener contenido de URL”):</p>
          <p>
            <span className="text-muted">URL:</span> <code className="break-all">{url}</code>
          </p>
          <p>
            <span className="text-muted">Método:</span> POST · <span className="text-muted">Cuerpo:</span> JSON
          </p>
          <p>
            <span className="text-muted">Encabezado apikey:</span>{" "}
            <code className="break-all">{process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}</code>
          </p>
          <p className="text-muted">
            Campos JSON: p_token, p_monto, p_categoria, p_metodo (wallet / efectivo / transferencia / tarjeta),
            p_descripcion, p_comercio, p_tarjeta, p_tipo (gasto / ingreso)
          </p>
        </div>
      </section>

      <form action={cerrarSesion}>
        <button className="btn-ghost w-full">Cerrar sesión</button>
      </form>
    </div>
  );
}
