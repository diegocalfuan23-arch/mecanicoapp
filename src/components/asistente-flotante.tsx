"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { ChatAsistente } from "@/components/chat-asistente";
import { useAltoViewportVisual } from "@/hooks/usar-alto-viewport-visual";

type Conversacion = { id: string; titulo: string; updatedAt: Date };

const AsistenteContexto = createContext<{
  abierto: boolean;
  alternar: () => void;
} | null>(null);

/**
 * El Asistente ya no vive en su propia página (/panel/asistente) —
 * pedido real: que sea accesible desde cualquier pantalla del panel.
 * El botón vive en el header; el panel se despliega debajo de él,
 * angosto y anclado a la esquina superior derecha en escritorio (se
 * ve el resto de la pantalla detrás), a todo el ancho en pantallas
 * chicas — mismo patrón responsive que Bujía, referencia que trajo
 * Diego. Van en componentes separados porque el botón vive dentro de
 * <header> y el panel se monta en otro contenedor (ver layout.tsx) —
 * comparten estado por contexto en vez de pasarse props entre
 * hermanos que no se tocan directamente en el árbol.
 */
export function ProveedorAsistente({
  children,
}: {
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <AsistenteContexto.Provider
      value={{ abierto, alternar: () => setAbierto((v) => !v) }}
    >
      {children}
    </AsistenteContexto.Provider>
  );
}

function useAsistente() {
  const ctx = useContext(AsistenteContexto);
  if (!ctx) throw new Error("Falta <ProveedorAsistente> en el layout");
  return ctx;
}

export function BotonAsistente() {
  const { abierto, alternar } = useAsistente();
  return (
    <button
      onClick={alternar}
      aria-label={abierto ? "Cerrar asistente" : "Abrir asistente"}
      aria-expanded={abierto}
      // El tour de onboarding (tour-onboarding.tsx) lo busca por este
      // atributo, igual que hace con cada ítem del sidebar — no es una
      // ruta real, solo un identificador para el paso final del tour.
      data-tour-href="asistente"
      className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-colors ${
        abierto
          ? "bg-primary text-primary-foreground"
          : "bg-foreground/10 text-foreground hover:bg-foreground/15"
      }`}
    >
      <svg viewBox="0 0 20 20" className="size-4.5" aria-hidden>
        <path
          d="M4 4.5h12a1 1 0 011 1v7a1 1 0 01-1 1H8.5L5 16.5V13.5H4a1 1 0 01-1-1v-7a1 1 0 011-1zM7 8h6M7 10.5h4"
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
 * eso el panel es el que necesita seguir al teclado en vivo.
 *
 * matchMedia es síncrono: se lee en el inicializador de useState
 * (evaluado solo en el primer render del cliente) en vez de en un
 * efecto — mismo patrón que navegacion.tsx, así el valor ya está
 * listo desde el primer paint del cliente. */
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

export function PanelAsistente({
  conversaciones,
}: {
  conversaciones: Conversacion[];
}) {
  const { abierto, alternar } = useAsistente();
  const altoVisual = useAltoViewportVisual();
  const angosta = useEsPantallaAngosta();

  // Con el panel fixed sobre toda la pantalla en móvil, Android Chrome
  // igual puede "rebotar"/desplazar el documento de atrás al enfocar
  // el input con el teclado abierto (el fixed no evita eso por sí
  // solo) — se ve como que "algo" scrollea aunque el panel esté bien
  // posicionado. overflow:hidden en <html> mientras el panel está
  // abierto en pantallas angostas lo evita; se restaura siempre al
  // cerrar, nunca queda pegado.
  useEffect(() => {
    if (!abierto || !angosta) return;
    const previo = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previo;
    };
  }, [abierto, angosta]);

  if (!abierto) return null;

  // Vive dentro del MISMO contenedor que ya envuelve a Sidebar +
  // <main> (ver layout.tsx: ese div tiene relative, flex-1,
  // min-h-0) — así el panel siempre queda debajo del header, sin
  // taparlo, y sin adivinar ninguna altura en píxeles: hereda el
  // cálculo que ese flex-1 ya hace para <main> hoy.
  //
  // Responsive a propósito, como en la referencia (Bujía): en
  // escritorio es un panel angosto anclado arriba a la derecha (se ve
  // el sidebar y el contenido de atrás); en pantallas angostas no hay
  // espacio para eso, así que cubre todo el ancho.
  //
  // En móvil, `absolute inset-0` se mide contra el contenedor padre,
  // que NO se encoge cuando aparece el teclado (solo el viewport
  // VISUAL se reduce) — el panel quedaba con la altura de antes del
  // teclado, así que el input terminaba empujado fuera de lo que
  // realmente se ve. `position: fixed` con el alto real de
  // visualViewport (useAltoViewportVisual) sigue al teclado en vivo,
  // como hace claude.ai — solo se aplica en pantallas angostas, nunca
  // en el panel anclado de escritorio (ahí las clases lg: de Tailwind
  // ya definen su propio tamaño fijo, no depende del teclado).
  const fixedMovil =
    angosta && altoVisual != null
      ? ({ position: "fixed", inset: 0, height: altoVisual } as const)
      : undefined;

  return (
    <div
      style={fixedMovil}
      // overflow-hidden acá, no solo en el <ul> de mensajes de
      // ChatAsistente: sin esto, si el alto calculado quedaba un
      // instante desajustado del contenido real, era el panel ENTERO
      // el que scrolleaba (arrastrando el header y el input con él) en
      // vez de solo el área de mensajes — el panel no debe tener
      // scroll propio bajo ninguna circunstancia, eso es trabajo
      // exclusivo del <ul> interno.
      className={`z-30 flex flex-col overflow-hidden bg-background lg:inset-auto lg:top-0 lg:right-0 lg:h-[min(600px,calc(100%-2rem))] lg:w-105 lg:rounded-xl lg:border lg:border-border lg:shadow-2xl ${
        fixedMovil ? "" : "absolute inset-0"
      }`}
    >
      <ChatAsistente conversaciones={conversaciones} onCerrar={alternar} />
    </div>
  );
}
