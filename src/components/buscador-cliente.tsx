"use client";

import { useState } from "react";
import { Formulario } from "@/app/panel/propietarios/tabla";
import { Button } from "@/components/ui/button";

const campo =
  "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30";

export type ClienteOpcion = {
  id: string;
  nombre: string;
  apellido: string | null;
  rut: string | null;
  telefono: string | null;
  email: string | null;
};

function nombreCompleto(c: ClienteOpcion) {
  return [c.nombre, c.apellido].filter(Boolean).join(" ");
}

/**
 * Buscador + crear cliente al vuelo — usado donde una venta u orden
 * necesita quedar asociada a un cliente real de Propietarios, no a
 * texto suelto. "Agregar cliente" (afuera, en el padre) abre directo
 * el modal de registro con el formulario completo de Propietarios —
 * buscar uno ya existente queda como opción secundaria, detrás de un
 * link, para el caso de un cliente que vuelve.
 */
export function BuscadorCliente({
  clientes,
  seleccionado,
  onSeleccionar,
  tieneImpresion,
  abrirCreacion,
  onCreacionAbierta,
}: {
  clientes: ClienteOpcion[];
  seleccionado: ClienteOpcion | null;
  onSeleccionar: (cliente: ClienteOpcion | null) => void;
  /** Plan Serviteca: el formulario completo agrega email, dirección, empresa/RUT. */
  tieneImpresion: boolean;
  /** El padre pide abrir el modal de creación (ej. al pulsar "Agregar cliente"). */
  abrirCreacion?: boolean;
  /** Avisa al padre que ya se hizo cargo de la señal de abrirCreacion. */
  onCreacionAbierta?: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [creandoLocal, setCreandoLocal] = useState(false);

  // El padre puede pedir abrir el modal directo (ej. al pulsar
  // "Agregar cliente" arriba del carrito); una vez mostrado, se avisa
  // para que baje la señal y no se vuelva a abrir solo. El propio
  // componente también puede abrirlo desde el botón interno.
  const creando = abrirCreacion || creandoLocal;

  function cerrarCreacion() {
    setCreandoLocal(false);
    if (abrirCreacion) onCreacionAbierta?.();
  }

  const q = busqueda.trim().toLowerCase();
  const filtrados = q
    ? clientes.filter(
        (c) =>
          nombreCompleto(c).toLowerCase().includes(q) ||
          c.rut?.toLowerCase().includes(q) ||
          c.telefono?.includes(q)
      )
    : clientes;

  if (seleccionado) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium">
              {nombreCompleto(seleccionado)}
            </p>
            <p className="text-[12px] text-muted-foreground">
              {[seleccionado.rut, seleccionado.telefono]
                .filter(Boolean)
                .join(" · ") || "Sin más datos registrados"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSeleccionar(null)}
            className="shrink-0 text-[12px] text-muted-foreground hover:text-destructive"
          >
            Cambiar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {buscando ? (
        <>
          <div className="relative">
            <svg
              viewBox="0 0 20 20"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            >
              <path
                d="M9 15A6 6 0 109 3a6 6 0 000 12zM13.5 13.5L17 17"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar cliente por nombre, RUT o teléfono…"
              autoFocus
              className={`${campo} pl-9`}
            />
          </div>

          <ul className="mt-2 flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-border bg-card p-1">
            {filtrados.length === 0 && (
              <li className="py-4 text-center text-[13px] text-muted-foreground">
                {q ? "Nadie coincide con esa búsqueda." : "Escribe para buscar."}
              </li>
            )}
            {q &&
              filtrados.slice(0, 20).map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onSeleccionar(c)}
                    className="flex w-full flex-col rounded-lg px-3 py-2 text-left transition-colors hover:bg-background"
                  >
                    <span className="text-[14px] font-medium">
                      {nombreCompleto(c)}
                    </span>
                    {(c.rut || c.telefono) && (
                      <span className="text-[12px] text-muted-foreground">
                        {[c.rut, c.telefono].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </button>
                </li>
              ))}
          </ul>

          <button
            type="button"
            onClick={() => setBuscando(false)}
            className="mt-2 text-[13px] text-muted-foreground hover:underline"
          >
            Cancelar búsqueda
          </button>
        </>
      ) : (
        <>
          <Button type="button" onClick={() => setCreandoLocal(true)}>
            + Registrar cliente
          </Button>
          <button
            type="button"
            onClick={() => setBuscando(true)}
            className="ml-3 text-[13px] text-muted-foreground hover:underline"
          >
            o buscar uno existente
          </button>
        </>
      )}

      {creando && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            aria-label="Cancelar"
            onClick={cerrarCreacion}
            className="absolute inset-0 bg-black/60"
          />
          <div
            role="dialog"
            aria-modal
            className="scroll-discreto relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-border bg-card p-6 sm:p-8"
          >
            <h2 className="text-lg font-medium">Nuevo cliente</h2>
            <div className="mt-6">
              <Formulario
                tieneImpresion={tieneImpresion}
                onListo={cerrarCreacion}
                onCreado={onSeleccionar}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
