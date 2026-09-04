"use client";

import { createContext, useContext, useState } from "react";
import { ChatAsistente } from "@/components/chat-asistente";

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

export function PanelAsistente({
  conversaciones,
}: {
  conversaciones: Conversacion[];
}) {
  const { abierto, alternar } = useAsistente();
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
  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-background lg:inset-auto lg:top-0 lg:right-0 lg:h-[min(600px,calc(100%-2rem))] lg:w-105 lg:rounded-xl lg:border lg:border-border lg:shadow-2xl">
      <ChatAsistente conversaciones={conversaciones} onCerrar={alternar} />
    </div>
  );
}
