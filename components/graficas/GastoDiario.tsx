"use client";

import { useState, type KeyboardEvent, type PointerEvent } from "react";
import { dinero } from "@/lib/format";
import { useAncho } from "./useAncho";

const ALTO = 110;
const ABAJO = 18;

/** Barra con esquinas superiores redondeadas, apoyada en la base. */
function barra(x: number, y: number, w: number, h: number, r = 4) {
  r = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/** Barras de gasto por día. Tocar una barra muestra el valor de ese día. */
export function GastoDiario({
  porDia,
  hastaDia,
  mesCorto,
}: {
  porDia: number[];
  /** Último día con datos (hoy si es el mes en curso). */
  hastaDia: number;
  mesCorto: string;
}) {
  const [sel, setSel] = useState<number | null>(null);
  const [ref, ancho] = useAncho<HTMLDivElement>();

  const n = porDia.length;
  const max = Math.max(...porDia.slice(0, hastaDia), 1);
  const banda = ancho / n;
  const altoPlot = ALTO - ABAJO - 2;
  const y = (v: number) => 2 + altoPlot * (1 - v / max);

  const diaEn = (px: number) => Math.max(1, Math.min(hastaDia, Math.floor(px / banda) + 1));
  const mover = (e: PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setSel(diaEn(e.clientX - r.left));
  };
  const teclado = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    setSel((s) => Math.max(1, Math.min(hastaDia, (s ?? hastaDia) + (e.key === "ArrowRight" ? 1 : -1))));
  };

  return (
    <section className="card">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">Gasto por día</h2>
        <p className="text-sm text-muted" aria-live="polite">
          {sel !== null ? (
            <>
              {sel} {mesCorto} · <span className="num font-semibold text-foreground">{dinero(porDia[sel - 1])}</span>
            </>
          ) : (
            "Toca una barra"
          )}
        </p>
      </div>

      <div ref={ref} className="w-full">
        {ancho > 0 ? (
          <svg
            width={ancho}
            height={ALTO}
            className="block touch-pan-y select-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            tabIndex={0}
            role="img"
            aria-label="Gasto por día. Usa las flechas para recorrer los días."
            onPointerMove={mover}
            onPointerDown={mover}
            onPointerLeave={(e) => e.pointerType === "mouse" && setSel(null)}
            onKeyDown={teclado}
            onBlur={() => setSel(null)}
          >
            {/* Días futuros en gris tenue para que se vea cuánto mes falta */}
            {porDia.map((v, i) => {
              const w = Math.max(2, banda - 3);
              const x = banda * i + (banda - w) / 2;
              if (i >= hastaDia || v <= 0) {
                return <rect key={i} x={x} y={y(0) - 2} width={w} height={2} rx={1} fill="var(--line)" />;
              }
              return (
                <path
                  key={i}
                  d={barra(x, y(v), w, y(0) - y(v), Math.min(4, w / 2))}
                  fill="var(--accent)"
                  opacity={sel === null || sel === i + 1 ? 1 : 0.3}
                  className="transition-opacity"
                />
              );
            })}
            {[1, 15, n].map((d) => (
              <text
                key={d}
                x={Math.max(6, Math.min(ancho - 6, banda * (d - 0.5)))}
                y={ALTO - 3}
                textAnchor="middle"
                fontSize={10}
                fill="var(--muted)"
              >
                {d}
              </text>
            ))}
          </svg>
        ) : (
          <div style={{ height: ALTO }} />
        )}
      </div>

      <table className="sr-only">
        <caption>Gasto por día</caption>
        <tbody>
          {porDia.slice(0, hastaDia).map((v, i) =>
            v > 0 ? (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{dinero(v)}</td>
              </tr>
            ) : null,
          )}
        </tbody>
      </table>
    </section>
  );
}
