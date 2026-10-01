"use client";

import { useEffect, useState } from "react";
import { NuevoMovimiento } from "@/components/NuevoMovimiento";
import type { Categoria } from "@/lib/types";

/** Botón flotante "+" que abre el formulario en una hoja desde abajo. */
export function BotonNuevo({ categorias, hoy }: { categorias: Categoria[]; hoy: string }) {
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("keydown", cerrar);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", cerrar);
      document.body.style.overflow = "";
    };
  }, [abierto]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-label="Registrar movimiento"
        className="fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+4.75rem)] z-20 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-3xl font-light text-white shadow-lg shadow-black/25 transition active:scale-90 md:right-8 md:bottom-8 dark:text-black"
      >
        +
      </button>

      {abierto && (
        <div
          className="animate-aparece fixed inset-0 z-30 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setAbierto(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Nuevo movimiento"
            className="animate-sube w-full max-w-lg rounded-t-3xl bg-card p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line sm:hidden" />
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Nuevo movimiento</h2>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-muted"
              >
                ✕
              </button>
            </div>
            <NuevoMovimiento
              categorias={categorias}
              hoy={hoy}
              className="space-y-3"
              onOk={() => setAbierto(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
