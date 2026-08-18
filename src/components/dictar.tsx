"use client";

import { useRef, useState } from "react";

type Estado = "quieto" | "grabando" | "transcribiendo" | "error";

/**
 * Botón de micrófono: graba, transcribe con /api/transcribir y entrega
 * el texto al campo que lo use. Pensado para el mecánico con las manos
 * ocupadas o sucias — dictar en vez de escribir.
 */
export function Dictar({
  onTexto,
  etiqueta = "Dictar",
  compacto = false,
}: {
  onTexto: (texto: string) => void;
  etiqueta?: string;
  /** Solo ícono, redondo — para convivir con un botón de enviar tipo WhatsApp. */
  compacto?: boolean;
}) {
  const [estado, setEstado] = useState<Estado>("quieto");
  const grabadora = useRef<MediaRecorder | null>(null);
  const trozos = useRef<Blob[]>([]);

  async function empezar() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      trozos.current = [];

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) trozos.current.push(e.data);
      };

      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setEstado("transcribiendo");

        const audio = new Blob(trozos.current, { type: "audio/webm" });
        const forma = new FormData();
        forma.append("audio", audio, "nota.webm");

        try {
          const res = await fetch("/api/transcribir", {
            method: "POST",
            body: forma,
          });
          const datos = await res.json();

          if (!res.ok) throw new Error(datos.error);

          onTexto(datos.texto.trim());
          setEstado("quieto");
        } catch {
          setEstado("error");
        }
      };

      grabadora.current = rec;
      rec.start();
      setEstado("grabando");
    } catch {
      setEstado("error");
    }
  }

  function detener() {
    grabadora.current?.stop();
  }

  const icono = (
    <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
      <path
        d="M10 12.5a2.5 2.5 0 002.5-2.5V5a2.5 2.5 0 00-5 0v5a2.5 2.5 0 002.5 2.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M6 9v1a4 4 0 008 0V9M10 14v2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );

  if (estado === "transcribiendo") {
    return compacto ? (
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-card">
        <span className="size-2 animate-pulse rounded-full bg-acento" />
      </span>
    ) : (
      <span className="inline-flex items-center gap-2 text-[13px] text-muted-foreground">
        <span className="size-2 animate-pulse rounded-full bg-acento" />
        Transcribiendo…
      </span>
    );
  }

  if (estado === "grabando") {
    return compacto ? (
      <button
        type="button"
        onClick={detener}
        aria-label="Grabando, toca para terminar"
        className="inline-flex size-10 shrink-0 animate-pulse items-center justify-center rounded-full bg-destructive text-destructive-foreground transition-opacity hover:opacity-90"
      >
        <span className="size-3 rounded-sm bg-current" />
      </button>
    ) : (
      <button
        type="button"
        onClick={detener}
        className="inline-flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-1.5 text-[13px] font-medium text-destructive transition-colors hover:bg-destructive/15"
      >
        <span className="size-2 animate-pulse rounded-full bg-destructive" />
        Grabando… toca para terminar
      </button>
    );
  }

  if (compacto) {
    return (
      <button
        type="button"
        onClick={empezar}
        aria-label={etiqueta}
        className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
      >
        {icono}
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={empezar}
        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-[13px] transition-colors hover:bg-background"
      >
        {icono}
        {etiqueta}
      </button>
      {estado === "error" && (
        <span className="text-[12px] text-destructive">
          No se pudo grabar. Intenta de nuevo.
        </span>
      )}
    </div>
  );
}
