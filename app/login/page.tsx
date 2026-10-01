"use client";

import { useActionState } from "react";
import { autenticar, type LoginState } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(autenticar, {});

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <h1 className="h1 mb-1">Finanzas</h1>
      <p className="mb-6 text-sm text-muted">Gastos, deudas e inversiones en un solo lugar.</p>
      <form action={action} className="card space-y-3">
        <div>
          <label className="label" htmlFor="email">Correo</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            className="input"
          />
        </div>
        {state.error && <p className="text-sm text-bad">{state.error}</p>}
        {state.mensaje && <p className="text-sm text-good">{state.mensaje}</p>}
        <div className="flex gap-2 pt-1">
          <button name="modo" value="entrar" disabled={pending} className="btn flex-1">
            Entrar
          </button>
          <button name="modo" value="registro" disabled={pending} className="btn-ghost">
            Crear cuenta
          </button>
        </div>
      </form>
    </main>
  );
}
