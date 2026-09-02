"use client";

import { useEffect, useRef, useState } from "react";
import {
  reemplazarProcedimientos,
  type Procedimiento,
} from "@/app/panel/ordenes/acciones";
import { pesos } from "@/lib/formato";

const MILES = new Intl.NumberFormat("es-CL");

/**
 * Un último número en la línea es el monto de esa línea; el resto es
 * la descripción. "Cambio radiador 35000" -> "Cambio radiador" +
 * $35.000. Sin número al final, la línea entera es descripción sin
 * costo (monto 0).
 */
function parsearLinea(linea: string): { descripcion: string; manoObra: string } {
  const match = linea.match(/^(.*?)[\s.]*([\d.]{2,})\s*$/);
  if (!match) return { descripcion: linea.trim(), manoObra: "" };
  const monto = match[2].replace(/\./g, "");
  return { descripcion: match[1].trim(), manoObra: monto };
}

function lineasATexto(items: Procedimiento[]) {
  return items
    .map((p) =>
      p.manoObra
        ? `${p.descripcion} ${MILES.format(p.manoObra)}`
        : p.descripcion
    )
    .join("\n");
}

/**
 * Formatea con puntos de miles solo el número al final de cada
 * línea, sin tocar el resto del texto — "cambio radiador 40000" se
 * ve "cambio radiador 40.000" mientras se escribe.
 */
function formatearMontos(texto: string) {
  return texto
    .split("\n")
    .map((linea) => {
      const { descripcion, manoObra } = parsearLinea(linea);
      if (!manoObra) return linea;
      return `${descripcion} ${MILES.format(Number(manoObra))}`;
    })
    .join("\n");
}

/**
 * Lo que se va haciendo, todo en un solo cuadro de texto — pedido
 * real de Tío Lalo (video): una línea por trabajo, con el monto al
 * final ("Cambio radiador 35000"), sin campos separados de
 * descripción/mano de obra/repuesto que llenar uno por uno.
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
  const [texto, setTexto] = useState(() => lineasATexto(items));
  const [guardando, setGuardando] = useState(false);
  // items llega vacío en el primer render (procedimientosDeOrden es
  // async) y se completa después — sin esto, el useState inicial de
  // arriba nunca se vuelve a evaluar y el cuadro queda vacío aunque
  // ya hubiera procedimientos guardados. Solo sincroniza una vez, y
  // no si el usuario ya está escribiendo (evita pisarle el texto).
  const yaSincronizado = useRef(false);
  useEffect(() => {
    if (yaSincronizado.current) return;
    if (items.length === 0) return;
    yaSincronizado.current = true;
    setTexto(lineasATexto(items));
  }, [items]);

  // Suma en vivo mientras se escribe, antes de guardar nada — el
  // total responde al tipeo, no solo después de perder el foco.
  const totalEnVivo = texto
    .split("\n")
    .reduce((s, l) => s + (Number(parsearLinea(l).manoObra) || 0), 0);

  async function guardar() {
    // Puntos de miles en el monto al perder el foco — no en cada
    // tecla, para no saltarle el cursor al mecánico mientras escribe.
    setTexto(formatearMontos(texto));

    const lineas = texto
      .split("\n")
      .map(parsearLinea)
      .filter((l) => l.descripcion);

    // Optimista: el total ya se ve arriba mientras escribe; acá solo
    // falta que la lista de procedimientos (usada por Mano de
    // obra/Repuestos en el cierre) refleje lo mismo sin esperar al
    // servidor.
    onCambio(
      lineas.map((l) => ({
        id: `tmp-${crypto.randomUUID()}`,
        descripcion: l.descripcion,
        manoObra: Number(l.manoObra) || 0,
        repuesto: 0,
        repuestoNombre: null,
      }))
    );

    setGuardando(true);
    const res = await reemplazarProcedimientos(ordenId, lineas);
    setGuardando(false);
    if (res?.ok && res.items) onCambio(res.items);
  }

  return (
    <div>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={guardar}
        placeholder={"Cambio radiador 35000\nSacar culata 300000"}
        rows={5}
        className="w-full resize-y rounded-lg border border-border bg-card px-3 py-2 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
      />
      <p className="mt-1 text-[12px] text-muted-foreground">
        Una línea por trabajo, con el monto al final.
      </p>

      {mostrarTotal && (
        <div className="mt-3 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
          <span className="text-[14px] text-muted-foreground">
            Lleva gastado{guardando ? " · guardando…" : ""}
          </span>
          <span className="text-xl font-semibold tabular-nums text-primary">
            {pesos(totalEnVivo)}
          </span>
        </div>
      )}
    </div>
  );
}
