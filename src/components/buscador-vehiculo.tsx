"use client";

import { useState } from "react";
import { FormularioVehiculo } from "@/app/panel/vehiculos/formulario";
import { Button } from "@/components/ui/button";

const campo =
  "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30";

/**
 * Input de patente + crear vehículo al vuelo — usado donde una venta
 * necesita la patente del auto, sin forzar a pasar por /panel/vehiculos.
 * "+ Nuevo vehículo" abre el mismo formulario real (solo la sección
 * "El vehículo" — el dueño ya se registra aparte, en Cliente) y al
 * guardar completa la patente acá mismo.
 */
export function BuscadorVehiculo({
  patente,
  onPatenteChange,
  tieneImpresion,
}: {
  patente: string;
  onPatenteChange: (patente: string) => void;
  /** Plan Serviteca: autocompleta por patente vía GetAPI. */
  tieneImpresion: boolean;
}) {
  const [creando, setCreando] = useState(false);

  return (
    <>
      <div className="flex gap-2">
        <input
          value={patente}
          onChange={(e) => onPatenteChange(e.target.value)}
          placeholder="Patente"
          autoCapitalize="characters"
          className={`${campo} flex-1 font-mono uppercase`}
        />
        <Button type="button" onClick={() => setCreando(true)} className="shrink-0">
          + Nuevo vehículo
        </Button>
      </div>

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
                tieneImpresion={tieneImpresion}
                soloVehiculo
                patenteInicial={patente}
                onListo={() => setCreando(false)}
                onCreado={onPatenteChange}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
