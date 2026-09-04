"use client";

import { useState } from "react";
import type { PasoCotizado } from "./acciones";

/** Checklist libre: pasos agregados a mano, sin plantillas por ahora
 * — mismo alcance que se decidió para esta primera versión. */
export function Checklist({
  pasos,
  onCambio,
}: {
  pasos: PasoCotizado[];
  onCambio: (pasos: PasoCotizado[]) => void;
}) {
  const [texto, setTexto] = useState("");

  function agregar() {
    if (!texto.trim()) return;
    onCambio([...pasos, { texto: texto.trim(), hecho: false }]);
    setTexto("");
  }

  function alternar(i: number) {
    onCambio(pasos.map((p, j) => (i === j ? { ...p, hecho: !p.hecho } : p)));
  }

  function quitar(i: number) {
    onCambio(pasos.filter((_, j) => j !== i));
  }

  return (
    <div>
      <span className="mb-2 block text-[13px] font-medium">Checklist</span>

      <div className="flex gap-2">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregar();
            }
          }}
          placeholder="Ej. medir voltaje de batería"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={agregar}
          disabled={!texto.trim()}
          className="shrink-0 rounded-lg bg-primary px-3 py-2 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Agregar
        </button>
      </div>

      {pasos.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {pasos.map((p, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
            >
              <input
                type="checkbox"
                checked={p.hecho}
                onChange={() => alternar(i)}
                className="size-4 shrink-0"
              />
              <span
                className={`flex-1 text-[14px] ${p.hecho ? "text-muted-foreground line-through" : ""}`}
              >
                {p.texto}
              </span>
              <button
                type="button"
                onClick={() => quitar(i)}
                aria-label="Quitar este paso"
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
                  <path
                    d="M6 6l8 8M14 6l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
