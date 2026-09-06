"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { guardarPropietario } from "@/app/panel/propietarios/acciones";

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
 * texto suelto. "Crear nuevo" solo pide nombre y teléfono (lo mínimo
 * para identificarlo); el resto (RUT, dirección, notas...) se completa
 * después en su ficha, en Propietarios.
 */
export function BuscadorCliente({
  clientes,
  seleccionado,
  onSeleccionar,
}: {
  clientes: ClienteOpcion[];
  seleccionado: ClienteOpcion | null;
  onSeleccionar: (cliente: ClienteOpcion | null) => void;
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState("");
  const [telefonoNuevo, setTelefonoNuevo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const q = busqueda.trim().toLowerCase();
  const filtrados = q
    ? clientes.filter(
        (c) =>
          nombreCompleto(c).toLowerCase().includes(q) ||
          c.rut?.toLowerCase().includes(q) ||
          c.telefono?.includes(q)
      )
    : clientes;

  async function crear() {
    if (!nombreNuevo.trim()) return;
    setError(null);
    setGuardando(true);
    const res = await guardarPropietario({
      nombre: nombreNuevo,
      telefono: telefonoNuevo,
      trato: "normal",
    });
    setGuardando(false);

    if (res?.error || !res?.id) {
      setError(res?.error ?? "No se pudo crear el cliente.");
      return;
    }

    onSeleccionar({
      id: res.id,
      nombre: nombreNuevo.trim(),
      apellido: null,
      rut: null,
      telefono: telefonoNuevo.trim() || null,
      email: null,
    });
    setCreando(false);
    setNombreNuevo("");
    setTelefonoNuevo("");
    router.refresh();
  }

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

  if (creando) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[13px] font-medium">Nuevo cliente</span>
          <button
            type="button"
            onClick={() => setCreando(false)}
            className="text-[12px] text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
            placeholder="Nombre del cliente"
            autoFocus
            className={campo}
          />
          <input
            value={telefonoNuevo}
            onChange={(e) => setTelefonoNuevo(e.target.value)}
            placeholder="Teléfono"
            inputMode="tel"
            className={campo}
          />
        </div>
        <p className="mt-2 text-[12px] text-muted-foreground">
          RUT, dirección y el resto se completan después en su ficha, en
          Propietarios.
        </p>
        {error && (
          <p className="mt-2 text-[12px] text-destructive" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={crear}
          disabled={!nombreNuevo.trim() || guardando}
          className="mt-3 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Crear y seleccionar"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
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

      <ul className="mt-3 flex max-h-48 flex-col gap-1 overflow-y-auto">
        {filtrados.length === 0 && (
          <li className="py-4 text-center text-[13px] text-muted-foreground">
            {clientes.length === 0
              ? "Todavía no hay clientes registrados."
              : "Nadie coincide con esa búsqueda."}
          </li>
        )}
        {filtrados.slice(0, 20).map((c) => (
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
        onClick={() => {
          setCreando(true);
          setNombreNuevo(busqueda);
        }}
        className="mt-2 text-[13px] text-acento hover:underline"
      >
        + Crear cliente nuevo
      </button>
    </div>
  );
}
