"use client";

import { useState } from "react";
import {
  agregarProcedimiento,
  editarProcedimiento,
  quitarProcedimiento,
  type Procedimiento,
} from "@/app/panel/ordenes/acciones";
import { pesos, miles, soloDigitos } from "@/lib/formato";

/**
 * Lo que se va haciendo, línea por línea, con su costo — pedido real
 * de Tío Lalo: cambia algo (ej. "cambio de embrague"), anota mano de
 * obra + repuesto de esa línea, y ve el total acumulado del cliente
 * sin esperar a cerrar la orden. Hace de CRUD completo: agregar, y
 * hacer clic en una línea existente la carga acá arriba para
 * corregirla (el botón pasa a "Guardar cambios") o quitarla.
 *
 * Compartido entre el formulario de cierre (/panel/ordenes/[id]) y
 * el modal de corrección de órdenes ya cerradas (EditarDescripcion
 * en lista.tsx) — mismo componente, dos lugares donde se anota qué
 * se hizo.
 */
export function Procedimientos({
  ordenId,
  items,
  onCambio,
  mostrarTotal = true,
}: {
  ordenId: string;
  items: Procedimiento[];
  onCambio: React.Dispatch<React.SetStateAction<Procedimiento[]>>;
  /** El formulario de cierre (/panel/ordenes/[id]) muestra su propio
   * total fusionado con el cobro — evita mostrarlo dos veces. */
  mostrarTotal?: boolean;
}) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [manoObra, setManoObra] = useState("");
  const [repuestoNombre, setRepuestoNombre] = useState("");
  const [repuesto, setRepuesto] = useState("");

  const total = items.reduce((s, p) => s + p.manoObra + p.repuesto, 0);

  function limpiar() {
    setEditandoId(null);
    setDescripcion("");
    setManoObra("");
    setRepuesto("");
    setRepuestoNombre("");
  }

  function editar(p: Procedimiento) {
    setEditandoId(p.id);
    setDescripcion(p.descripcion);
    setManoObra(p.manoObra ? String(p.manoObra) : "");
    setRepuesto(p.repuesto ? String(p.repuesto) : "");
    setRepuestoNombre(p.repuestoNombre ?? "");
  }

  async function guardar() {
    if (!descripcion.trim()) return;
    if (!Number(manoObra) && !Number(repuesto)) return;
    const datos = {
      descripcion: descripcion.trim(),
      manoObra,
      repuesto,
      repuestoNombre,
    };
    const optimista: Procedimiento = {
      id: editandoId ?? `tmp-${crypto.randomUUID()}`,
      descripcion: datos.descripcion,
      manoObra: Number(datos.manoObra) || 0,
      repuesto: Number(datos.repuesto) || 0,
      repuestoNombre: datos.repuestoNombre.trim() || null,
    };
    // Optimista: se ve en la tarjeta al instante, sin esperar al
    // servidor — la respuesta real solo confirma o corrige el id.
    onCambio(
      editandoId
        ? items.map((p) => (p.id === editandoId ? optimista : p))
        : [...items, optimista]
    );
    limpiar();

    const res = editandoId
      ? await editarProcedimiento(editandoId, datos)
      : await agregarProcedimiento(ordenId, datos);
    if (res?.ok && res.item) {
      onCambio((actuales) =>
        actuales.map((p) => (p.id === optimista.id ? res.item : p))
      );
    }
  }

  async function quitar(id: string) {
    onCambio(items.filter((p) => p.id !== id));
    if (editandoId === id) limpiar();
    await quitarProcedimiento(id);
  }

  const campo =
    "w-full rounded-lg border border-border bg-card px-3 py-2 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30";

  return (
    <div>
      {items.length > 0 && (
        <ul className="mb-2 flex flex-col gap-1.5">
          {items.map((p) => (
            <li
              key={p.id}
              className={`flex items-center gap-2 rounded-lg border transition-colors ${
                editandoId === p.id
                  ? "border-primary/60 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <button
                type="button"
                onClick={() => editar(p)}
                className="flex min-w-0 flex-1 items-baseline gap-2 rounded-lg py-2 pl-3 text-left text-[14px] hover:bg-background"
              >
                <span className="min-w-0 flex-1 truncate">
                  {p.descripcion}
                  {p.repuestoNombre && (
                    <span className="text-muted-foreground">
                      {" "}
                      · {p.repuestoNombre}
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {pesos(p.manoObra + p.repuesto)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => quitar(p.id)}
                aria-label="Quitar"
                className="shrink-0 px-2 py-2 text-muted-foreground hover:text-destructive"
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
      )}

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Cambio de pastillas delanteras y rectificado de discos"
          rows={1}
          className={`${campo} resize-y`}
        />
        <input
          value={miles(manoObra)}
          onChange={(e) => setManoObra(soloDigitos(e.target.value))}
          placeholder="Mano de obra"
          inputMode="numeric"
          className={`${campo} sm:w-32`}
        />
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <input
          value={repuestoNombre}
          onChange={(e) => setRepuestoNombre(e.target.value)}
          placeholder="Repuesto comprado (ej. pastillas delanteras)"
          className={campo}
        />
        <input
          value={miles(repuesto)}
          onChange={(e) => setRepuesto(soloDigitos(e.target.value))}
          placeholder="Precio repuesto"
          inputMode="numeric"
          className={`${campo} sm:w-32`}
        />
      </div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={!descripcion.trim()}
          className="flex-1 rounded-lg bg-primary px-4 py-2 text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 sm:flex-none"
        >
          {editandoId ? "Guardar cambios" : "Agregar"}
        </button>
        {editandoId && (
          <button
            type="button"
            onClick={limpiar}
            className="rounded-lg border border-border px-4 py-2 text-[14px] transition-colors hover:bg-card"
          >
            Cancelar
          </button>
        )}
      </div>

      {mostrarTotal && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <span className="text-[14px] text-muted-foreground">
            Lleva gastado
          </span>
          <span className="text-xl font-semibold tabular-nums text-primary">
            {pesos(total)}
          </span>
        </div>
      )}
    </div>
  );
}
