"use client";

import { useEffect, useState } from "react";

type EventoInstalar = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const ICONO = (
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
);

/**
 * Chrome decide cuándo ofrecer beforeinstallprompt según una
 * heurística interna (cuánto usó el sitio, si ya lo rechazó antes) —
 * no es algo que se pueda forzar. Un mecánico como Tío Lalo no puede
 * quedar sin forma de instalar solo porque Chrome no disparó el
 * evento esa vez: el botón siempre está, y si no hay evento
 * automático disponible, explica los tres pasos manuales.
 */
export function BotonInstalar() {
  const [evento, setEvento] = useState<EventoInstalar | null>(null);
  const [instalada, setInstalada] = useState(false);
  const [ayuda, setAyuda] = useState(false);

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

  if (instalada) return null;

  async function tocar() {
    if (!evento) {
      setAyuda(true);
      return;
    }
    await evento.prompt();
    await evento.userChoice;
    setEvento(null);
  }

  return (
    <>
      <button
        onClick={tocar}
        aria-label="Instalar app"
        className="flex shrink-0 items-center gap-2 rounded-lg border border-border px-3 py-2 text-[13px] font-medium transition-colors hover:bg-background sm:px-4"
      >
        {ICONO}
        <span className="hidden sm:inline">Instalar app</span>
      </button>

      {ayuda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Cerrar"
            onClick={() => setAyuda(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-medium">Instalar la app</h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Tu navegador todavía no ofreció instalar sola. Hazlo así:
            </p>
            <ol className="mt-4 flex flex-col gap-3 text-[15px]">
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[13px] font-medium">
                  1
                </span>
                Toca los tres puntos (⋮) arriba a la derecha de Chrome.
              </li>
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[13px] font-medium">
                  2
                </span>
                Busca "Instalar app" o "Agregar a pantalla de inicio".
              </li>
              <li className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-[13px] font-medium">
                  3
                </span>
                Confirma. Va a quedar un ícono en tu celular, como
                cualquier otra app.
              </li>
            </ol>
            <button
              onClick={() => setAyuda(false)}
              className="mt-6 w-full rounded-lg border border-border px-6 py-2 font-medium transition-colors hover:bg-background"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
