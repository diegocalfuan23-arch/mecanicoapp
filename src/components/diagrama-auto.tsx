"use client";

import { useState } from "react";
import {
  ZONAS_SUPERIOR,
  ZONAS_LATERAL,
  TIPOS_DANO,
  marcasDesdeDanos,
  danosDesdeMarcas,
} from "@/lib/zonas-auto";

const TIPOS = TIPOS_DANO;
const aMarcas = marcasDesdeDanos;
const aDanos = danosDesdeMarcas;

/**
 * Diagrama del auto para marcar el estado al recibirlo — Plan
 * Serviteca. Dos vistas, como el papel de recepción de vehículos:
 * superior (planta) y lateral (perfil), cada una con su propia
 * silueta real de carrocería en vez de rectángulos sueltos. Toca una
 * zona para elegir el tipo de daño, igual que a mano en papel.
 */
export function DiagramaAuto({
  value,
  onChange,
}: {
  value: string[];
  onChange: (danos: string[]) => void;
}) {
  const marcas = aMarcas(value);
  const [vista, setVista] = useState<"superior" | "lateral">("superior");
  const [zonaAbierta, setZonaAbierta] = useState<string | null>(null);

  const zonas = vista === "superior" ? ZONAS_SUPERIOR : ZONAS_LATERAL;

  function marcar(zona: string, tipo: string | null) {
    const sinZona = marcas.filter((m) => m.zona !== zona);
    const nuevas = tipo ? [...sinZona, { zona, tipo }] : sinZona;
    onChange(aDanos(nuevas));
    setZonaAbierta(null);
  }

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
      <div className="shrink-0">
        <div className="mb-3 inline-flex rounded-lg border border-border p-1">
          {(["superior", "lateral"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => {
                setVista(v);
                setZonaAbierta(null);
              }}
              className={`rounded-md px-3 py-1 text-[13px] font-medium transition-colors ${
                vista === v
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "superior" ? "Desde arriba" : "De lado"}
            </button>
          ))}
        </div>

        {vista === "superior" ? (
          <SiluetaSuperior
            marcas={marcas}
            zonaAbierta={zonaAbierta}
            onZona={setZonaAbierta}
          />
        ) : (
          <SiluetaLateral
            marcas={marcas}
            zonaAbierta={zonaAbierta}
            onZona={setZonaAbierta}
          />
        )}
      </div>

      <div className="flex-1">
        <p className="mb-2 text-[13px] font-medium">
          Toca una zona para marcar el daño
        </p>

        {zonaAbierta && (
          <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background p-3">
            <span className="text-[13px] text-muted-foreground">
              {zonas.find((z) => z.id === zonaAbierta)?.etiqueta}:
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
            {marcas.map((m) => {
              const zona =
                ZONAS_SUPERIOR.find((z) => z.id === m.zona) ??
                ZONAS_LATERAL.find((z) => z.id === m.zona);
              return (
                <li key={m.zona}>
                  {zona?.etiqueta}:{" "}
                  {TIPOS.find((t) => t.id === m.tipo)?.etiqueta}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

type Marca = { zona: string; tipo: string };
type ZonaClickable = {
  id: string;
  etiqueta: string;
  etiquetaCorta: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

function Zona({
  z,
  marca,
  activa,
  onClick,
}: {
  z: ZonaClickable;
  marca?: Marca;
  activa: boolean;
  onClick: () => void;
}) {
  const tipo = TIPOS.find((t) => t.id === marca?.tipo);
  return (
    <g>
      <rect
        x={z.x}
        y={z.y}
        width={z.w}
        height={z.h}
        rx="4"
        onClick={onClick}
        className={`cursor-pointer stroke-border transition-colors ${
          marca
            ? "fill-acento/20"
            : activa
              ? "fill-foreground/10"
              : "fill-transparent hover:fill-foreground/5"
        }`}
        strokeWidth="1"
      />
      {tipo ? (
        <text
          x={z.x + z.w / 2}
          y={z.y + z.h / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="pointer-events-none fill-acento text-[16px] font-bold"
        >
          {tipo.letra}
        </text>
      ) : (
        <text
          x={z.x + z.w / 2}
          y={z.y + z.h / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="pointer-events-none fill-muted-foreground text-[7px]"
        >
          {z.etiquetaCorta}
        </text>
      )}
    </g>
  );
}

/** Silueta real del auto visto desde arriba: capó y maletero curvos, no un rectángulo. */
function SiluetaSuperior({
  marcas,
  zonaAbierta,
  onZona,
}: {
  marcas: Marca[];
  zonaAbierta: string | null;
  onZona: (id: string | null) => void;
}) {
  return (
    <svg viewBox="0 0 120 200" className="h-72 w-auto text-border">
      {/* Carrocería: capó y cola redondeados, cintura marcada a la altura
          de las puertas — se lee como un auto, no como una caja. */}
      <path
        d="M 60 2
           C 82 2 96 10 100 30
           L 100 66
           C 108 68 112 74 112 84
           L 112 118
           C 112 128 108 134 100 136
           L 100 170
           C 96 190 82 198 60 198
           C 38 198 24 190 20 170
           L 20 136
           C 12 134 8 128 8 118
           L 8 84
           C 8 74 12 68 20 66
           L 20 30
           C 24 10 38 2 60 2 Z"
        fill="currentColor"
        className="text-card"
        stroke="currentColor"
        strokeWidth="2"
        style={{ color: "var(--color-border)" }}
      />
      {/* Parabrisas delantero y trasero */}
      <path
        d="M 34 60 Q 60 52 86 60 L 84 68 Q 60 62 36 68 Z"
        fill="currentColor"
        className="text-background"
      />
      <path
        d="M 34 148 Q 60 156 86 148 L 84 140 Q 60 146 36 140 Z"
        fill="currentColor"
        className="text-background"
      />
      {/* Espejos */}
      <rect x="4" y="72" width="6" height="10" rx="2" className="fill-border" />
      <rect x="110" y="72" width="6" height="10" rx="2" className="fill-border" />

      {ZONAS_SUPERIOR.map((z) => (
        <Zona
          key={z.id}
          z={z}
          marca={marcas.find((m) => m.zona === z.id)}
          activa={zonaAbierta === z.id}
          onClick={() => onZona(zonaAbierta === z.id ? null : z.id)}
        />
      ))}
    </svg>
  );
}

/** Silueta lateral: techo curvo, capó y maletero en pendiente, ruedas. */
function SiluetaLateral({
  marcas,
  zonaAbierta,
  onZona,
}: {
  marcas: Marca[];
  zonaAbierta: string | null;
  onZona: (id: string | null) => void;
}) {
  return (
    <svg viewBox="0 0 192 90" className="h-40 w-auto text-border">
      {/* Carrocería de perfil: capó bajo adelante, techo arqueado, cola
          atrás — silueta reconocible de auto visto de lado. */}
      <path
        d="M 4 62
           C 4 46 10 32 26 30
           L 34 30
           C 40 12 56 4 78 4
           L 118 4
           C 136 4 148 14 154 30
           L 166 30
           C 180 30 188 42 188 56
           L 188 62
           C 188 68 184 70 178 70
           L 172 70
           C 172 62 166 56 158 56
           C 150 56 144 62 144 70
           L 52 70
           C 52 62 46 56 38 56
           C 30 56 24 62 24 70
           L 14 70
           C 8 70 4 68 4 62 Z"
        fill="currentColor"
        className="text-card"
        stroke="currentColor"
        strokeWidth="2"
        style={{ color: "var(--color-border)" }}
      />
      {/* Ventanas */}
      <path
        d="M 62 30 L 68 14 L 108 14 L 116 30 Z"
        fill="currentColor"
        className="text-background"
      />
      <path
        d="M 120 30 L 114 16 L 148 26 L 154 30 Z"
        fill="currentColor"
        className="text-background"
      />
      {/* Ruedas */}
      <circle cx="38" cy="70" r="12" className="fill-background" stroke="currentColor" strokeWidth="2" />
      <circle cx="158" cy="70" r="12" className="fill-background" stroke="currentColor" strokeWidth="2" />

      {ZONAS_LATERAL.map((z) => (
        <Zona
          key={z.id}
          z={z}
          marca={marcas.find((m) => m.zona === z.id)}
          activa={zonaAbierta === z.id}
          onClick={() => onZona(zonaAbierta === z.id ? null : z.id)}
        />
      ))}
    </svg>
  );
}
