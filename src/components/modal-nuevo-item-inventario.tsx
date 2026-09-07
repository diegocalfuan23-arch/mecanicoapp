"use client";

import { useState } from "react";
import {
  Formulario,
  FormularioServicio,
} from "@/app/panel/inventario/tabla";

const ETIQUETA_TIPO: Record<"repuesto" | "servicio" | "mano_obra", string> = {
  repuesto: "Repuesto/producto",
  servicio: "Servicio",
  mano_obra: "Mano de obra",
};

/**
 * Modal "Nuevo ítem de inventario" reutilizable fuera de Inventario —
 * mismas tabs de tipo (Repuesto/Servicio/Mano de obra) y los mismos
 * formularios ya construidos ahí, para crear un ítem al vuelo desde
 * donde haga falta (ej. el catálogo de Ventas POS).
 */
export function ModalNuevoItemInventario({
  onCerrar,
  tipoInicial = "repuesto",
}: {
  onCerrar: () => void;
  tipoInicial?: "repuesto" | "servicio" | "mano_obra";
}) {
  const [tipo, setTipo] = useState<"repuesto" | "servicio" | "mano_obra">(
    tipoInicial
  );

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
        className="scroll-discreto relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-border bg-card p-6 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-medium">Nuevo ítem de inventario</h2>
          <button
            aria-label="Cerrar"
            onClick={onCerrar}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex gap-1 rounded-lg border border-border p-1">
          {(["repuesto", "servicio", "mano_obra"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`flex-1 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                tipo === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {ETIQUETA_TIPO[t]}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tipo === "repuesto" ? (
            <Formulario onListo={onCerrar} enModal />
          ) : (
            <FormularioServicio tipo={tipo} onListo={onCerrar} enModal />
          )}
        </div>
      </div>
    </div>
  );
}
