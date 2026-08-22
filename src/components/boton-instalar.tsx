"use client";

import { useEffect, useState } from "react";

type EventoInstalar = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/**
 * Chrome/Android no muestra el banner de instalación por su cuenta de
 * forma confiable — hay que capturar beforeinstallprompt y ofrecer un
 * botón propio. Sin esto, un mecánico como Tío Lalo no tiene forma
 * clara de instalar la app: "no buscar la URL cada vez" fue su pedido
 * explícito.
 */
export function BotonInstalar() {
  const [evento, setEvento] = useState<EventoInstalar | null>(null);
  const [instalada, setInstalada] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalada(true);
      return;
    }

    const capturar = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalar);
    };
    window.addEventListener("beforeinstallprompt", capturar);

    const alInstalar = () => setInstalada(true);
    window.addEventListener("appinstalled", alInstalar);

    return () => {
      window.removeEventListener("beforeinstallprompt", capturar);
      window.removeEventListener("appinstalled", alInstalar);
    };
  }, []);

  if (instalada || !evento) return null;

  async function instalar() {
    if (!evento) return;
    await evento.prompt();
    await evento.userChoice;
    setEvento(null);
  }

  return (
    <button
      onClick={instalar}
      aria-label="Instalar app"
      className="flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-[13px] font-medium transition-colors hover:bg-background sm:px-4"
    >
      <svg viewBox="0 0 20 20" className="size-4 shrink-0" aria-hidden>
        <path
          d="M10 3v9m0 0l3.5-3.5M10 12L6.5 8.5M4 14v1.5A1.5 1.5 0 005.5 17h9a1.5 1.5 0 001.5-1.5V14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="hidden sm:inline">Instalar app</span>
    </button>
  );
}
