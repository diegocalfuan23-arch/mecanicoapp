"use client";

import { useRef, useState } from "react";
import { useUploadThing } from "@/lib/subida";

const MAXIMO = 12;

/**
 * Fotos del estado del vehículo. La cámara se reabre sola después de cada
 * disparo, así el mecánico saca los cuatro costados y el tablero de
 * corrido sin volver a tocar el botón entremedio.
 */
export function FotosVehiculo({
  fotos,
  onCambio,
  onError,
}: {
  fotos: string[];
  onCambio: (fotos: string[]) => void;
  onError?: (mensaje: string) => void;
}) {
  const [subiendo, setSubiendo] = useState(0);
  const camara = useRef<HTMLInputElement>(null);
  const galeria = useRef<HTMLInputElement>(null);
  // Cuando está en modo seguido, la cámara se vuelve a abrir al terminar.
  const seguir = useRef(false);

  const { startUpload } = useUploadThing("fotoVehiculo", {
    onClientUploadComplete: (res) => {
      onCambio([...fotos, ...res.map((r) => r.ufsUrl)]);
      setSubiendo(0);
      if (seguir.current) {
        seguir.current = false;
        // Deja que el estado se asiente antes de reabrir la cámara.
        setTimeout(() => camara.current?.click(), 300);
      }
    },
    onUploadError: (e) => {
      setSubiendo(0);
      seguir.current = false;
      // El detalle importa: "sin sesión" y "archivo muy grande" se
      // arreglan distinto, y con un mensaje genérico no hay forma de
      // saber cuál fue.
      console.error("Error al subir la foto:", e);
      onError?.(`No se pudo subir la foto: ${e.message}`);
    },
  });

  async function recibir(
    e: React.ChangeEvent<HTMLInputElement>,
    desdeCamara: boolean
  ) {
    const archivos = Array.from(e.target.files ?? []);
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (archivos.length === 0) return;

    const espacio = MAXIMO - fotos.length;
    if (espacio <= 0) {
      onError?.(`Ya tienes el máximo de ${MAXIMO} fotos.`);
      return;
    }

    const aSubir = archivos.slice(0, espacio);
    seguir.current = desdeCamara && fotos.length + aSubir.length < MAXIMO;
    setSubiendo(aSubir.length);
    await startUpload(aSubir);
  }

  function quitar(url: string) {
    onCambio(fotos.filter((f) => f !== url));
  }

  const lleno = fotos.length >= MAXIMO;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium">
          Fotos del estado — costados y tablero
        </span>
        {fotos.length > 0 && (
          <span className="text-[12px] text-muted-foreground">
            {fotos.length} de {MAXIMO}
          </span>
        )}
      </div>

      {(fotos.length > 0 || subiendo > 0) && (
        <div className="mb-2 flex flex-wrap gap-2">
          {fotos.map((url) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Estado del vehículo"
                className="size-16 rounded-lg border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => quitar(url)}
                aria-label="Quitar esta foto"
                className="absolute -top-2 -right-2 rounded-full border border-border bg-card p-1 text-muted-foreground transition-colors hover:text-destructive"
              >
                <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
                  <path
                    d="M6 6l8 8M14 6l-8 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          ))}
          {Array.from({ length: subiendo }).map((_, i) => (
            <div
              key={`subiendo-${i}`}
              className="flex size-16 animate-pulse items-center justify-center rounded-lg border border-dashed border-border text-[12px] text-muted-foreground"
            >
              …
            </div>
          ))}
        </div>
      )}

      <input
        ref={camara}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => recibir(e, true)}
        className="hidden"
      />
      <input
        ref={galeria}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => recibir(e, false)}
        className="hidden"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => camara.current?.click()}
          disabled={lleno || subiendo > 0}
          className="rounded-lg border border-border px-4 py-2 text-[14px] transition-colors hover:bg-background disabled:opacity-60"
        >
          {subiendo > 0 ? "Subiendo…" : "Sacar fotos"}
        </button>
        <button
          type="button"
          onClick={() => galeria.current?.click()}
          disabled={lleno || subiendo > 0}
          className="rounded-lg border border-border px-4 py-2 text-[14px] transition-colors hover:bg-background disabled:opacity-60"
        >
          Elegir del teléfono
        </button>
      </div>

      <p className="mt-2 text-[12px] text-muted-foreground">
        {lleno
          ? `Llegaste al máximo de ${MAXIMO} fotos.`
          : "La cámara se vuelve a abrir sola para la siguiente foto."}
      </p>
    </div>
  );
}
