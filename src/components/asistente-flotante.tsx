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
 * El botón vive en el header y el panel se despliega bajo él a todo
 * el ancho (mismo patrón que Bujía, referencia que trajo Diego). Van
 * en componentes separados porque el botón vive dentro de <header> y
 * el panel se posiciona relativo a ese mismo <header> (no al layout
 * completo) — comparten estado por contexto en vez de pasarse props
 * entre hermanos que no se tocan directamente en el árbol.
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

  // fixed inset-0: cubre TODO el viewport, sin depender de ningún
  // cálculo de offset o containing block de un padre — un absolute
  // anclado al header (o incluso al layout raíz) siempre terminaba
  // dejando un resto de la pantalla de atrás asomando, porque su alto
  // dependía de medir el header a mano. El propio ChatAsistente ya
  // tiene su título "Asistente" en su header interno, así que tapar
  // también el header de MecánicoApp mientras está abierto no pierde
  // contexto — es lo mismo que hacía la página dedicada de antes,
  // solo que ahora se abre encima en vez de navegar.
  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-background">
      <ChatAsistente conversaciones={conversaciones} onCerrar={alternar} />
    </div>
  );
}
