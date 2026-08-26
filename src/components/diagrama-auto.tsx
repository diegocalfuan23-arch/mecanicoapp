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
 * fontSize en unidades del propio viewBox (no una clase Tailwind con
 * px fijos): la vista lateral se dibuja mucho más grande en pantalla
 * que en el PDF, y un texto en px absolutos queda gigante frente a
 * cajas angostas — la letra del daño llegaba a tapar la caja entera y
 * las etiquetas de zona se veían amontonadas y cortadas.
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
  const tamLetra = Math.min(z.w, z.h) * 0.5;
  const tamEtiqueta = Math.min(z.w * 0.16, z.h * 0.28, 6.5);
  // Una caja angosta (paragolpes) no tiene espacio para ningún tamaño
  // legible de "Parag. del." — mejor sin etiqueta que una ilegible.
  const cabeEtiqueta = z.w >= 20 && tamEtiqueta >= 3.5;

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
          fontSize={tamLetra}
          className="pointer-events-none fill-acento font-bold"
        >
          {tipo.letra}
        </text>
      ) : cabeEtiqueta ? (
        <text
          x={z.x + z.w / 2}
          y={z.y + z.h / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={tamEtiqueta}
          className="pointer-events-none fill-muted-foreground"
        >
          {z.etiquetaCorta}
        </text>
      ) : null}
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

/**
 * Silueta lateral, proporción de sedán: capó bajo y curvo, parabrisas
 * inclinado, techo y luneta en una sola franja de vidrio, maletero
 * corto, con sombra de contacto y un leve volumen en el techo — se
 * dibujó a mano hasta que se leyera como un auto real, no una caja.
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
    <svg viewBox="0 0 200 100" className="h-40 w-auto text-border">
      {/* Sombra de contacto en el piso */}
      <ellipse cx="100" cy="86" rx="92" ry="4" className="fill-black/35" />

      {/* Carrocería */}
      <path
        d="M 6 68
           C 6 60 10 55 18 54
           L 26 53
           C 30 38 40 26 54 21
           L 62 19
           C 70 10 82 5 96 5
           L 130 5
           C 146 5 160 12 170 24
           L 178 34
           C 184 33 190 36 192 42
           C 193.5 45.5 194 49 194 53
           L 194 62
           C 194 66 191 68 187 68
           L 176 68
           C 176 58 168 50 158 50
           C 148 50 140 58 140 68
           L 62 68
           C 62 58 54 50 44 50
           C 34 50 26 58 26 68
           L 12 68
           C 8 68 6 68 6 68 Z"
        fill="currentColor"
        className="text-card"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        style={{ color: "var(--color-border)" }}
      />

      {/* Franja de luz superior, da volumen al techo/capó */}
      <path
        d="M 30 40
           C 40 28 52 22 62 21
           C 70 12 82 8 96 8
           L 128 8
           C 142 8 154 14 163 24
           L 30 40 Z"
        className="fill-white/5"
      />

      {/* Cristales: parabrisas + techo + luneta, franja continua */}
      <path
        d="M 64 20
           C 71 12 81 9 96 9
           L 128 9
           C 140 9 150 15 158 25
           L 163 31
           L 70 31
           Z"
        className="fill-background"
      />
      <line x1="112" y1="9" x2="112" y2="31" stroke="currentColor" strokeWidth="1" className="text-card" />

      {/* Manijas y línea de la puerta */}
      <rect x="95" y="42" width="10" height="2.2" rx="1.1" className="fill-background/50" />
      <rect x="140" y="42" width="10" height="2.2" rx="1.1" className="fill-background/50" />
      <line x1="122" y1="31" x2="122" y2="68" stroke="currentColor" strokeWidth="1" className="text-background/40" />

      {/* Parachoques, un poco más oscuros que la carrocería */}
      <path d="M 176 50 C 184 50 190 54 191 61 L 191 66 C 191 67.5 189.5 68 188 68 L 176 68 Z" className="fill-black/20" />
      <path d="M 26 53 C 20 54 12 57 8 62 L 6 66 C 6 67.5 7.5 68 9 68 L 26 68 Z" className="fill-black/20" />

      {/* Ruedas: llanta + neumático */}
      <circle cx="44" cy="68" r="14" className="fill-background" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="44" cy="68" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <circle cx="158" cy="68" r="14" className="fill-background" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="158" cy="68" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />

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
