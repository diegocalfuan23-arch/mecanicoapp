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
  const [detalleEditando, setDetalleEditando] = useState("");

  const zonas = vista === "superior" ? ZONAS_SUPERIOR : ZONAS_LATERAL;
  const marcaAbierta = marcas.find((m) => m.zona === zonaAbierta);

  function abrirZona(zona: string | null) {
    setZonaAbierta(zona);
    setDetalleEditando(
      zona ? (marcas.find((m) => m.zona === zona)?.detalle ?? "") : ""
    );
  }

  /**
   * Guarda la marca sin cerrar el panel — elegir el tipo (X/O/D) dejaba
   * el panel abierto un instante y se cerraba enseguida, así que el
   * input de detalle (que depende de que zonaAbierta siga activo)
   * nunca llegaba a mostrarse. Ahora solo "Sin daño" o confirmar el
   * detalle cierran el panel — ver cerrarZona más abajo.
   *
   * Recibe el detalle como parámetro (no lee el estado) porque, al
   * escribir, setDetalleEditando y esta llamada ocurren en el mismo
   * evento síncrono — el estado todavía no se actualizó cuando se
   * necesita acá, y el detalle guardado quedaría un carácter atrasado.
   */
  function marcar(zona: string, tipo: string | null, detalleTexto = detalleEditando) {
    const sinZona = marcas.filter((m) => m.zona !== zona);
    const detalle = detalleTexto.trim() || undefined;
    const nuevas = tipo ? [...sinZona, { zona, tipo, detalle }] : sinZona;
    onChange(aDanos(nuevas));
  }

  function cerrarZona() {
    setZonaAbierta(null);
    setDetalleEditando("");
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
            onZona={abrirZona}
          />
        ) : (
          <SiluetaLateral
            marcas={marcas}
            zonaAbierta={zonaAbierta}
            onZona={abrirZona}
          />
        )}
      </div>

      <div className="flex-1">
        <p className="mb-2 text-[13px] font-medium">
          Toca una zona para marcar el daño
        </p>

        {zonaAbierta && (
          <div className="mb-3 rounded-lg border border-border bg-background p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[13px] text-muted-foreground">
                {zonas.find((z) => z.id === zonaAbierta)?.etiqueta}:
              </span>
              {TIPOS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => marcar(zonaAbierta, t.id)}
                  className={`rounded-lg border px-3 py-1 text-[13px] transition-colors ${
                    marcaAbierta?.tipo === t.id
                      ? "border-foreground bg-foreground/10"
                      : "border-border hover:bg-card"
                  }`}
                >
                  {t.letra} — {t.etiqueta}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  marcar(zonaAbierta, null);
                  cerrarZona();
                }}
                className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Sin daño
              </button>
            </div>

            {marcaAbierta && (
              <>
                <input
                  value={detalleEditando}
                  onChange={(e) => {
                    setDetalleEditando(e.target.value);
                    marcar(zonaAbierta, marcaAbierta.tipo, e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      cerrarZona();
                    }
                  }}
                  placeholder="Detalle de este daño (opcional): golpe de 10cm cerca del logo"
                  className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={cerrarZona}
                  className="mt-2 text-[13px] font-medium text-foreground underline underline-offset-4"
                >
                  Listo
                </button>
              </>
            )}
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
                  {m.detalle && (
                    <span className="text-foreground"> — {m.detalle}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

type Marca = { zona: string; tipo: string; detalle?: string };
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
      {/* Carrocería de perfil, proporción de sedán: capó bajo adelante,
          parabrisas inclinado, techo horizontal, luneta trasera y
          maletero corto atrás — apoyado sobre la línea de las ruedas. */}
      <path
        d="M 4 66
           L 4 58
           C 4 52 8 48 14 48
           L 22 48
           C 26 34 34 24 46 20
           L 56 18
           C 62 10 72 6 84 6
           L 122 6
           C 136 6 148 12 156 22
           L 168 34
           L 178 38
           C 184 40 188 45 188 51
           L 188 62
           C 188 66 185 68 181 68
           L 170 68
           C 170 59 163 52 154 52
           C 145 52 138 59 138 68
           L 58 68
           C 58 59 51 52 42 52
           C 33 52 26 59 26 68
           L 11 68
           C 7 68 4 68 4 66 Z"
        fill="currentColor"
        className="text-card"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        style={{ color: "var(--color-border)" }}
      />
      {/* Parabrisas, techo y luneta trasera — una sola franja de vidrio
          continua, como se ve un auto real de perfil. */}
      <path
        d="M 60 18
           C 66 12 74 9 84 9
           L 122 9
           C 133 9 143 14 150 22
           L 154 27
           L 68 27
           Z"
        fill="currentColor"
        className="text-background"
      />
      {/* Ruedas */}
      <circle cx="42" cy="68" r="12" className="fill-background" stroke="currentColor" strokeWidth="2" />
      <circle cx="154" cy="68" r="12" className="fill-background" stroke="currentColor" strokeWidth="2" />

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
