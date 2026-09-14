"use client";

import { createContext, useContext, useState } from "react";
import { seccionesVisibles } from "@/app/panel/navegacion";

type FiltroModulos = Parameters<typeof seccionesVisibles>[0];

const TourContexto = createContext<{ abrir: () => void } | null>(null);

/**
 * Botón "?" del header — mismo patrón de contexto que
 * ProveedorAsistente (asistente-flotante.tsx): el botón vive en
 * <header>, el modal se monta donde corresponda en el árbol, y
 * comparten estado por contexto en vez de pasarse props entre
 * hermanos que no se tocan directamente. `filtro` son los mismos
 * flags que panel/layout.tsx ya calcula para el propio sidebar
 * (tieneInventario, tieneServicios, etc.) — así el tour muestra
 * exactamente los módulos que esta persona realmente tiene, nunca la
 * lista completa (un mecánico sin Inventario, o Plan Taller sin Caja,
 * no debe ver esos pasos: sería un módulo que ni puede abrir).
 */
export function ProveedorTour({
  filtro,
  children,
}: {
  filtro: FiltroModulos;
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <TourContexto.Provider value={{ abrir: () => setAbierto(true) }}>
      {children}
      {abierto && (
        <ModalTour filtro={filtro} onCerrar={() => setAbierto(false)} />
      )}
    </TourContexto.Provider>
  );
}

function useTour() {
  const ctx = useContext(TourContexto);
  if (!ctx) throw new Error("Falta <ProveedorTour> en el layout");
  return ctx;
}

export function BotonTour() {
  const { abrir } = useTour();
  return (
    <button
      onClick={abrir}
      aria-label="Qué hace cada sección"
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-foreground transition-colors hover:bg-foreground/15"
    >
      <svg viewBox="0 0 20 20" className="size-4.5" aria-hidden>
        <path
          d="M10 17.5a7.5 7.5 0 100-15 7.5 7.5 0 000 15zM10 14v-.3M7.8 8a2.2 2.2 0 114.15 1c-.55.5-1.35.9-1.65 1.5-.1.2-.15.45-.15.7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

/**
 * Tarjeta modal centrada, no un spotlight sobre el sidebar real — en
 * móvil el sidebar vive oculto dentro de un menú deslizante que solo
 * se abre a mano, así que resaltar un ítem real ahí habría exigido
 * abrir ese menú por su cuenta durante el tour (más código, más
 * frágil a futuros cambios del sidebar). Mismo ícono y texto que cada
 * ítem real, sin depender de encontrarlo en el DOM.
 */
function ModalTour({
  filtro,
  onCerrar,
}: {
  filtro: FiltroModulos;
  onCerrar: () => void;
}) {
  const [paso, setPaso] = useState(0);
  const pasos = seccionesVisibles(filtro).filter((s) => s.descripcion);
  const actual = pasos[paso];
  const esPrimero = paso === 0;
  const esUltimo = paso === pasos.length - 1;

  if (!actual) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        aria-label="Cerrar"
        onClick={onCerrar}
        className="absolute inset-0 bg-black/60"
      />
      <div
        role="dialog"
        aria-modal
        className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6 sm:p-8"
      >
        <button
          onClick={onCerrar}
          aria-label="Cerrar"
          className="absolute top-4 right-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
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

        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <svg viewBox="0 0 20 20" className="size-6" aria-hidden>
            {actual.icono}
          </svg>
        </div>

        <h2 className="mt-4 text-lg font-medium">{actual.texto}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
          {actual.descripcion}
        </p>

        <div className="mt-6 flex items-center justify-between gap-4">
          <span className="text-[12px] text-muted-foreground">
            {paso + 1} de {pasos.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPaso((p) => p - 1)}
              disabled={esPrimero}
              className="rounded-lg border border-border px-4 py-2 text-[13px] font-medium transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            {esUltimo ? (
              <button
                onClick={onCerrar}
                className="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Listo
              </button>
            ) : (
              <button
                onClick={() => setPaso((p) => p + 1)}
                className="rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Siguiente
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
