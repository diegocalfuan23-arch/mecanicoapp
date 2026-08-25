"use client";

import { useState } from "react";
import {
  ZONAS_AUTO,
  TIPOS_DANO,
  marcasDesdeDanos,
  danosDesdeMarcas,
} from "@/lib/zonas-auto";

const ZONAS = ZONAS_AUTO;
const TIPOS = TIPOS_DANO;
const aMarcas = marcasDesdeDanos;
const aDanos = danosDesdeMarcas;

/**
 * Diagrama del auto (vista superior) para marcar el estado al recibirlo
 * — Plan Serviteca. Toca una zona para elegir el tipo de daño, igual que
 * se marcaría a mano en el papel de recepción de vehículos.
 */
export function DiagramaAuto({
  value,
  onChange,
}: {
  value: string[];
  onChange: (danos: string[]) => void;
}) {
  const marcas = aMarcas(value);
  const [zonaAbierta, setZonaAbierta] = useState<string | null>(null);

  function marcar(zona: string, tipo: string | null) {
    const sinZona = marcas.filter((m) => m.zona !== zona);
    const nuevas = tipo ? [...sinZona, { zona, tipo }] : sinZona;
    onChange(aDanos(nuevas));
    setZonaAbierta(null);
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <svg viewBox="0 0 120 200" className="h-56 w-auto shrink-0">
        <rect
          x="20"
          y="4"
          width="80"
          height="192"
          rx="26"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-border"
        />
        {ZONAS.map((z) => {
          const marca = marcas.find((m) => m.zona === z.id);
          const tipo = TIPOS.find((t) => t.id === marca?.tipo);
          return (
            <g key={z.id}>
              <rect
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                rx="4"
                onClick={() =>
                  setZonaAbierta(zonaAbierta === z.id ? null : z.id)
                }
                className={`cursor-pointer stroke-border transition-colors ${
                  marca ? "fill-acento/15" : "fill-transparent hover:fill-foreground/5"
                }`}
                strokeWidth="1"
              />
              {tipo && (
                <text
                  x={z.x + z.w / 2}
                  y={z.y + z.h / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none fill-acento text-[14px] font-bold"
                >
                  {tipo.letra}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="flex-1">
        <p className="mb-2 text-[13px] font-medium">
          Toca una zona para marcar el daño
        </p>

        {zonaAbierta && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background p-3">
            <span className="text-[13px] text-muted-foreground">
              {ZONAS.find((z) => z.id === zonaAbierta)?.etiqueta}:
            </span>
            {TIPOS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => marcar(zonaAbierta, t.id)}
                className="rounded-lg border border-border px-3 py-1 text-[13px] transition-colors hover:bg-card"
              >
                {t.letra} — {t.etiqueta}
              </button>
            ))}
            <button
              type="button"
              onClick={() => marcar(zonaAbierta, null)}
              className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Sin daño
            </button>
          </div>
        )}

        <ul className="flex flex-col gap-1 text-[12px] text-muted-foreground">
          {TIPOS.map((t) => (
            <li key={t.id}>
              {t.letra} — {t.etiqueta}
            </li>
          ))}
        </ul>

        {marcas.length > 0 && (
          <ul className="mt-3 flex flex-col gap-1 text-[13px]">
            {marcas.map((m) => (
              <li key={m.zona}>
                {ZONAS.find((z) => z.id === m.zona)?.etiqueta}:{" "}
                {TIPOS.find((t) => t.id === m.tipo)?.etiqueta}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
