"use client";

import { useEffect, useRef, useState } from "react";
import { miles, soloDigitos, pesos } from "@/lib/formato";
import type { RepuestoUsado } from "@/app/panel/ordenes/acciones";

type InsumoInventario = {
  id: string;
  nombre: string;
  codigo: string | null;
  marca: string | null;
  stock: number;
  costo: number;
  precio: number;
};

export const repuestoVacio = (): RepuestoUsado => ({
  nombre: "",
  codigo: "",
  cantidad: "1",
  costo: "",
  precio: "",
  donde: "",
  parteId: null,
});

/**
 * Buscador siempre visible, arriba de la tabla — antes solo existía un
 * campo de texto por fila, escondido detrás de "Agregar repuesto": si
 * no se tocaba ese botón primero, no había ningún lugar donde buscar
 * el inventario, y parecía que el buscador no funcionaba. Elegir un
 * insumo o escribir uno nuevo agrega la fila ya completa.
 *
 * Dropdown propio con position:fixed calculado a mano (no
 * @base-ui/react/autocomplete): en uso real el Autocomplete no abría
 * la lista de forma confiable. Con estado explícito (abierto/cerrado
 * que yo controlo) y position:fixed anclado al input via
 * getBoundingClientRect, el comportamiento es predecible y no depende
 * de la lógica interna de un componente de terceros — mismo criterio
 * que ya resolvió el dropdown de la tabla de vehículos (fixed, no
 * absolute, para no quedar recortado por el overflow-x-auto de la
 * tabla que lo contiene).
 */
function BuscadorRepuesto({
  inventario,
  onAgregar,
}: {
  inventario: InsumoInventario[];
  onAgregar: (repuesto: RepuestoUsado) => void;
}) {
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const coincidencias = texto.trim()
    ? inventario.filter((i) =>
        i.nombre.toLowerCase().includes(texto.trim().toLowerCase())
      )
    : inventario;

  function actualizarPosicion() {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, width: r.width });
  }

  function abrir() {
    actualizarPosicion();
    setAbierto(true);
  }

  useEffect(() => {
    if (!abierto) return;
    window.addEventListener("scroll", actualizarPosicion, true);
    window.addEventListener("resize", actualizarPosicion);
    return () => {
      window.removeEventListener("scroll", actualizarPosicion, true);
      window.removeEventListener("resize", actualizarPosicion);
    };
  }, [abierto]);

  function agregarDeInventario(insumo: InsumoInventario) {
    onAgregar({
      nombre: insumo.marca ? `${insumo.nombre} (${insumo.marca})` : insumo.nombre,
      codigo: insumo.codigo ?? "",
      cantidad: "1",
      costo: String(insumo.costo),
      precio: String(insumo.precio),
      donde: "",
      parteId: insumo.id,
    });
    setTexto("");
    setAbierto(false);
  }

  function agregarPuntual() {
    if (!texto.trim()) return;
    onAgregar({ ...repuestoVacio(), nombre: texto.trim() });
    setTexto("");
    setAbierto(false);
  }

  return (
    <div className="relative">
      <svg
        viewBox="0 0 20 20"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      >
        <circle cx="8.5" cy="8.5" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <line x1="13" y1="13" x2="17.5" y2="17.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          abrir();
        }}
        onFocus={abrir}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            agregarPuntual();
          }
          if (e.key === "Escape") setAbierto(false);
        }}
        placeholder="Buscar en el inventario o escribir un repuesto nuevo"
        className="w-full rounded-lg border border-border bg-card py-2.5 pr-24 pl-9 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
      />
      <button
        type="button"
        onClick={agregarPuntual}
        disabled={!texto.trim()}
        className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        Agregar
      </button>

      {abierto && inventario.length > 0 && (
        <ul
          style={{ top: pos.top, left: pos.left, width: pos.width }}
          className="scroll-discreto fixed z-50 max-h-56 overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-lg"
        >
          {coincidencias.length === 0 ? (
            <li className="px-4 py-2 text-[13px] text-muted-foreground">
              Sin coincidencias en el inventario — Enter o &quot;Agregar&quot; lo suma como repuesto puntual
            </li>
          ) : (
            coincidencias.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => agregarDeInventario(i)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-[14px] transition-colors hover:bg-background"
                >
                  <span className="min-w-0 truncate">
                    {i.nombre}
                    {i.marca && (
                      <span className="text-muted-foreground"> · {i.marca}</span>
                    )}
                    {i.codigo && (
                      <span className="text-muted-foreground"> · {i.codigo}</span>
                    )}
                  </span>
                  <span className="shrink-0 text-[12px] text-muted-foreground">
                    {i.stock} en stock
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

/**
 * Alternativa a BuscadorRepuesto para talleres sin inventario cargado
 * (Plan Taller/Prueba): dos campos manuales — mano de obra y
 * repuesto — cada uno con su descripción y precio, que se agregan
 * por separado a la misma tabla. Pedido real de Tío Lalo: "cambio de
 * embrague" no es un ítem de inventario, es un concepto con un precio
 * puesto a mano.
 */
function CamposManuales({
  onAgregar,
}: {
  onAgregar: (repuesto: RepuestoUsado) => void;
}) {
  const [manoObraTexto, setManoObraTexto] = useState("");
  const [manoObraPrecio, setManoObraPrecio] = useState("");
  const [repuestoTexto, setRepuestoTexto] = useState("");
  const [repuestoPrecio, setRepuestoPrecio] = useState("");

  const campo =
    "w-full rounded-lg border border-border bg-card px-3 py-2 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30";

  function agregarManoObra() {
    if (!manoObraTexto.trim()) return;
    onAgregar({
      ...repuestoVacio(),
      nombre: manoObraTexto.trim(),
      precio: manoObraPrecio,
    });
    setManoObraTexto("");
    setManoObraPrecio("");
  }

  function agregarRepuesto() {
    if (!repuestoTexto.trim()) return;
    onAgregar({
      ...repuestoVacio(),
      nombre: repuestoTexto.trim(),
      precio: repuestoPrecio,
    });
    setRepuestoTexto("");
    setRepuestoPrecio("");
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="flex gap-2">
        <input
          value={manoObraTexto}
          onChange={(e) => setManoObraTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregarManoObra();
            }
          }}
          placeholder="Qué se hizo (ej. cambio de embrague)"
          className={campo}
        />
        <input
          value={miles(manoObraPrecio)}
          onChange={(e) => setManoObraPrecio(soloDigitos(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregarManoObra();
            }
          }}
          inputMode="numeric"
          placeholder="Precio"
          className={`${campo} w-28 shrink-0`}
        />
        <button
          type="button"
          onClick={agregarManoObra}
          disabled={!manoObraTexto.trim()}
          className="shrink-0 rounded-lg bg-primary px-3 py-2 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Agregar
        </button>
      </div>
      <div className="flex gap-2">
        <input
          value={repuestoTexto}
          onChange={(e) => setRepuestoTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregarRepuesto();
            }
          }}
          placeholder="Repuesto (ej. masa de embrague)"
          className={campo}
        />
        <input
          value={miles(repuestoPrecio)}
          onChange={(e) => setRepuestoPrecio(soloDigitos(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregarRepuesto();
            }
          }}
          inputMode="numeric"
          placeholder="Precio"
          className={`${campo} w-28 shrink-0`}
        />
        <button
          type="button"
          onClick={agregarRepuesto}
          disabled={!repuestoTexto.trim()}
          className="shrink-0 rounded-lg bg-primary px-3 py-2 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          Agregar
        </button>
      </div>
    </div>
  );
}

