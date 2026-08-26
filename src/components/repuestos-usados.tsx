"use client";

import { Autocomplete } from "@base-ui/react/autocomplete";
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
 *
 * Usa Autocomplete de Base UI (Portal + Positioner) en vez de un menú
 * absolute a mano: la tabla que lo contiene tiene overflow-x-auto para
 * el scroll horizontal en el celular, y overflow-x distinto de visible
 * fuerza a overflow-y a recortar también (CSS lo exige) — un dropdown
 * absolute quedaba invisible, recortado por ese mismo contenedor.
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
  function elegir(insumo: InsumoInventario | null) {
    if (!insumo) return;
    onCambiar(
      "nombre",
      insumo.marca ? `${insumo.nombre} (${insumo.marca})` : insumo.nombre
    );
    onCambiar("parteId", insumo.id);
    onCambiar("codigo", insumo.codigo ?? "");
    onCambiar("costo", String(insumo.costo));
    onCambiar("precio", String(insumo.precio));
  }

  return (
    <Autocomplete.Root
      items={inventario}
      itemToStringValue={(i) => i.nombre}
      value={pieza.nombre}
      onValueChange={(valor) => {
        onCambiar("nombre", valor);
        // Si venía de una elección del inventario y ahora se reescribe
        // a mano, deja de ser ese ítem.
        if (pieza.parteId) onCambiar("parteId", null);
      }}
    >
      <div className="relative min-w-0 flex-1">
        <Autocomplete.Input placeholder="Qué se compró" className={className} />
        {pieza.parteId && (
          <span className="mt-1 block text-[12px] text-muted-foreground">
            Del inventario
          </span>
        )}
      </div>
      <Autocomplete.Portal>
        <Autocomplete.Positioner className="z-50 outline-none" sideOffset={4}>
          <Autocomplete.Popup className="scroll-discreto max-h-48 w-(--anchor-width) overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-lg outline-none">
            <Autocomplete.Empty className="px-4 py-2 text-[13px] text-muted-foreground">
              Sin coincidencias — queda como repuesto puntual
            </Autocomplete.Empty>
            <Autocomplete.List>
              {(i: InsumoInventario) => (
                <Autocomplete.Item
                  key={i.id}
                  value={i}
                  onClick={() => elegir(i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-2 text-left text-[14px] outline-none transition-colors data-highlighted:bg-background"
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
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
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
