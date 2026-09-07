"use client";

import { useState } from "react";
import { FormularioVehiculo } from "@/app/panel/vehiculos/formulario";
import { Button } from "@/components/ui/button";

const campo =
  "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30";

export type VehiculoOpcion = {
  id: string;
  patente: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  color: string | null;
};

function descripcion(v: VehiculoOpcion) {
  return [v.marca, v.modelo, v.anio].filter(Boolean).join(" ");
}

/**
 * Buscador + crear vehículo al vuelo — mismo patrón que BuscadorCliente.
 * Busca entre los vehículos ya registrados del taller; "+ Nuevo
 * vehículo" abre el formulario real de /panel/vehiculos en un modal
 * (solo la sección "El vehículo" — el dueño ya se registra aparte, en
 * Cliente).
 */
export function BuscadorVehiculo({
  vehiculos,
  seleccionado,
  onSeleccionar,
  tieneImpresion,
}: {
  vehiculos: VehiculoOpcion[];
  seleccionado: VehiculoOpcion | null;
  onSeleccionar: (vehiculo: VehiculoOpcion | null) => void;
  /** Plan Serviteca: el formulario real autocompleta por patente vía GetAPI. */
  tieneImpresion: boolean;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);

  const q = busqueda.trim().toLowerCase();
  const filtrados = q
    ? vehiculos.filter(
        (v) =>
          v.patente.toLowerCase().includes(q) ||
          descripcion(v).toLowerCase().includes(q)
      )
    : vehiculos;

  if (seleccionado) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-mono text-[14px] font-medium">
              {seleccionado.patente}
            </p>
            <p className="text-[12px] text-muted-foreground">
              {[descripcion(seleccionado), seleccionado.color]
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
            placeholder="Buscar por patente…"
            autoCapitalize="characters"
            className={`${campo} pl-9 font-mono uppercase`}
          />
        </div>
        <Button type="button" onClick={() => setCreando(true)} className="shrink-0">
          + Nuevo vehículo
        </Button>
      </div>

      {busqueda.trim() && (
        <ul className="mt-2 flex max-h-48 flex-col gap-1 overflow-y-auto rounded-lg border border-border bg-card p-1">
          {filtrados.length === 0 && (
            <li className="py-4 text-center text-[13px] text-muted-foreground">
              Ningún vehículo coincide con esa búsqueda.
            </li>
          )}
          {filtrados.slice(0, 20).map((v) => (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => onSeleccionar(v)}
                className="flex w-full flex-col rounded-lg px-3 py-2 text-left transition-colors hover:bg-background"
              >
                <span className="font-mono text-[14px] font-medium">
                  {v.patente}
                </span>
                {descripcion(v) && (
                  <span className="text-[12px] text-muted-foreground">
                    {descripcion(v)}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {creando && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            aria-label="Cancelar"
            onClick={() => setCreando(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div
            role="dialog"
            aria-modal
            className="scroll-discreto relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-border bg-card p-6 sm:p-8"
          >
            <h2 className="text-lg font-medium">Nuevo vehículo</h2>
            <div className="mt-6">
              <FormularioVehiculo
                key={busqueda}
                tieneImpresion={tieneImpresion}
                soloVehiculo
                patenteInicial={busqueda}
                onListo={() => setCreando(false)}
                onCreado={(patente) =>
                  onSeleccionar({
                    id: "",
                    patente,
                    marca: null,
                    modelo: null,
                    anio: null,
                    color: null,
                  })
                }
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
