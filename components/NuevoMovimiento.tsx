"use client";

import { useState } from "react";
import { crearMovimiento } from "@/app/(app)/actions";
import { Form, Submit } from "@/components/Form";
import { METODOS, type Categoria } from "@/lib/types";

export function NuevoMovimiento({
  categorias,
  hoy,
  onOk,
  className = "card space-y-3",
}: {
  categorias: Categoria[];
  hoy: string;
  onOk?: () => void;
  className?: string;
}) {
  const [tipo, setTipo] = useState<"gasto" | "ingreso">("gasto");
  const opciones = categorias.filter((c) => c.tipo === tipo);

  return (
    <Form action={crearMovimiento} className={className} onOk={onOk}>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-background p-1">
        {(["gasto", "ingreso"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={`rounded-lg py-1.5 text-sm font-medium capitalize ${
              tipo === t ? "bg-card shadow-sm" : "text-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <input type="hidden" name="tipo" value={tipo} />

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="label" htmlFor="monto">Monto (COP)</label>
          <input
            id="monto"
            name="monto"
            inputMode="decimal"
            placeholder="45.000"
            required
            className="input num text-lg"
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="label" htmlFor="descripcion">Descripción</label>
          <input id="descripcion" name="descripcion" placeholder="Almuerzo, arriendo…" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="categoria_id">Categoría</label>
          <select id="categoria_id" name="categoria_id" className="input" key={tipo}>
            {opciones.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icono} {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="metodo">Método</label>
          <select id="metodo" name="metodo" className="input" defaultValue="efectivo">
            {METODOS.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.etiqueta}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="label" htmlFor="fecha">Fecha</label>
          <input id="fecha" name="fecha" type="date" defaultValue={hoy} className="input" />
        </div>
        <div className="col-span-2 flex items-end sm:col-span-1">
          <Submit className="btn w-full">Guardar {tipo}</Submit>
        </div>
      </div>
    </Form>
  );
}
