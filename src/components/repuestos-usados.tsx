"use client";

import { useState } from "react";
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
 * El nombre del repuesto: si coincide con algo del inventario aparecen
 * sugerencias para elegirlo (así se conecta a un id real y se puede
 * descontar del stock); si no, queda como texto libre — un repuesto
 * puntual comprado sobre la marcha, que no descuenta nada.
 */
function CampoNombre({
  pieza,
  inventario,
  onCambiar,
  className,
}: {
  pieza: RepuestoUsado;
  inventario: InsumoInventario[];
  onCambiar: (campo: keyof RepuestoUsado, valor: string | null) => void;
  className: string;
}) {
  const [abierto, setAbierto] = useState(false);

  const coincidencias =
    pieza.nombre.trim().length > 0
      ? inventario.filter((i) =>
          i.nombre.toLowerCase().includes(pieza.nombre.trim().toLowerCase())
        )
      : inventario;

  function elegir(insumo: InsumoInventario) {
    onCambiar(
      "nombre",
      insumo.marca ? `${insumo.nombre} (${insumo.marca})` : insumo.nombre
    );
    onCambiar("parteId", insumo.id);
    onCambiar("codigo", insumo.codigo ?? "");
    onCambiar("costo", String(insumo.costo));
    onCambiar("precio", String(insumo.precio));
    setAbierto(false);
  }

  return (
    <div className="relative min-w-0 flex-1">
      <input
        value={pieza.nombre}
        onChange={(e) => {
          onCambiar("nombre", e.target.value);
          // Si venía de una elección del inventario y ahora se
          // reescribe a mano, deja de ser ese ítem.
          if (pieza.parteId) onCambiar("parteId", null);
        }}
        onFocus={() => setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
        placeholder="Qué se compró"
        className={className}
      />
      {pieza.parteId && (
        <span className="mt-1 block text-[12px] text-muted-foreground">
          Del inventario
        </span>
      )}
      {abierto && inventario.length > 0 && (
        <ul className="scroll-discreto absolute top-full left-0 z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-lg">
          {coincidencias.length === 0 ? (
            <li className="px-4 py-2 text-[13px] text-muted-foreground">
              Sin coincidencias — queda como repuesto puntual
            </li>
          ) : (
            coincidencias.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => elegir(i)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-[14px] transition-colors hover:bg-background"
                >
                  <span className="min-w-0 truncate">
                    {i.nombre}
                    {i.marca && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {i.marca}
                      </span>
                    )}
                    {i.codigo && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {i.codigo}
                      </span>
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
 * Qué se compró para este auto, dónde y cuánto costó. Si se elige del
 * inventario, además descuenta el stock al cerrar la orden — un
 * repuesto puntual sin coincidencia solo queda registrado, sin tocar
 * stock (esa es la distinción que ya sabemos: insumo genérico vs
 * repuesto específico de un auto).
 */
export function RepuestosUsados({
  piezas,
  onCambio,
  inventario = [],
}: {
  piezas: RepuestoUsado[];
  onCambio: (piezas: RepuestoUsado[]) => void;
  inventario?: InsumoInventario[];
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

      {piezas.length > 0 && (
        <div className="scroll-discreto mb-2 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[760px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-border bg-card text-left text-[12px] text-muted-foreground">
                <th className="px-3 py-2 font-medium">Código</th>
                <th className="w-full px-3 py-2 font-medium">Detalle</th>
                <th className="px-3 py-2 font-medium">Cantidad</th>
                <th className="px-3 py-2 font-medium">Me costó</th>
                <th className="px-3 py-2 font-medium">Precio</th>
                <th className="px-3 py-2 font-medium">Valor</th>
                <th className="px-3 py-2 font-medium">Dónde</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {piezas.map((p, i) => {
                const valor = (Number(p.precio) || 0) * (Number(p.cantidad) || 1);
                return (
                  <tr key={i} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2 align-top">
                      <input
                        value={p.codigo ?? ""}
                        onChange={(e) => cambiar(i, "codigo", e.target.value)}
                        placeholder="Opcional"
                        className={`${campo} w-24`}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <CampoNombre
                        pieza={p}
                        inventario={inventario}
                        onCambiar={(campo, valor) => cambiar(i, campo, valor)}
                        className={`${campo} min-w-40`}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        value={p.cantidad}
                        onChange={(e) =>
                          cambiar(i, "cantidad", soloDigitos(e.target.value))
                        }
                        inputMode="numeric"
                        className={`${campo} w-16`}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        value={miles(p.costo)}
                        onChange={(e) =>
                          cambiar(i, "costo", soloDigitos(e.target.value))
                        }
                        placeholder="18.000"
                        inputMode="numeric"
                        className={`${campo} w-24`}
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        value={miles(p.precio)}
                        onChange={(e) =>
                          cambiar(i, "precio", soloDigitos(e.target.value))
                        }
                        placeholder="25.000"
                        inputMode="numeric"
                        className={`${campo} w-24`}
                      />
                    </td>
                    <td className="px-3 py-2 align-top whitespace-nowrap tabular-nums">
                      {valor > 0 ? pesos(valor) : "—"}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        value={p.donde}
                        onChange={(e) => cambiar(i, "donde", e.target.value)}
                        placeholder="Desarmaduría"
                        className={`${campo} w-32`}
                      />
                    </td>
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

      <button
        type="button"
        onClick={() => onCambio([...piezas, repuestoVacio()])}
        className="rounded-lg border border-border px-4 py-2 text-[14px] transition-colors hover:bg-background"
      >
        Agregar repuesto
      </button>

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
