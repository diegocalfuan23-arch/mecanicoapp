"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pesos, miles, soloDigitos } from "@/lib/formato";
import { Selector } from "@/components/ui/selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BuscadorProveedor,
  type ProveedorOpcion,
} from "@/components/buscador-proveedor";
import {
  crearCompra,
  type EstadoCompra,
  type OrigenItemCompra,
  type RepuestoOpcion,
} from "../acciones";

const ESTADOS: { valor: EstadoCompra; texto: string }[] = [
  { valor: "pendiente", texto: "Pendiente" },
  { valor: "pagada", texto: "Pagada" },
  { valor: "anulada", texto: "Anulada" },
];

type Linea = {
  clave: number;
  origen: OrigenItemCompra;
  parteId: string;
  descripcion: string;
  cantidad: string;
  costoUnitario: string;
};

let contadorLinea = 0;
function lineaVacia(): Linea {
  contadorLinea += 1;
  return {
    clave: contadorLinea,
    origen: "inventario",
    parteId: "",
    descripcion: "",
    cantidad: "1",
    costoUnitario: "",
  };
}

function hoyISOLocal() {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
}

function FilaItem({
  linea,
  repuestos,
  onCambiar,
  onQuitar,
}: {
  linea: Linea;
  repuestos: RepuestoOpcion[];
  onCambiar: (linea: Linea) => void;
  onQuitar: () => void;
}) {
  const [busquedaRepuesto, setBusquedaRepuesto] = useState("");

  const q = busquedaRepuesto.trim().toLowerCase();
  const repuestosFiltrados = q
    ? repuestos.filter(
        (r) =>
          r.nombre.toLowerCase().includes(q) ||
          r.codigo?.toLowerCase().includes(q) ||
          r.marca?.toLowerCase().includes(q)
      )
    : repuestos;

  const repuestoSel = repuestos.find((r) => r.id === linea.parteId) || null;

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex rounded-lg border border-border p-1">
          {(
            [
              { valor: "inventario", texto: "Desde inventario" },
              { valor: "nuevo", texto: "Producto nuevo" },
              { valor: "manual", texto: "Manual" },
            ] as { valor: OrigenItemCompra; texto: string }[]
          ).map((t) => (
            <button
              key={t.valor}
              type="button"
              onClick={() =>
                onCambiar({
                  ...linea,
                  origen: t.valor,
                  parteId: "",
                  descripcion: "",
                })
              }
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                linea.origen === t.valor
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.texto}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onQuitar}
          aria-label="Quitar línea"
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          ✕
        </button>
      </div>

      <div className="mt-3">
        {linea.origen === "inventario" ? (
          repuestoSel ? (
            <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium">{repuestoSel.nombre}</p>
                <p className="text-[12px] text-muted-foreground">
                  Stock actual: {repuestoSel.stock}
                  {repuestoSel.codigo ? ` · ${repuestoSel.codigo}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onCambiar({ ...linea, parteId: "", descripcion: "" })
                }
                className="shrink-0 text-[12px] text-muted-foreground hover:text-destructive"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <>
              <Input
                value={busquedaRepuesto}
                onChange={(e) => setBusquedaRepuesto(e.target.value)}
                placeholder="Buscar por nombre, SKU, código de parte o marca…"
              />
              {busquedaRepuesto.trim() && (
                <ul className="mt-2 flex max-h-40 flex-col gap-1 overflow-y-auto rounded-lg border border-border bg-card p-1">
                  {repuestosFiltrados.length === 0 && (
                    <li className="py-3 text-center text-[13px] text-muted-foreground">
                      Nada coincide con esa búsqueda.
                    </li>
                  )}
                  {repuestosFiltrados.slice(0, 20).map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() =>
                          onCambiar({
                            ...linea,
                            parteId: r.id,
                            descripcion: r.nombre,
                            costoUnitario: linea.costoUnitario || String(r.costo),
                          })
                        }
                        className="flex w-full flex-col rounded-lg px-3 py-2 text-left transition-colors hover:bg-background"
                      >
                        <span className="text-[14px] font-medium">{r.nombre}</span>
                        <span className="text-[12px] text-muted-foreground">
                          Stock: {r.stock}
                          {r.codigo ? ` · ${r.codigo}` : ""}
                          {r.marca ? ` · ${r.marca}` : ""}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )
        ) : (
          <Input
            value={linea.descripcion}
            onChange={(e) => onCambiar({ ...linea, descripcion: e.target.value })}
            placeholder={
              linea.origen === "nuevo"
                ? "Nombre del producto nuevo…"
                : "Descripción del gasto…"
            }
          />
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <span className="mb-1 block text-[12px] font-medium text-muted-foreground">
            Cantidad
          </span>
          <Input
            value={linea.cantidad}
            onChange={(e) => onCambiar({ ...linea, cantidad: soloDigitos(e.target.value) })}
            inputMode="numeric"
          />
        </div>
        <div>
          <span className="mb-1 block text-[12px] font-medium text-muted-foreground">
            Costo unitario
          </span>
          <Input
            value={miles(linea.costoUnitario)}
            onChange={(e) =>
              onCambiar({ ...linea, costoUnitario: soloDigitos(e.target.value) })
            }
            inputMode="numeric"
          />
        </div>
      </div>
    </div>
  );
}

export function NuevaCompra({
  proveedores,
  repuestos,
}: {
  proveedores: ProveedorOpcion[];
  repuestos: RepuestoOpcion[];
}) {
  const router = useRouter();
  const [proveedor, setProveedor] = useState<ProveedorOpcion | null>(null);
  const [proveedorLibre, setProveedorLibre] = useState("");
  const [fecha, setFecha] = useState(hoyISOLocal());
  const [estado, setEstado] = useState<EstadoCompra>("pendiente");
  const [folio, setFolio] = useState("");
  const [notas, setNotas] = useState("");
  const [lineas, setLineas] = useState<Linea[]>([lineaVacia()]);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function actualizarLinea(clave: number, nueva: Linea) {
    setLineas((prev) => prev.map((l) => (l.clave === clave ? nueva : l)));
  }

  function quitarLinea(clave: number) {
    setLineas((prev) => (prev.length > 1 ? prev.filter((l) => l.clave !== clave) : prev));
  }

  const subtotal = lineas.reduce(
    (acc, l) => acc + (Number(l.costoUnitario) || 0) * (Number(l.cantidad) || 1),
    0
  );

  async function guardar() {
    setError(null);
    setEnviando(true);
    const res = await crearCompra({
      proveedorId: proveedor?.id,
      proveedorNombre: proveedor ? proveedor.nombre : proveedorLibre,
      fechaIso: fecha,
      estado,
      folio,
      notas,
      items: lineas.map((l) => ({
        origen: l.origen,
        parteId: l.parteId || undefined,
        descripcion: l.origen === "inventario" ? l.descripcion : l.descripcion,
        cantidad: Number(l.cantidad) || 1,
        costoUnitario: Number(l.costoUnitario) || 0,
      })),
    });
    setEnviando(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    router.push("/panel/compras");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          Datos generales
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <span className="mb-2 block text-[13px] font-medium">Proveedor</span>
            <BuscadorProveedor
              proveedores={proveedores}
              seleccionado={proveedor}
              onSeleccionar={setProveedor}
            />
          </div>
          <div>
            <span className="mb-2 block text-[13px] font-medium">
              Nombre del proveedor (sin registro)
            </span>
            <Input
              value={proveedorLibre}
              onChange={(e) => setProveedorLibre(e.target.value)}
              placeholder="Opcional si no eliges proveedor"
              disabled={!!proveedor}
            />
          </div>

          <div>
            <span className="mb-2 block text-[13px] font-medium">Fecha de compra</span>
            <Input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div>
            <span className="mb-2 block text-[13px] font-medium">Estado</span>
            <Selector value={estado} onChange={(v) => setEstado(v as EstadoCompra)} opciones={ESTADOS} />
          </div>

          <div className="sm:col-span-2">
            <span className="mb-2 block text-[13px] font-medium">Folio / referencia</span>
            <Input
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              placeholder="N° factura, boleta u otra referencia del proveedor"
            />
          </div>

          <div className="sm:col-span-2">
            <span className="mb-2 block text-[13px] font-medium">Notas</span>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
              Ítems
            </h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Desde inventario (suma stock), producto nuevo (crea ítem) o manual
              (solo gasto).
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setLineas((prev) => [...prev, lineaVacia()])}
            className="shrink-0"
          >
            + Agregar línea
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {lineas.map((l) => (
            <FilaItem
              key={l.clave}
              linea={l}
              repuestos={repuestos}
              onCambiar={(nueva) => actualizarLinea(l.clave, nueva)}
              onQuitar={() => quitarLinea(l.clave)}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 border-t border-border pt-4">
        <div className="flex w-full max-w-xs justify-between text-[14px] text-muted-foreground">
          <span>Subtotal</span>
          <span>{pesos(subtotal)}</span>
        </div>
        <div className="flex w-full max-w-xs justify-between text-[14px] text-muted-foreground">
          <span>Impuesto</span>
          <span>{pesos(0)}</span>
        </div>
        <div className="flex w-full max-w-xs justify-between text-lg font-bold">
          <span>Total</span>
          <span>{pesos(subtotal)}</span>
        </div>
      </div>

      {error && (
        <p className="text-[13px] text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="button" onClick={guardar} disabled={enviando}>
          {enviando ? "Guardando…" : "Registrar compra"}
        </Button>
      </div>
    </div>
  );
}