/**
 * El nombre de un repuesto ya agregado a la tabla — solo texto libre
 * para corregirlo a mano; buscar/elegir del inventario pasa por
 * BuscadorRepuesto, no por acá.
 */
function CampoNombre({
  pieza,
  onCambiar,
  className,
}: {
  pieza: RepuestoUsado;
  onCambiar: (campo: keyof RepuestoUsado, valor: string | null) => void;
  className: string;
}) {
  return (
    <input
      value={pieza.nombre}
      onChange={(e) => {
        onCambiar("nombre", e.target.value);
        if (pieza.parteId) onCambiar("parteId", null);
      }}
      className={className}
    />
  );
}

/**
 * Qué se compró para este auto, dónde y cuánto costó. Si se elige del
 * inventario, además descuenta el stock al cerrar la orden — un
 * repuesto puntual sin coincidencia solo queda registrado, sin tocar
 * stock (esa es la distinción que ya sabemos: insumo genérico vs
 * repuesto específico de un auto).
 *
 * "Dónde se compró" solo aparece en Plan Taller/Prueba: en Serviteca
 * el taller ya tiene inventario propio con costo cargado, así que el
 * dato pierde sentido — un taller de una persona sin inventario en
 * cambio sí necesita anotar en qué desarmaduría o casa de repuestos
 * compró cada cosa, para poder volver ahí.
 */
