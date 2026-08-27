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
  // El tipo elegido en el panel abierto, aparte de "marcas" (que viene
  // de la prop value): mostrar el input de detalle no puede depender
  // de que el padre ya haya vuelto a bajar el value actualizado tras
  // el clic — con estado propio, el input aparece en el mismo clic.
  const [tipoElegido, setTipoElegido] = useState<string | null>(null);

  const zonas = vista === "superior" ? ZONAS_SUPERIOR : ZONAS_LATERAL;

  function abrirZona(zona: string | null) {
    setZonaAbierta(zona);
    const marca = zona ? marcas.find((m) => m.zona === zona) : undefined;
    setDetalleEditando(marca?.detalle ?? "");
    setTipoElegido(marca?.tipo ?? null);
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
    setTipoElegido(null);
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
                  onClick={() => {
                    setTipoElegido(t.id);
                    marcar(zonaAbierta, t.id);
                  }}
                  className={`rounded-lg border px-3 py-1 text-[13px] transition-colors ${
                    tipoElegido === t.id
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

            {tipoElegido && (
              <>
                <input
                  value={detalleEditando}
                  onChange={(e) => {
                    setDetalleEditando(e.target.value);
                    marcar(zonaAbierta, tipoElegido, e.target.value);
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

/**
 * La zona clicable va sobre una ilustración real del auto (ver
 * SiluetaSuperior/SiluetaLateral): ya no hace falta el nombre de la
 * zona en texto, la imagen misma muestra qué es cada parte. Solo se
 * muestra la letra del daño (X/O/D) cuando la zona tiene una marca.
 * fontSize en unidades del propio viewBox, no una clase Tailwind con
 * px fijos, para escalar bien con el tamaño real de cada caja.
 */
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
  // La letra del daño no puede ser más grande que la caja donde vive.
  const tamLetra = Math.min(z.w, z.h) * 0.4;

  return (
    <g>
      <rect
        x={z.x}
        y={z.y}
        width={z.w}
        height={z.h}
        rx={z.w * 0.03}
        onClick={onClick}
        className={`cursor-pointer stroke-border transition-colors ${
          marca
            ? "fill-acento/25"
            : activa
              ? "fill-foreground/15"
              : "fill-transparent hover:fill-foreground/10"
        }`}
        strokeWidth={z.w * 0.008}
      />
      {tipo && (
        <text
          x={z.x + z.w / 2}
          y={z.y + z.h / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={tamLetra}
          className="pointer-events-none fill-acento font-bold"
        >
          {tipo.letra}
        </text>
      )}
    </g>
  );
}

/**
 * Silueta del auto visto desde arriba: ilustración real de OpenClipart
 * ("top view car" por jonadem, dominio público — ver
 * public/diagrama/auto-superior.svg), no un dibujo propio. Se muestra
 * como imagen de fondo con el mismo viewBox que el SVG original, y las
 * zonas clicables van en un SVG transparente superpuesto encima.
 */
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
    <div className="relative h-96 w-44">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/diagrama/auto-superior.svg"
        alt="Auto visto desde arriba"
        className="absolute inset-0 h-full w-full object-contain"
      />
      <svg
        viewBox="0 0 358.85 789.36"
        className="absolute inset-0 h-full w-full"
      >
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
    </div>
  );
}

/**
 * Silueta lateral: ilustración real de OpenClipart ("Skoda Superb
 * sedan side view" por molumen, dominio público — ver
 * public/diagrama/auto-lateral.svg). Mismo patrón que la superior:
 * imagen de fondo + SVG transparente con las zonas clicables.
 */
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
    <div className="relative h-40 w-96">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/diagrama/auto-lateral.svg"
        alt="Auto de perfil"
        className="absolute inset-0 h-full w-full object-contain"
      />
      <svg viewBox="0 0 841.9 269.3" className="absolute inset-0 h-full w-full">
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
    </div>
  );
}
