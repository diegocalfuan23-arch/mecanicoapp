"use client";

import { useState, useRef, useEffect } from "react";
import { Dictar } from "@/components/dictar";
import {
  guardarIntercambio,
  leerConversacion,
  borrarConversacion,
} from "@/app/panel/asistente/acciones";

type Mensaje = { rol: "usuario" | "asistente"; texto: string };
type Conversacion = { id: string; titulo: string; updatedAt: Date };

function ListaConversaciones({
  conversaciones,
  activa,
  abrir,
  borrar,
}: {
  conversaciones: Conversacion[];
  activa: string | null;
  abrir: (id: string) => void;
  borrar: (id: string) => void;
}) {
  if (conversaciones.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">
        Sin consultas anteriores.
      </p>
    );
  }

  return (
    <ul className="scroll-discreto max-h-80 overflow-y-auto py-1">
      {conversaciones.map((c) => (
        <li key={c.id} className="group flex items-center gap-1 px-1">
          <button
            onClick={() => abrir(c.id)}
            className={`min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
              activa === c.id
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:bg-background hover:text-foreground"
            }`}
          >
            {c.titulo}
          </button>
          <button
            onClick={() => borrar(c.id)}
            aria-label="Borrar conversación"
            className="shrink-0 rounded-lg px-2 py-2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus:opacity-100"
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
        </li>
      ))}
    </ul>
  );
}

/**
 * Conversación con el asistente del taller: se puede escribir o dictar, y
 * cada respuesta se lee en voz alta para que el mecánico la escuche con
 * las manos ocupadas. Las conversaciones quedan guardadas para retomarlas
 * — accesibles desde el ícono de historial en el header propio del chat,
 * no en una columna lateral fija (este componente vive dentro del panel
 * flotante, que ya es angosto en pantallas chicas).
 */
export function ChatAsistente({
  conversaciones: inicial,
}: {
  conversaciones: Conversacion[];
}) {
  const [conversaciones, setConversaciones] = useState(inicial);
  const [activa, setActiva] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [entrada, setEntrada] = useState("");
  const [pensando, setPensando] = useState(false);
  const [vozActiva, setVozActiva] = useState(true);
  const [historialAbierto, setHistorialAbierto] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes, pensando]);

  async function abrir(id: string) {
    setHistorialAbierto(false);
    const previos = await leerConversacion(id);
    if (!previos) return;
    setActiva(id);
    setMensajes(previos as Mensaje[]);
  }

  function nueva() {
    audioRef.current?.pause();
    setActiva(null);
    setMensajes([]);
    setHistorialAbierto(false);
  }

  async function borrar(id: string) {
    await borrarConversacion(id);
    setConversaciones((c) => c.filter((x) => x.id !== id));
    if (activa === id) nueva();
  }

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

      if (res.ok) {
        if (vozActiva) reproducir(respuesta);

        const guardado = await guardarIntercambio({
          conversacionId: activa,
          pregunta: limpio,
          respuesta,
        });

        if (guardado.conversacionId && !activa) {
          setActiva(guardado.conversacionId);
          setConversaciones((c) => [
            {
              id: guardado.conversacionId,
              titulo: limpio.length > 60 ? `${limpio.slice(0, 60)}…` : limpio,
              updatedAt: new Date(),
            },
            ...c,
          ]);
        }
      }
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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setHistorialAbierto((v) => !v)}
            aria-label="Conversaciones anteriores"
            aria-expanded={historialAbierto}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <svg viewBox="0 0 20 20" className="size-4.5" aria-hidden>
              <path
                d="M10 5.5V10l3 2M17 10a7 7 0 11-7-7 7 7 0 017 7z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            onClick={nueva}
            aria-label="Nueva consulta"
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <svg viewBox="0 0 20 20" className="size-4.5" aria-hidden>
              <path
                d="M5 5.5h7a1 1 0 011 1V16a.5.5 0 01-.8.4L10 15l-2.2 1.4A.5.5 0 015 16V6.5a1 1 0 011-1zM4.5 4l8-1"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <span className="text-[14px] font-medium">Asistente</span>

        <button
          onClick={() => {
            setVozActiva(!vozActiva);
            if (vozActiva) audioRef.current?.pause();
          }}
          aria-label={vozActiva ? "Apagar voz" : "Activar voz"}
          aria-pressed={vozActiva}
          className={`rounded-lg p-2 transition-colors hover:bg-background ${
            vozActiva ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <svg viewBox="0 0 20 20" className="size-4.5" aria-hidden>
            <path
              d="M4 8v4h3l4 3V5L7 8H4z"
              fill="currentColor"
            />
            {vozActiva && (
              <path
                d="M14 7a4 4 0 010 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>

        {historialAbierto && (
          <>
            <button
              aria-label="Cerrar historial"
              onClick={() => setHistorialAbierto(false)}
              className="fixed inset-0 z-10 cursor-default"
            />
            <div className="scroll-discreto absolute top-full left-4 z-20 mt-1 w-72 rounded-xl border border-border bg-card py-1 shadow-lg">
              <ListaConversaciones
                conversaciones={conversaciones}
                activa={activa}
                abrir={abrir}
                borrar={borrar}
              />
            </div>
          </>
        )}
      </div>

      <div className="scroll-discreto min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {mensajes.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center">
            <p className="text-xl leading-snug font-medium text-muted-foreground/60">
              ¿Cuánto debe la BXFS19?
            </p>
            <p className="mt-3 text-[13px] text-muted-foreground">
              Pregunta por patente, kilometraje, qué se le hizo o cuánto debe.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-5">
            {mensajes.map((m, i) => {
              const destacada =
                m.rol === "asistente" && i === mensajes.length - 1;

              return (
                <li
                  key={i}
                  className={m.rol === "usuario" ? "text-right" : "text-left"}
                >
                  <div
                    className={`inline-block max-w-[85%] rounded-xl px-4 py-2 ${
                      m.rol === "usuario"
                        ? "bg-foreground/10 text-[14px] text-foreground"
                        : destacada
                          ? "bg-background text-lg leading-snug font-medium"
                          : "bg-background text-[14px]"
                    }`}
                  >
                    {m.texto}
                  </div>
                  {m.rol === "asistente" && (
                    <button
                      onClick={() => reproducir(m.texto)}
                      className="mt-2 block text-[12px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    >
                      Escuchar
                    </button>
                  )}
                </li>
              );
            })}
            {pensando && (
              <li className="text-[14px] text-muted-foreground">Buscando…</li>
            )}
            <div ref={finRef} />
          </ul>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(entrada);
        }}
        className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border bg-background px-4 py-3"
      >
        <input
          value={entrada}
          onChange={(e) => setEntrada(e.target.value)}
          placeholder="Escribe tu pregunta"
          className="min-w-0 flex-1 rounded-lg border border-border bg-card px-4 py-3 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
        />
        {/* Mismo lugar para los dos: micrófono si no hay texto, enviar
            si lo hay — igual que WhatsApp, sin los dos botones a la vez. */}
        {entrada.trim() ? (
          <button
            type="submit"
            disabled={pensando}
            aria-label="Enviar"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
              <path
                d="M3 10h13M11 5l5 5-5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : (
          <Dictar etiqueta="Hablar" onTexto={enviar} compacto />
        )}
      </form>
    </div>
  );
}
