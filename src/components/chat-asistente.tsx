"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Dictar } from "@/components/dictar";
import {
  guardarIntercambio,
  leerConversacion,
  borrarConversacion,
} from "@/app/panel/asistente/acciones";

type Mensaje = { rol: "usuario" | "asistente"; texto: string };
type Conversacion = { id: string; titulo: string; updatedAt: Date };

function Lista({
  conversaciones,
  activa,
  nueva,
  abrir,
  borrar,
}: {
  conversaciones: Conversacion[];
  activa: string | null;
  nueva: () => void;
  abrir: (id: string) => void;
  borrar: (id: string) => void;
}) {
  return (
    <>
      <button
        onClick={nueva}
        className="w-full rounded-lg border border-border px-4 py-2 text-left text-[14px] transition-colors hover:bg-background"
      >
        Nueva consulta
      </button>

      <ul className="mt-4 flex flex-col gap-1">
        {conversaciones.map((c) => (
          <li key={c.id} className="group flex items-center gap-1">
            <button
              onClick={() => abrir(c.id)}
              className={`min-w-0 flex-1 truncate rounded-lg px-4 py-2 text-left text-[14px] transition-colors ${
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
    </>
  );
}

/**
 * Conversación con el asistente del taller: se puede escribir o dictar, y
 * cada respuesta se lee en voz alta para que el mecánico la escuche con
 * las manos ocupadas. Las conversaciones quedan guardadas para retomarlas.
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
  const [listaAbierta, setListaAbierta] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Alto real disponible. En Android, al abrir el teclado, h-dvh (heredado
  // del layout) no se reduce de forma confiable: el navegador tapa
  // contenido por debajo en vez de encogerlo, así que "sticky"/"fixed"
  // quedan posicionados fuera de lo visible. Fijar el alto del propio
  // contenedor al visualViewport (que sí refleja el teclado) resuelve
  // eso de raíz: el form queda al final del flujo normal, dentro de un
  // contenedor cuyo alto ya es exactamente lo visible.
  const [alto, setAlto] = useState<number | null>(null);
  const raizRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes, pensando]);

  useLayoutEffect(() => {
    const vv = window.visualViewport;
    const contenedor = raizRef.current;
    if (!vv || !contenedor) return;
    // padding-bottom de <main> (py-8 del layout): sin restarlo, el
    // contenido queda justo hasta el borde del viewport pero <main>
    // todavía necesita ese espacio debajo, empujando el total más allá
    // de lo visible y generando scroll aunque no haya nada de más.
    const main = contenedor.closest("main");
    const abajo = main
      ? parseFloat(getComputedStyle(main).paddingBottom)
      : 0;
    function actualizar() {
      // rAF: en Android el resize/scroll del visualViewport puede
      // dispararse antes de que el layout termine de asentarse tras
      // la animación del teclado — leer el rect un frame después
      // evita el hueco vacío que se veía con el valor viejo.
      requestAnimationFrame(() => {
        if (!contenedor) return;
        const arriba = contenedor.getBoundingClientRect().top;
        setAlto(vv!.height - arriba - abajo);
      });
    }
    actualizar();
    vv.addEventListener("resize", actualizar);
    vv.addEventListener("scroll", actualizar);
    return () => {
      vv.removeEventListener("resize", actualizar);
      vv.removeEventListener("scroll", actualizar);
    };
  }, []);

  async function abrir(id: string) {
    setListaAbierta(false);
    const previos = await leerConversacion(id);
    if (!previos) return;
    setActiva(id);
    setMensajes(previos as Mensaje[]);
  }

  function nueva() {
    audioRef.current?.pause();
    setActiva(null);
    setMensajes([]);
    setListaAbierta(false);
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
    <div
      ref={raizRef}
      style={alto !== null ? { height: alto } : undefined}
      className="flex h-full min-h-0 gap-8"
    >
      {/* Consultas anteriores: columna fija desde tablet */}
      <aside className="scroll-discreto hidden w-56 shrink-0 overflow-y-auto lg:block">
        <Lista
          conversaciones={conversaciones}
          activa={activa}
          nueva={nueva}
          abrir={abrir}
          borrar={borrar}
        />
      </aside>

      {/* Cajón de consultas en móvil */}
      {listaAbierta && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Cerrar"
            onClick={() => setListaAbierta(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="scroll-discreto absolute inset-y-0 left-0 w-72 overflow-y-auto border-r border-border bg-card p-4">
            <Lista
          conversaciones={conversaciones}
          activa={activa}
          nueva={nueva}
          abrir={abrir}
          borrar={borrar}
        />
          </div>
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
          <button
            onClick={() => setListaAbierta(true)}
            className="rounded-lg border border-border px-4 py-2 text-[13px] transition-colors hover:bg-card lg:hidden"
          >
            Consultas
          </button>
          <button
            onClick={() => {
              setVozActiva(!vozActiva);
              if (vozActiva) audioRef.current?.pause();
            }}
            className="ml-auto rounded-lg border border-border px-4 py-2 text-[13px] transition-colors hover:bg-card"
          >
            {vozActiva ? "Voz activada" : "Voz apagada"}
          </button>
        </div>

        {mensajes.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
            <p className="text-2xl leading-snug font-medium text-muted-foreground/60">
              ¿Cuánto debe la BXFS19?
            </p>
            <p className="mt-4 text-[13px] text-muted-foreground">
              Pregunta por patente, kilometraje, qué se le hizo o cuánto debe.
            </p>
          </div>
        ) : (
          <ul className="scroll-discreto flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
            {mensajes.map((m, i) => {
              // La última respuesta es lo que el mecánico vino a leer: va
              // grande. Las anteriores bajan a tamaño de cuerpo.
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
                        ? "bg-foreground/10 text-[15px] text-foreground"
                        : destacada
                          ? "bg-card text-2xl leading-snug font-medium"
                          : "bg-card text-[15px]"
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
          // sticky al fondo del contenedor raíz, cuyo alto ya está fijado
          // al visualViewport real (ver "alto" arriba) — por eso sticky
          // ancla en el lugar correcto también con el teclado abierto.
          className="sticky bottom-0 z-20 flex flex-wrap items-center gap-2 bg-background pt-4"
        >
          <input
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            placeholder="Escribe tu pregunta"
            className="min-w-0 flex-1 rounded-lg border border-border bg-card px-4 py-4 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
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
    </div>
  );
}
