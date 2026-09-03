"use client";

import { useEffect, useRef, useState } from "react";
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
  const [guardando, setGuardando] = useState(false);
  // true entre que se escribe algo y que ese algo queda persistido —
  // distingue "guardando" (petición en curso) de "hay texto que el
  // debounce todavía no mandó a guardar".
  const [sinGuardar, setSinGuardar] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Fila donde se va guardando el autoguardado en background,
  // distinta de editandoId (que es para reabrir una tarjeta YA
  // confirmada). Se crea la primera vez que hay texto y se
  // actualiza (nunca duplica) mientras el mecánico sigue escribiendo.
  const borradorIdRef = useRef<string | null>(null);

  const total = items.reduce((s, p) => s + p.manoObra + p.repuesto, 0);

  function limpiar() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setEditandoId(null);
    setTexto("");
    setSinGuardar(false);
    borradorIdRef.current = null;
  }

  function editar(p: Procedimiento) {
    setEditandoId(p.id);
    borradorIdRef.current = p.id;
    // El desglose por línea ya se perdió al fusionar en una tarjeta
    // — se reabre como descripción + total en una línea; si hace
    // falta reordenar en varias líneas de nuevo, se hace a mano.
    setTexto(
      p.manoObra ? `${p.descripcion} ${MILES.format(p.manoObra)}` : p.descripcion
    );
  }

  async function guardarBorrador() {
    const { descripcion, manoObra } = parsearBloque(texto);
    if (!descripcion) return;

    const datos = {
      descripcion,
      manoObra: String(manoObra),
      repuesto: "",
      repuestoNombre: "",
    };
    const idActual = borradorIdRef.current;
    const optimista: Procedimiento = {
      id: idActual ?? `tmp-${crypto.randomUUID()}`,
      descripcion,
      manoObra,
      repuesto: 0,
      repuestoNombre: null,
    };
    onCambio((actuales) =>
      idActual
        ? actuales.map((p) => (p.id === idActual ? optimista : p))
        : [...actuales, optimista]
    );

    setGuardando(true);
    const res = idActual
      ? await editarProcedimiento(idActual, datos)
      : await agregarProcedimiento(ordenId, datos);
    setGuardando(false);
    setSinGuardar(false);
    if (res?.ok && res.item) {
      borradorIdRef.current = res.item.id;
      setEditandoId((actual) => (actual ? res.item!.id : actual));
      onCambio((actuales) =>
        actuales.map((p) => (p.id === optimista.id ? res.item! : p))
      );
    }
  }

  // Guardar solo con onBlur no bastaba: si el mecánico sale de la
  // pantalla sin tocar afuera del campo primero (botón atrás, cerrar
  // la app), el texto escrito se perdía entero sin ningún aviso —
  // bug real reportado por Tío Lalo (orden con texto escrito, cero
  // procedimientos guardados). Este efecto persiste el texto solo,
  // 1.5s después de que el mecánico deja de escribir, SIN limpiar el
  // campo ni convertirlo en tarjeta — eso solo pasa al confirmar
  // (onBlur o Enter), para no borrarle el texto de encima mientras
  // sigue escribiendo.
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!texto.trim()) return;
    timerRef.current = setTimeout(() => {
      guardarBorrador();
    }, 1500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  // Confirmar (perder el foco, o Enter): igual que el autoguardado,
  // pero además limpia el campo y deja el texto convertido en
  // tarjeta — el punto en que el mecánico "termina" esa nota.
  async function confirmar() {
    if (timerRef.current) clearTimeout(timerRef.current);
    await guardarBorrador();
    limpiar();
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
        onChange={(e) => {
          setTexto(e.target.value);
          if (e.target.value.trim()) setSinGuardar(true);
        }}
        onBlur={confirmar}
        placeholder={"Ej: cambio radiador 40000\n(esto es solo un ejemplo, escribe aquí)"}
        rows={3}
        className="w-full resize-y rounded-lg border border-border bg-card px-3 py-2 text-[14px] outline-none placeholder:text-muted-foreground/30 placeholder:italic focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[12px] text-muted-foreground">
          {texto.trim()
            ? "Una línea por trabajo, con el monto al final — se suman y quedan como una sola tarjeta."
            : "Vacío por ahora: escribe aquí lo que hiciste, con el monto al final de cada línea."}
          {guardando && " · Guardando…"}
          {!guardando && sinGuardar && " · Sin guardar aún"}
          {!guardando && !sinGuardar && texto.trim() && " · Guardado"}
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
