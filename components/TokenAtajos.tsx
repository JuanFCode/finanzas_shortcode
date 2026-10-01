"use client";

import { useState, useTransition } from "react";
import { generarToken } from "@/app/(app)/actions";

export function TokenAtajos() {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [pending, start] = useTransition();

  const generar = () => {
    if (
      !confirm(
        "Si ya tienes los atajos configurados, el token anterior deja de funcionar y tendrás que pegar el nuevo en cada atajo. ¿Generar uno nuevo?",
      )
    ) {
      return;
    }
    start(async () => {
      const r = await generarToken();
      setError(r.error ?? null);
      setToken(r.token ?? null);
      setCopiado(false);
    });
  };

  return (
    <div className="space-y-2">
      {token ? (
        <>
          <p className="text-sm text-bad">Cópialo ahora: por seguridad no se vuelve a mostrar.</p>
          <div className="flex gap-2">
            <code className="input num flex-1 truncate text-xs">{token}</code>
            <button
              type="button"
              className="btn"
              onClick={() => navigator.clipboard.writeText(token).then(() => setCopiado(true))}
            >
              {copiado ? "¡Copiado!" : "Copiar"}
            </button>
          </div>
        </>
      ) : (
        <>
          <button type="button" onClick={generar} disabled={pending} className="btn">
            {pending ? "Generando…" : "Generar token"}
          </button>
          <p className="text-xs text-muted">
            Si ya tenías uno, el anterior deja de funcionar y hay que pegar el nuevo en los atajos.
          </p>
        </>
      )}
      {error && <p className="text-sm text-bad">{error}</p>}
    </div>
  );
}
