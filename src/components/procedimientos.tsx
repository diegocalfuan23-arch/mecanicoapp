"use client";

import { useState } from "react";
import {
  agregarProcedimiento,
  editarProcedimiento,
  quitarProcedimiento,
  type Procedimiento,
} from "@/app/panel/ordenes/acciones";
import { pesos } from "@/lib/formato";

const MILES = new Intl.NumberFormat("es-CL");

/**
 * Un último número en la línea es el monto; el resto es la
 * descripción. "Cambio radiador 35000" -> "Cambio radiador" +
 * $35.000. Sin número al final, la línea entera es descripción sin
 * costo (monto 0).
 */
function parsearLinea(linea: string): { descripcion: string; manoObra: string } {
  const match = linea.match(/^(.*?)[\s.]*([\d.]{2,})\s*$/);
  if (!match) return { descripcion: linea.trim(), manoObra: "" };
  const monto = match[2].replace(/\./g, "");
  return { descripcion: match[1].trim(), manoObra: monto };
}

/**
 * Suma los montos de cada línea y arma una descripción legible de
 * todo el bloque: "cambio radiador 40000\nsacar culata 300000" ->
 * descripción "cambio radiador, sacar culata" + $340.000.
 */
function parsearBloque(texto: string) {
  const lineas = texto.split("\n").map(parsearLinea).filter((l) => l.descripcion);
  return {
    descripcion: lineas.map((l) => l.descripcion).join(", "),
    manoObra: lineas.reduce((s, l) => s + (Number(l.manoObra) || 0), 0),
  };
}

/**
 * Lo que se va haciendo, en tarjetas — pedido real de Tío Lalo
 * (video + feedback posterior): un cuadro donde escribe varios
 * procesos de un tirón ("cambio de sigüeñal 800000", Enter, "cambio
 * de radiador 120000"), y al salir del cuadro TODO ese texto se
 * guarda junto como una sola tarjeta, sumando los montos de cada
 * línea — no una tarjeta por línea. Cada tarjeta se puede tocar para
 * reabrir su texto completo y seguir agregando o corrigiendo, o
 * eliminarla entera.
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
  const [texto, setTexto] = useState("");

  const total = items.reduce((s, p) => s + p.manoObra + p.repuesto, 0);

  function limpiar() {
    setEditandoId(null);
    setTexto("");
  }

  function editar(p: Procedimiento) {
    setEditandoId(p.id);
    // El desglose por línea ya se perdió al fusionar en una tarjeta
    // — se reabre como descripción + total en una línea; si hace
    // falta reordenar en varias líneas de nuevo, se hace a mano.
    setTexto(
      p.manoObra ? `${p.descripcion} ${MILES.format(p.manoObra)}` : p.descripcion
    );
  }

  async function guardar() {
    const { descripcion, manoObra } = parsearBloque(texto);
    if (!descripcion) {
      limpiar();
      return;
    }

    const datos = {
      descripcion,
      manoObra: String(manoObra),
      repuesto: "",
      repuestoNombre: "",
    };
    const optimista: Procedimiento = {
      id: editandoId ?? `tmp-${crypto.randomUUID()}`,
      descripcion,
      manoObra,
      repuesto: 0,
      repuestoNombre: null,
    };
    // Optimista: la tarjeta aparece al instante, sin esperar al
    // servidor — la respuesta real solo confirma o corrige el id.
    onCambio((actuales) =>
      editandoId
        ? actuales.map((p) => (p.id === editandoId ? optimista : p))
        : [...actuales, optimista]
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
    onCambio((actuales) => actuales.filter((p) => p.id !== id));
    if (editandoId === id) limpiar();
    await quitarProcedimiento(id);
  }

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

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={guardar}
        placeholder={"Cambio radiador 40000\nSacar culata 300000"}
        rows={3}
        className="w-full resize-y rounded-lg border border-border bg-card px-3 py-2 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[12px] text-muted-foreground">
          Una línea por trabajo, con el monto al final — se suman y
          quedan como una sola tarjeta.
        </p>
        {editandoId && (
          <button
            type="button"
            onClick={limpiar}
            className="shrink-0 text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
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
