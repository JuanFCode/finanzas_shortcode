"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { Estado } from "@/app/(app)/actions";

type Accion = (prev: Estado, form: FormData) => Promise<Estado>;

/** Formulario con estado: muestra error y se limpia al guardar bien. */
export function Form({
  action,
  children,
  className,
  reset = true,
  onOk,
}: {
  action: Accion;
  children: ReactNode;
  className?: string;
  reset?: boolean;
  onOk?: () => void;
}) {
  const [state, formAction] = useActionState<Estado, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      if (reset) ref.current?.reset();
      onOk?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      {state.error && <p className="mt-2 text-sm text-bad">{state.error}</p>}
    </form>
  );
}

export function Submit({ children, className = "btn" }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? "Guardando…" : children}
    </button>
  );
}

/** Botón que pide confirmación antes de enviar (para borrar). */
export function ConfirmButton({
  children,
  mensaje = "¿Seguro?",
  className = "text-xs text-muted hover:text-bad",
}: {
  children: ReactNode;
  mensaje?: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(mensaje)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
