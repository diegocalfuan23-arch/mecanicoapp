"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { crearProveedor } from "@/app/panel/compras/acciones";

const campo =
  "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30";

export type ProveedorOpcion = {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
};

export function ModalNuevoProveedor({
  onCerrar,
  onCreado,
}: {
  onCerrar: () => void;
  onCreado?: (proveedor: { id: string; nombre: string }) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [documento, setDocumento] = useState("");
  const [giro, setGiro] = useState("");
  const [direccion, setDireccion] = useState("");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function guardar() {
    setError(null);
    setEnviando(true);
    const res = await crearProveedor({
      nombre,
      email,
      telefono,
      documento,
      giro,
      direccion,
      notas,
    });
    setEnviando(false);
    if (!res?.ok) {
      setError(res?.error || "No se pudo crear el proveedor.");
      return;
    }
    onCreado?.({ id: res.id, nombre: res.nombre });
    onCerrar();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        aria-label="Cancelar"
        onClick={onCerrar}
        className="absolute inset-0 bg-black/60"
      />
      <div
        role="dialog"
        aria-modal
        className="scroll-discreto relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-6 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-medium">Nuevo proveedor</h2>
          <button
            aria-label="Cerrar"
            onClick={onCerrar}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <h3 className="mt-6 text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          Datos generales
        </h3>

        <div className="mt-3 flex flex-col gap-4">
          <div>
            <span className="mb-2 block text-[13px] font-medium">Nombre</span>
            <Input value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
          </div>
          <div>
            <span className="mb-2 block text-[13px] font-medium">Email</span>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <span className="mb-2 block text-[13px] font-medium">Teléfono</span>
            <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </div>
          <div>
            <span className="mb-2 block text-[13px] font-medium">
              Documento / RUT
            </span>
            <Input value={documento} onChange={(e) => setDocumento(e.target.value)} />
          </div>
          <div>
            <span className="mb-2 block text-[13px] font-medium">
              Giro / actividad económica
            </span>
            <Input value={giro} onChange={(e) => setGiro(e.target.value)} />
          </div>
          <div>
            <span className="mb-2 block text-[13px] font-medium">Dirección</span>
            <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </div>
          <div>
            <span className="mb-2 block text-[13px] font-medium">Notas</span>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 text-[13px] text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="button" onClick={guardar} disabled={enviando}>
            {enviando ? "Creando…" : "Crear"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Buscador + crear proveedor al vuelo — mismo patrón que
 * BuscadorCliente. A diferencia de Cliente, "sin registro" es una
 * opción válida y explícita acá (campo aparte de texto libre en el
 * formulario de Compra), no solo un estado transitorio antes de crear.
 */
export function BuscadorProveedor({
  proveedores,
  seleccionado,
  onSeleccionar,
}: {
  proveedores: ProveedorOpcion[];
  seleccionado: ProveedorOpcion | null;
  onSeleccionar: (proveedor: ProveedorOpcion | null) => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);

  const q = busqueda.trim().toLowerCase();
  const filtrados = q
    ? proveedores.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.telefono?.includes(q)
      )
    : proveedores;

  if (seleccionado) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium">{seleccionado.nombre}</p>
            <p className="text-[12px] text-muted-foreground">
              {[seleccionado.email, seleccionado.telefono]
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
      <div className="flex gap-2">
        <div className="relative flex-1">
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
            placeholder="Buscar proveedor…"
            className={`${campo} pl-9`}
          />
        </div>
        <Button type="button" onClick={() => setCreando(true)} className="shrink-0">
          + Nuevo proveedor
        </Button>
      </div>

      {busqueda.trim() && (
        <ul className="mt-2 flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-border bg-card p-1">
          {filtrados.length === 0 && (
            <li className="py-4 text-center text-[13px] text-muted-foreground">
              Nadie coincide con esa búsqueda.
            </li>
          )}
          {filtrados.slice(0, 20).map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSeleccionar(p)}
                className="flex w-full flex-col rounded-lg px-3 py-2 text-left transition-colors hover:bg-background"
              >
                <span className="text-[14px] font-medium">{p.nombre}</span>
                {(p.email || p.telefono) && (
                  <span className="text-[12px] text-muted-foreground">
                    {[p.email, p.telefono].filter(Boolean).join(" · ")}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {creando && (
        <ModalNuevoProveedor
          onCerrar={() => setCreando(false)}
          onCreado={(p) => onSeleccionar({ id: p.id, nombre: p.nombre, email: null, telefono: null })}
        />
      )}
    </>
  );
}
