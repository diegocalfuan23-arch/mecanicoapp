"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearVenta, type ItemCarrito } from "../acciones";
import { pesos, miles, soloDigitos } from "@/lib/formato";
import { Selector } from "@/components/ui/selector";
import { Button } from "@/components/ui/button";

const campo =
  "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30";

type Repuesto = {
  id: string;
  nombre: string;
  codigo: string | null;
  marca: string | null;
  stock: number;
  precio: number;
};

const METODOS_PAGO = [
  { valor: "efectivo", texto: "Efectivo" },
  { valor: "tarjeta", texto: "Tarjeta" },
  { valor: "transferencia", texto: "Transferencia" },
  { valor: "otro", texto: "Otro" },
];

export function NuevaVenta({ inventario }: { inventario: Repuesto[] }) {
  const router = useRouter();
  const [pestana, setPestana] = useState<"repuestos" | "libre">("repuestos");
  const [busquedaCatalogo, setBusquedaCatalogo] = useState("");
  const [items, setItems] = useState<ItemCarrito[]>([]);

  // Ítem libre
  const [libreNombre, setLibreNombre] = useState("");
  const [librePrecio, setLibrePrecio] = useState("");

  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [patente, setPatente] = useState("");
  const [mostrarCliente, setMostrarCliente] = useState(false);

  const [estado, setEstado] = useState<"pagada" | "cotizacion">("pagada");
  const [metodoPago, setMetodoPago] = useState("");
  const [referenciaPago, setReferenciaPago] = useState("");
  const [notas, setNotas] = useState("");
  const [descuento, setDescuento] = useState("");
  const [conIva, setConIva] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const catalogoFiltrado = busquedaCatalogo.trim()
    ? inventario.filter((r) => {
        const q = busquedaCatalogo.trim().toLowerCase();
        return (
          r.nombre.toLowerCase().includes(q) ||
          r.codigo?.toLowerCase().includes(q) ||
          r.marca?.toLowerCase().includes(q)
        );
      })
    : inventario;

  function agregarRepuesto(r: Repuesto) {
    setItems((actual) => {
      const yaEsta = actual.find((i) => i.parteId === r.id);
      if (yaEsta) {
        return actual.map((i) =>
          i.parteId === r.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...actual,
        { parteId: r.id, nombre: r.nombre, cantidad: 1, precioUnitario: r.precio },
      ];
    });
  }

  function agregarLibre() {
    if (!libreNombre.trim()) return;
    setItems((actual) => [
      ...actual,
      {
        parteId: null,
        nombre: libreNombre.trim(),
        cantidad: 1,
        precioUnitario: Number(librePrecio) || 0,
      },
    ]);
    setLibreNombre("");
    setLibrePrecio("");
  }

  function cambiarCantidad(i: number, cantidad: number) {
    if (cantidad < 1) return;
    setItems((actual) =>
      actual.map((item, j) => (i === j ? { ...item, cantidad } : item))
    );
  }

  function quitar(i: number) {
    setItems((actual) => actual.filter((_, j) => j !== i));
  }

  const subtotal = items.reduce((s, i) => s + i.cantidad * i.precioUnitario, 0);
  const descuentoPct = Math.min(100, Math.max(0, Number(descuento) || 0));
  const montoDescuento = Math.round((subtotal * descuentoPct) / 100);
  const neto = subtotal - montoDescuento;
  const iva = conIva ? Math.round(neto * 0.19) : 0;
  const total = neto + iva;

  async function completar() {
    setError(null);
    setEnviando(true);

    const res = await crearVenta({
      clienteNombre,
      clienteTelefono,
      patente,
      estado,
      metodoPago: estado === "pagada" ? metodoPago : "",
      referenciaPago: estado === "pagada" ? referenciaPago : "",
      descuentoPorcentaje: descuentoPct,
      conIva,
      notas,
      items,
    });

    setEnviando(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    router.push("/panel/ventas");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Catálogo */}
      <div>
        <h2 className="text-lg font-medium">Catálogo</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Toca un ítem del inventario para agregarlo al carrito, o usa Ítem
          libre.
        </p>

        <div className="mt-4 flex rounded-lg border border-border p-1">
          <button
            type="button"
            onClick={() => setPestana("repuestos")}
            className={`flex-1 rounded-md px-4 py-2 text-[14px] font-medium transition-colors ${
              pestana === "repuestos"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Repuestos / productos
          </button>
          <button
            type="button"
            onClick={() => setPestana("libre")}
            className={`flex-1 rounded-md px-4 py-2 text-[14px] font-medium transition-colors ${
              pestana === "libre"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Ítem libre
          </button>
        </div>

        {pestana === "repuestos" ? (
          <>
            <div className="relative mt-4">
              <svg
                viewBox="0 0 20 20"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              >
                <path
                  d="M9 15A6 6 0 109 3a6 6 0 000 12zM13.5 13.5L17 17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              <input
                value={busquedaCatalogo}
                onChange={(e) => setBusquedaCatalogo(e.target.value)}
                placeholder="Buscar por nombre, código o marca…"
                className={`${campo} pl-9`}
              />
            </div>

            <ul className="mt-3 flex max-h-96 flex-col gap-1 overflow-y-auto">
              {catalogoFiltrado.length === 0 && (
                <li className="rounded-lg border border-dashed border-border py-8 text-center text-[13px] text-muted-foreground">
                  {inventario.length === 0
                    ? "No hay ítems que coincidan. Crea repuestos en Inventario."
                    : "Nada coincide con esa búsqueda."}
                </li>
              )}
              {catalogoFiltrado.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => agregarRepuesto(r)}
                    disabled={r.stock <= 0}
                    className="flex w-full items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/40 disabled:opacity-40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium">
                        {r.nombre}
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        {r.marca ? `${r.marca} · ` : ""}
                        {r.stock <= 0 ? "Sin stock" : `${r.stock} en stock`}
                      </p>
                    </div>
                    <span className="shrink-0 text-[14px] font-medium tabular-nums">
                      {pesos(r.precio)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="mt-4 rounded-xl border border-border bg-card p-4">
            <p className="text-[13px] text-muted-foreground">
              Algo que no está en inventario: nombre y precio.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={libreNombre}
                onChange={(e) => setLibreNombre(e.target.value)}
                placeholder="Ej. revisión rápida de frenos"
                autoFocus
                className={campo}
              />
              <input
                value={miles(librePrecio)}
                onChange={(e) => setLibrePrecio(soloDigitos(e.target.value))}
                placeholder="15.000"
                inputMode="numeric"
                className={`${campo} sm:w-36`}
              />
              <Button
                type="button"
                variant="outline"
                onClick={agregarLibre}
                disabled={!libreNombre.trim()}
                className="shrink-0"
              >
                Agregar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Carrito */}
      <div>
        <h2 className="text-lg font-medium">Carrito</h2>

        {items.length === 0 ? (
          <p className="mt-4 text-[14px] text-muted-foreground">
            El carrito está vacío. Selecciona ítems del catálogo.
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {items.map((item, i) => (
              <li
                key={i}
                className="rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[14px] font-medium">{item.nombre}</span>
                  <button
                    type="button"
                    onClick={() => quitar(i)}
                    aria-label="Quitar del carrito"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
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
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => cambiarCantidad(i, item.cantidad - 1)}
                      className="flex size-7 items-center justify-center rounded-lg border border-border hover:bg-background"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-[14px] tabular-nums">
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => cambiarCantidad(i, item.cantidad + 1)}
                      className="flex size-7 items-center justify-center rounded-lg border border-border hover:bg-background"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[14px] font-medium tabular-nums">
                    {pesos(item.cantidad * item.precioUnitario)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6">
          <div className="flex rounded-lg border border-border p-1">
            <button
              type="button"
              onClick={() => setEstado("pagada")}
              className={`flex-1 rounded-md px-4 py-2 text-[14px] font-medium transition-colors ${
                estado === "pagada"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Venta pagada
            </button>
            <button
              type="button"
              onClick={() => setEstado("cotizacion")}
              className={`flex-1 rounded-md px-4 py-2 text-[14px] font-medium transition-colors ${
                estado === "cotizacion"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Cotización
            </button>
          </div>
          <p className="mt-2 text-[12px] text-muted-foreground">
            {estado === "pagada"
              ? "Registra el cobro y descuenta stock."
              : "Solo guarda la cotización, no toca inventario ni caja."}
          </p>
        </div>

        <div className="mt-4">
          {!mostrarCliente ? (
            <button
              type="button"
              onClick={() => setMostrarCliente(true)}
              className="text-[13px] text-acento hover:underline"
            >
              + Agregar cliente o vehículo (opcional)
            </button>
          ) : (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  placeholder="Nombre del cliente"
                  className={campo}
                />
                <input
                  value={clienteTelefono}
                  onChange={(e) => setClienteTelefono(e.target.value)}
                  placeholder="Teléfono"
                  inputMode="tel"
                  className={campo}
                />
              </div>
              <input
                value={patente}
                onChange={(e) => setPatente(e.target.value)}
                placeholder="Patente (opcional)"
                autoCapitalize="characters"
                className={`${campo} mt-3 font-mono uppercase`}
              />
            </div>
          )}
        </div>

        {estado === "pagada" && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <span className="mb-2 block text-[13px] font-medium">
                Medio de pago
              </span>
              <Selector
                value={metodoPago}
                onChange={setMetodoPago}
                placeholder="Sin especificar"
                opciones={METODOS_PAGO}
              />
            </div>
            <div>
              <label className="mb-2 block text-[13px] font-medium">
                Referencia (opcional)
              </label>
              <input
                value={referenciaPago}
                onChange={(e) => setReferenciaPago(e.target.value)}
                placeholder="N° voucher, autorización…"
                className={campo}
              />
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className="mb-2 block text-[13px] font-medium">
            Notas (opcional)
          </label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={2}
            className={campo}
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-[13px] font-medium">
              Descuento (%)
            </label>
            <input
              value={descuento}
              onChange={(e) => setDescuento(soloDigitos(e.target.value))}
              placeholder="0"
              inputMode="numeric"
              className={campo}
            />
          </div>
          <label className="flex items-end gap-3 pb-2.5">
            <input
              type="checkbox"
              checked={conIva}
              onChange={(e) => setConIva(e.target.checked)}
              className="size-4 accent-primary"
            />
            <span className="text-[14px]">Agregar IVA (19%)</span>
          </label>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-card p-4 text-[14px]">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span className="tabular-nums">{pesos(subtotal)}</span>
          </div>
          {montoDescuento > 0 && (
            <div className="mt-1 flex justify-between text-muted-foreground">
              <span>Descuento</span>
              <span className="tabular-nums">-{pesos(montoDescuento)}</span>
            </div>
          )}
          {conIva && (
            <div className="mt-1 flex justify-between text-muted-foreground">
              <span>IVA (19%)</span>
              <span className="tabular-nums">{pesos(iva)}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-[16px] font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{pesos(total)}</span>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-[13px] text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          type="button"
          onClick={completar}
          disabled={enviando || items.length === 0}
          className="mt-4 w-full"
        >
          {enviando
            ? "Guardando…"
            : estado === "pagada"
              ? "Completar venta"
              : "Guardar cotización"}
        </Button>
      </div>
    </div>
  );
}
