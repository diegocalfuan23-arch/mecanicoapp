"use client";

import { createContext, useContext, useEffect, useState } from "react";
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
        <TourSidebar filtro={filtro} onCerrar={() => setAbierto(false)} />
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

/** Mismo breakpoint que el `lg:` de Tailwind (1024px) — por debajo de
 * eso el sidebar real vive oculto tras el botón de MenuMovil. */
function useEsPantallaAngosta() {
  const [angosta, setAngosta] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const actualizar = () => setAngosta(mq.matches);
    mq.addEventListener("change", actualizar);
    return () => mq.removeEventListener("change", actualizar);
  }, []);
  return angosta;
}

type Rect = { top: number; left: number; width: number; height: number };

/**
 * Marca el ítem real del sidebar (data-tour-href, ver ItemEnlace en
 * navegacion.tsx) — nunca una copia del ícono/texto en un modal
 * aparte, así el tour siempre apunta a donde la cosa está de verdad
 * en pantalla, sin arriesgar que se desincronice con el diseño real
 * del sidebar.
 *
 * En pantallas angostas el sidebar vive oculto dentro de MenuMovil,
 * así que el tour lo abre por su cuenta vía un evento personalizado
 * (ver MenuMovil en navegacion.tsx) apenas arranca, y lo cierra al
 * terminar o cancelar.
 */
function TourSidebar({
  filtro,
  onCerrar,
}: {
  filtro: FiltroModulos;
  onCerrar: () => void;
}) {
  const [paso, setPaso] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const angosta = useEsPantallaAngosta();
  const pasos = seccionesVisibles(filtro).filter((s) => s.descripcion);
  const actual = pasos[paso];
  const esPrimero = paso === 0;
  const esUltimo = paso === pasos.length - 1;

  useEffect(() => {
    if (!angosta) return;
    window.dispatchEvent(new Event("mecanicoapp:tour-abrir-menu"));
    return () => {
      window.dispatchEvent(new Event("mecanicoapp:tour-cerrar-menu"));
    };
  }, [angosta]);

  // Se recalcula en cada paso (el ítem cambia) y en cada resize —
  // en móvil, además, espera un instante a que el menú deslizante
  // termine su animación de apertura antes de medir, o el primer
  // paso mediría el elemento todavía fuera de pantalla.
  useEffect(() => {
    if (!actual) return;

    function medir() {
      const el = document.querySelector<HTMLElement>(
        `[data-tour-href="${actual!.href}"]`
      );
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    }

    const demora = angosta ? 260 : 0;
    const id = setTimeout(medir, demora);
    window.addEventListener("resize", medir);
    return () => {
      clearTimeout(id);
      window.removeEventListener("resize", medir);
    };
  }, [actual, angosta]);

  if (!actual) return null;

  // Tarjeta a la derecha del ítem resaltado en escritorio (hay
  // espacio de sobra); debajo del sidebar completo en móvil (el
  // ítem puede estar muy pegado al borde superior o inferior de una
  // pantalla angosta, a la derecha no cabría igual). El clamp contra
  // el alto de la ventana aplica en ambos: un ítem como "Caja" (el
  // último del sidebar) puede estar pegado abajo del todo, y sin
  // esto la tarjeta se saldría de la pantalla por debajo.
  const altoTarjetaEstimado = 200;
  const tarjetaEstilo: React.CSSProperties = rect
    ? angosta
      ? {
          top: Math.min(
            rect.top + rect.height + 12,
            window.innerHeight - altoTarjetaEstimado
          ),
        }
      : {
          top: Math.min(rect.top, window.innerHeight - altoTarjetaEstimado),
          left: rect.left + rect.width + 16,
        }
    : {};

  return (
    <div className="fixed inset-0" style={{ zIndex: 60 }}>
      {/* El "agujero" es el propio ítem real: un div transparente del
          mismo tamaño y posición, con un box-shadow gigante que pinta
          todo lo DEMÁS de oscuro — más confiable entre navegadores que
          un clip-path con estas coordenadas cambiando en cada paso. */}
      {rect && (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-lg ring-2 ring-primary transition-all duration-200"
          style={{
            top: rect.top - 4,
            left: rect.left - 4,
            width: rect.width + 8,
            height: rect.height + 8,
            boxShadow: "0 0 0 9999px rgba(0,0,0,.7)",
          }}
        />
      )}
      {/* Sin posición conocida todavía (primer render antes de medir,
          o el ítem no existe en el DOM por algún motivo) — oscurece
          igual, sin agujero, para no dejar la pantalla sin overlay. */}
      {!rect && (
        <div aria-hidden className="pointer-events-none fixed inset-0 bg-black/70" />
      )}
      <button
        aria-label="Cerrar"
        onClick={onCerrar}
        className="fixed inset-0 z-0"
      />

      <div
        role="dialog"
        aria-modal
        className="fixed z-10 w-[calc(100vw-2rem)] max-w-xs rounded-xl border border-border bg-card p-5 shadow-2xl sm:w-80"
        style={
          rect
            ? tarjetaEstilo
            : {
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }
        }
      >
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
              {actual.icono}
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="text-[15px] font-medium">{actual.texto}</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              {actual.descripcion}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-[12px] text-muted-foreground">
            {paso + 1} de {pasos.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPaso((p) => p - 1)}
              disabled={esPrimero}
              className="rounded-lg border border-border px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            {esUltimo ? (
              <button
                onClick={onCerrar}
                className="rounded-lg bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Listo
              </button>
            ) : (
              <button
                onClick={() => setPaso((p) => p + 1)}
                className="rounded-lg bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
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
