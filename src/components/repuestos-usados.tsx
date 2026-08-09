"use client";

import { miles, soloDigitos, pesos } from "@/lib/formato";
import type { RepuestoUsado } from "@/app/panel/ordenes/acciones";

export const repuestoVacio = (): RepuestoUsado => ({
  nombre: "",
  cantidad: "1",
  costo: "",
  precio: "",
  donde: "",
});

/**
 * Qué se compró para este auto, dónde y cuánto costó. No es un
 * inventario con stock: es el registro de la compra de cada trabajo,
 * para saber si quedó ganancia y no cobrar por debajo del costo.
 */
export function RepuestosUsados({
  piezas,
  onCambio,
}: {
  piezas: RepuestoUsado[];
  onCambio: (piezas: RepuestoUsado[]) => void;
}) {
  const cambiar = (i: number, campo: keyof RepuestoUsado, valor: string) =>
    onCambio(piezas.map((p, j) => (i === j ? { ...p, [campo]: valor } : p)));

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
    "w-full rounded-lg border border-border bg-card px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30";

  return (
    <div>
      <span className="mb-2 block text-[13px] font-medium">
        Repuestos que se compraron
      </span>

      {piezas.length > 0 && (
        <ul className="mb-2 flex flex-col gap-4">
          {piezas.map((p, i) => (
            <li
              key={i}
              className="rounded-lg border border-border bg-background p-4"
            >
              <div className="flex flex-wrap items-start gap-2">
                <input
                  value={p.nombre}
                  onChange={(e) => cambiar(i, "nombre", e.target.value)}
                  placeholder="Qué se compró"
                  className={`${campo} min-w-0 flex-1`}
                />
                <button
                  type="button"
                  onClick={() => quitar(i)}
                  aria-label="Quitar este repuesto"
                  className="shrink-0 rounded-lg border border-border px-4 py-2 text-muted-foreground transition-colors hover:text-destructive"
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
              </div>

              <div className="mt-2 grid gap-2 sm:grid-cols-4">
                <label className="block">
                  <span className="mb-1 block text-[12px] text-muted-foreground">
                    Cantidad
                  </span>
                  <input
                    value={p.cantidad}
                    onChange={(e) =>
                      cambiar(i, "cantidad", soloDigitos(e.target.value))
                    }
                    inputMode="numeric"
                    className={campo}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] text-muted-foreground">
                    Me costó
                  </span>
                  <input
                    value={miles(p.costo)}
                    onChange={(e) =>
                      cambiar(i, "costo", soloDigitos(e.target.value))
                    }
                    placeholder="18.000"
                    inputMode="numeric"
                    className={campo}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] text-muted-foreground">
                    Le cobro
                  </span>
                  <input
                    value={miles(p.precio)}
                    onChange={(e) =>
                      cambiar(i, "precio", soloDigitos(e.target.value))
                    }
                    placeholder="25.000"
                    inputMode="numeric"
                    className={campo}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] text-muted-foreground">
                    Dónde
                  </span>
                  <input
                    value={p.donde}
                    onChange={(e) => cambiar(i, "donde", e.target.value)}
                    placeholder="Desarmaduría"
                    className={campo}
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
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
