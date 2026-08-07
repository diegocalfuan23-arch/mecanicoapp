"use client";

import { useState, useRef, useEffect } from "react";
import { Dictar } from "@/components/dictar";

type Mensaje = { rol: "usuario" | "asistente"; texto: string };

/**
 * Conversación con el asistente del taller: se puede escribir o dictar, y
 * cada respuesta se lee en voz alta para que el mecánico la escuche con
 * las manos ocupadas.
 */
export function ChatAsistente() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [entrada, setEntrada] = useState("");
  const [pensando, setPensando] = useState(false);
  const [vozActiva, setVozActiva] = useState(true);
  const finRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes, pensando]);

  async function reproducir(texto: string) {
    try {
      const res = await fetch("/api/hablar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto }),
      });
      if (!res.ok) return;

      const url = URL.createObjectURL(await res.blob());
      audioRef.current?.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch {
      // Si el audio falla, el texto ya está en pantalla: no se interrumpe.
    }
  }

  async function enviar(texto: string) {
    const limpio = texto.trim();
    if (!limpio || pensando) return;

    const conversacion: Mensaje[] = [
      ...mensajes,
      { rol: "usuario", texto: limpio },
    ];
    setMensajes(conversacion);
    setEntrada("");
    setPensando(true);

    try {
      const res = await fetch("/api/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversacion }),
      });
      const datos = await res.json();

      const respuesta = res.ok
        ? datos.respuesta
        : `No se pudo responder: ${datos.error}`;

      setMensajes([...conversacion, { rol: "asistente", texto: respuesta }]);
      if (res.ok && vozActiva) reproducir(respuesta);
    } catch {
      setMensajes([
        ...conversacion,
        { rol: "asistente", texto: "No se pudo conectar con el asistente." },
      ]);
    } finally {
      setPensando(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-end gap-2 border-b border-border px-4 py-4 sm:px-6">
        <button
          onClick={() => {
            setVozActiva(!vozActiva);
            if (vozActiva) audioRef.current?.pause();
          }}
          className="rounded-lg border border-border px-4 py-2 text-[13px] transition-colors hover:bg-background"
        >
          {vozActiva ? "Voz activada" : "Voz apagada"}
        </button>
      </div>

      {mensajes.length === 0 && (
        <p className="px-4 py-8 text-center text-[15px] text-muted-foreground sm:px-6">
          Por ejemplo: «¿cuánto debe la BXFS19?» o «¿qué le hicimos al
          Qashqai?»
        </p>
      )}

      {mensajes.length > 0 && (
        <ul className="flex max-h-[55vh] min-h-60 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-6">
          {mensajes.map((m, i) => (
            <li
              key={i}
              className={m.rol === "usuario" ? "text-right" : "text-left"}
            >
              <div
                className={`inline-block max-w-[85%] rounded-xl px-4 py-2 text-[15px] ${
                  m.rol === "usuario"
                    ? "bg-foreground/10 text-foreground"
                    : "bg-background"
                }`}
              >
                {m.texto}
              </div>
              {m.rol === "asistente" && (
                <button
                  onClick={() => reproducir(m.texto)}
                  className="mt-1 block text-[12px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Escuchar
                </button>
              )}
            </li>
          ))}
          {pensando && (
            <li className="text-[15px] text-muted-foreground">Buscando…</li>
          )}
          <div ref={finRef} />
        </ul>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(entrada);
        }}
        className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-4 sm:px-6"
      >
        <input
          value={entrada}
          onChange={(e) => setEntrada(e.target.value)}
          placeholder="Escribe tu pregunta"
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
        />
        <Dictar etiqueta="Hablar" onTexto={enviar} />
        <button
          type="submit"
          disabled={!entrada.trim() || pensando}
          className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
