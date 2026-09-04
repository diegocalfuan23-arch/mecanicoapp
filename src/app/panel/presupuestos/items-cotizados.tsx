"use client";

import { useState } from "react";
import { miles, soloDigitos, pesos } from "@/lib/formato";
import type { ItemCotizado } from "./acciones";
import { Button } from "@/components/ui/button";

/** Editor simple de líneas cotizadas: nombre, cantidad, precio. Más
 * liviano que RepuestosUsados (de Órdenes) a propósito — acá todavía
 * no se sabe dónde se comprará ni cuánto le costará al taller, solo
 * lo que se le cobrará al cliente si aprueba. */
export function ItemsCotizados({
  items,
  onCambio,
}: {
  items: ItemCotizado[];
  onCambio: (items: ItemCotizado[]) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");

  const campo =
    "w-full rounded-lg border border-border bg-card px-3 py-2 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30";

  function agregar() {
    if (!nombre.trim()) return;
    onCambio([...items, { nombre: nombre.trim(), cantidad: "1", precio }]);
    setNombre("");
    setPrecio("");
  }

  function cambiar(i: number, campo: keyof ItemCotizado, valor: string) {
    onCambio(items.map((it, j) => (i === j ? { ...it, [campo]: valor } : it)));
  }

  function quitar(i: number) {
    onCambio(items.filter((_, j) => j !== i));
  }

  const total = items.reduce(
    (s, i) => s + (Number(i.precio) || 0) * (Number(i.cantidad) || 1),
    0
  );

  return (
    <div>
      <span className="mb-2 block text-[13px] font-medium">Qué se cotiza</span>

      <div className="flex gap-2">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregar();
            }
          }}
          placeholder="Ej. cambio de embrague"
          className={campo}
        />
        <input
          value={miles(precio)}
          onChange={(e) => setPrecio(soloDigitos(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregar();
            }
          }}
          inputMode="numeric"
          placeholder="Precio"
          className={`${campo} w-32 shrink-0`}
        />
        <Button
          size="sm"
          type="button"
          onClick={agregar}
          disabled={!nombre.trim()}
          className="shrink-0"
        >
          Agregar
        </Button>
      </div>

      {items.length > 0 && (
        <div className="scroll-discreto mt-3 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-140 border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-border bg-card text-left text-[12px] text-muted-foreground">
                <th className="px-3 py-2 font-medium">Detalle</th>
                <th className="px-3 py-2 font-medium">Cantidad</th>
                <th className="px-3 py-2 font-medium">Precio</th>
                <th className="px-3 py-2 font-medium">Valor</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => {
                const valor = (Number(it.precio) || 0) * (Number(it.cantidad) || 1);
                return (
                  <tr key={i} className="border-b border-border/60 last:border-0">
                    <td className="w-full px-3 py-2 align-top">
                      <input
                        value={it.nombre}
                        onChange={(e) => cambiar(i, "nombre", e.target.value)}
                        className={campo}
                      />
                    </td>
                    <td className="w-20 px-3 py-2 align-top">
                      <input
                        value={it.cantidad}
                        onChange={(e) =>
                          cambiar(i, "cantidad", soloDigitos(e.target.value))
                        }
                        inputMode="numeric"
                        className={campo}
                      />
                    </td>
                    <td className="w-28 px-3 py-2 align-top">
                      <input
                        value={miles(it.precio)}
                        onChange={(e) =>
                          cambiar(i, "precio", soloDigitos(e.target.value))
                        }
                        inputMode="numeric"
                        className={campo}
                      />
                    </td>
                    <td className="px-3 py-2 align-top whitespace-nowrap tabular-nums">
                      {valor > 0 ? pesos(valor) : "—"}
                    </td>
                    <td className="px-2 py-2 align-top">
                      <button
                        type="button"
                        onClick={() => quitar(i)}
                        aria-label="Quitar este item"
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

      {total > 0 && (
        <p className="mt-2 text-right text-[14px] font-medium tabular-nums">
          Total {pesos(total)}
        </p>
      )}
    </div>
  );
}