export function RepuestosUsados({
  piezas,
  onCambio,
  inventario = [],
  mostrarDonde = true,
  buscadorInventario = true,
}: {
  piezas: RepuestoUsado[];
  onCambio: (piezas: RepuestoUsado[]) => void;
  inventario?: InsumoInventario[];
  mostrarDonde?: boolean;
  buscadorInventario?: boolean;
}) {
  const cambiar = (
    i: number,
    campo: keyof RepuestoUsado,
    valor: string | null
  ) => onCambio(piezas.map((p, j) => (i === j ? { ...p, [campo]: valor } : p)));

  const quitar = (i: number) => onCambio(piezas.filter((_, j) => j !== i));

  const costoTotal = piezas.reduce(
    (s, p) => s + (Number(p.costo) || 0) * (Number(p.cantidad) || 1),
    0
  );
  const cobroTotal = piezas.reduce(
    (s, p) => s + (Number(p.precio) || 0) * (Number(p.cantidad) || 1),
    0
  );
  const ganancia = cobroTotal - costoTotal;
  const hayDatos = costoTotal > 0 || cobroTotal > 0;

  const campo =
    "w-full rounded-lg border border-border bg-card px-3 py-2 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30";

  return (
    <div>
      <span className="mb-2 block text-[13px] font-medium">
        Repuestos que se compraron
      </span>

      {buscadorInventario ? (
        <BuscadorRepuesto
          inventario={inventario}
          onAgregar={(repuesto) => onCambio([...piezas, repuesto])}
        />
      ) : (
        <CamposManuales onAgregar={(repuesto) => onCambio([...piezas, repuesto])} />
      )}

      {piezas.length > 0 && (
        <div className="scroll-discreto mb-2 overflow-x-auto rounded-lg border border-border">
          <table
            className={`w-full border-collapse text-[14px] ${mostrarDonde ? "min-w-270" : "min-w-230"}`}
          >
            <thead>
              <tr className="border-b border-border bg-card text-left text-[12px] text-muted-foreground">
                <th className="px-3 py-2 font-medium">Código</th>
                <th className="px-3 py-2 font-medium">Detalle</th>
                <th className="px-3 py-2 font-medium">Cantidad</th>
                <th className="px-3 py-2 font-medium">Costo</th>
                <th className="px-3 py-2 font-medium">Precio</th>
                <th className="px-3 py-2 font-medium">Valor</th>
                {mostrarDonde && (
                  <th className="px-3 py-2 font-medium">Dónde</th>
                )}
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {piezas.map((p, i) => {
                const valor = (Number(p.precio) || 0) * (Number(p.cantidad) || 1);
                return (
                  <tr key={i} className="border-b border-border/60 last:border-0">
                    <td className="w-24 px-3 py-2 align-top">
                      <input
                        value={p.codigo ?? ""}
                        onChange={(e) => cambiar(i, "codigo", e.target.value)}
                        placeholder="Opcional"
                        className={campo}
                      />
                    </td>
                    <td className="w-full px-3 py-2 align-top">
                      <CampoNombre
                        pieza={p}
                        onCambiar={(campo, valor) => cambiar(i, campo, valor)}
                        className={`${campo} min-w-24`}
                      />
                    </td>
                    <td className="w-20 px-3 py-2 align-top">
                      <input
                        value={p.cantidad}
                        onChange={(e) =>
                          cambiar(i, "cantidad", soloDigitos(e.target.value))
                        }
                        inputMode="numeric"
                        className={campo}
                      />
                    </td>
                    <td className="w-40 px-3 py-2 align-top">
                      <input
                        value={miles(p.costo)}
                        onChange={(e) =>
                          cambiar(i, "costo", soloDigitos(e.target.value))
                        }
                        placeholder="18.000"
                        inputMode="numeric"
                        className={campo}
                      />
                    </td>
                    <td className="w-28 px-3 py-2 align-top">
                      <input
                        value={miles(p.precio)}
                        onChange={(e) =>
                          cambiar(i, "precio", soloDigitos(e.target.value))
                        }
                        placeholder="25.000"
                        inputMode="numeric"
                        className={campo}
                      />
                    </td>
                    <td className="px-3 py-2 align-top whitespace-nowrap tabular-nums">
                      {valor > 0 ? pesos(valor) : "—"}
                    </td>
                    {mostrarDonde && (
                      <td className="w-36 px-3 py-2 align-top">
                        <input
                          value={p.donde}
                          onChange={(e) => cambiar(i, "donde", e.target.value)}
                          placeholder="Desarmaduría"
                          className={campo}
                        />
                      </td>
                    )}
                    <td className="px-2 py-2 align-top">
                      <button
                        type="button"
                        onClick={() => quitar(i)}
                        aria-label="Quitar este repuesto"
                        className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:text-destructive"
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {hayDatos && (
        <p className="mt-2 text-[14px] text-muted-foreground">
          Te costaron {pesos(costoTotal)} · cobras {pesos(cobroTotal)} ·{" "}
          <span
            className={
              ganancia < 0 ? "font-medium text-destructive" : "text-foreground"
            }
          >
            {ganancia < 0
              ? `pierdes ${pesos(Math.abs(ganancia))}`
              : `ganas ${pesos(ganancia)}`}
          </span>
        </p>
      )}
    </div>
  );
}
