"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  guardarInsumo,
  actualizarInsumo,
  eliminarInsumo,
} from "./acciones";
import { pesos, miles, soloDigitos } from "@/lib/formato";

type Insumo = {
  id: string;
  nombre: string;
  codigo: string | null;
  marca: string | null;
  stock: number;
  stockMinimo: number;
  costo: number;
  precio: number;
};

const campoBase =
  "w-full rounded-lg border border-border bg-card px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30";

function Formulario({
  insumo,
  onListo,
}: {
  insumo?: Insumo;
  onListo: () => void;
}) {
  const router = useRouter();
  const editando = !!insumo;
  const [nombre, setNombre] = useState(insumo?.nombre ?? "");
  const [codigo, setCodigo] = useState(insumo?.codigo ?? "");
  const [marca, setMarca] = useState(insumo?.marca ?? "");
  const [stock, setStock] = useState(insumo ? String(insumo.stock) : "");
  const [stockMinimo, setStockMinimo] = useState(
    insumo ? String(insumo.stockMinimo) : ""
  );
  const [costo, setCosto] = useState(insumo ? String(insumo.costo) : "");
  const [precio, setPrecio] = useState(insumo ? String(insumo.precio) : "");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  async function guardar() {
    if (!nombre.trim()) return;
    setError(null);
    const datos = { nombre, codigo, marca, stock, stockMinimo, costo, precio };
    const res = editando
      ? await actualizarInsumo(insumo.id, datos)
      : await guardarInsumo(datos);

    if (res?.error) {
      setError(res.error);
      return res;
    }
    return res;
  }

  // Con autoguardado (editando) no hace falta el botón submit — cada
  // onBlur guarda solo. Sin él, "Volver" tiene que guardar primero: el
  // blur del campo con foco y el click competían por el mismo
  // re-render (mismo problema ya resuelto en Órdenes).
  async function alSalir() {
    if (!editando) return;
    await guardar();
    setGuardado(true);
    setTimeout(() => setGuardado(false), 1500);
    router.refresh();
  }

  async function volver() {
    if (editando) await guardar();
    onListo();
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const res = await guardar();
    setEnviando(false);
    if (!res?.error) {
      onListo();
      router.refresh();
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <h2 className="text-lg font-medium">
        {editando ? `Editar ${insumo.nombre}` : "Nuevo insumo"}
      </h2>
      <p className="mt-1 text-[14px] text-muted-foreground">
        Aceite, líquido de frenos, discos de corte — lo que se compra por
        adelantado, no un repuesto puntual de un auto.
      </p>

      <form
        onSubmit={editando ? (e) => e.preventDefault() : enviar}
        className="mt-6 flex flex-col gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">
              Nombre
            </span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onBlur={alSalir}
              placeholder="Aceite 10W-40"
              autoFocus
              className={campoBase}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">
              Código (opcional)
            </span>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onBlur={alSalir}
              placeholder="Interno o del proveedor"
              className={campoBase}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">
              Marca (opcional)
            </span>
            <input
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              onBlur={alSalir}
              placeholder="Bosch, NGK, Monroe…"
              className={campoBase}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">
              Stock actual
            </span>
            <input
              value={stock}
              onChange={(e) => setStock(soloDigitos(e.target.value))}
              onBlur={alSalir}
              placeholder="10"
              inputMode="numeric"
              className={campoBase}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">
              Avisar si baja de
            </span>
            <input
              value={stockMinimo}
              onChange={(e) => setStockMinimo(soloDigitos(e.target.value))}
              onBlur={alSalir}
              placeholder="2"
              inputMode="numeric"
              className={campoBase}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">
              Costo por unidad
            </span>
            <input
              value={miles(costo)}
              onChange={(e) => setCosto(soloDigitos(e.target.value))}
              onBlur={alSalir}
              placeholder="17.500"
              inputMode="numeric"
              className={campoBase}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">
              Precio por unidad
            </span>
            <input
              value={miles(precio)}
              onChange={(e) => setPrecio(soloDigitos(e.target.value))}
              onBlur={alSalir}
              placeholder="25.000"
              inputMode="numeric"
              className={campoBase}
            />
          </label>
        </div>

        {error && <p className="text-[13px] text-destructive">{error}</p>}

        {editando ? (
          <div className="flex items-center justify-between gap-4">
            <span className="text-[13px] text-muted-foreground">
              {guardado ? "Guardado" : "Los cambios se guardan solos"}
            </span>
            <button
              type="button"
              onClick={volver}
              className="rounded-lg border border-border px-6 py-2 font-medium transition-colors hover:bg-card"
            >
              Volver
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              type="submit"
              disabled={enviando}
              className="rounded-lg bg-primary px-6 py-4 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {enviando ? "Guardando…" : "Registrar insumo"}
            </button>
            <button
              type="button"
              onClick={onListo}
              className="rounded-lg border border-border px-6 py-4 font-medium transition-colors hover:bg-card"
            >
              Cancelar
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

export function TablaInventario({ insumos }: { insumos: Insumo[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Insumo | null>(null);
  const [confirmando, setConfirmando] = useState<Insumo | null>(null);
  const [borrando, setBorrando] = useState(false);

  async function borrar() {
    if (!confirmando) return;
    setBorrando(true);
    await eliminarInsumo(confirmando.id);
    setBorrando(false);
    setConfirmando(null);
    router.refresh();
  }

  if (abierto || editando) {
    return (
      <Formulario
        key={editando?.id ?? "nuevo"}
        insumo={editando ?? undefined}
        onListo={() => {
          setAbierto(false);
          setEditando(null);
        }}
      />
    );
  }

  return (
    <>
      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            aria-label="Cancelar"
            onClick={() => setConfirmando(null)}
            className="absolute inset-0 bg-black/60"
          />
          <div
            role="dialog"
            aria-modal
            className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6"
          >
            <h2 className="text-lg font-medium">
              ¿Eliminar {confirmando.nombre}?
            </h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Las órdenes que ya lo usaron mantienen su registro, solo se
              borra del inventario.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={borrar}
                disabled={borrando}
                className="rounded-lg bg-destructive px-6 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {borrando ? "Borrando…" : "Sí, eliminar"}
              </button>
              <button
                onClick={() => setConfirmando(null)}
                className="rounded-lg border border-border px-6 py-2 font-medium transition-colors hover:bg-background"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => setAbierto(true)}
          className="shrink-0 rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Nuevo insumo
        </button>
      </div>

      {insumos.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">
            Todavía no registraste ningún insumo.
          </p>
          <button
            onClick={() => setAbierto(true)}
            className="mt-4 text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Registrar el primero
          </button>
        </div>
      ) : (
        <>
          {/* En el teléfono, cada insumo es una tarjeta — la tabla de
              escritorio obligaría a arrastrar de lado. */}
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:hidden">
            {insumos.map((i) => {
              const bajo = i.stock <= i.stockMinimo && i.stockMinimo > 0;
              return (
                <li
                  key={i.id}
                  onClick={() => setEditando(i)}
                  className="flex min-w-0 cursor-pointer flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:p-6"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-medium">{i.nombre}</p>
                    {bajo && (
                      <span className="shrink-0 rounded-full bg-acento/15 px-2 py-1 text-[12px] font-medium text-acento">
                        Queda poco
                      </span>
                    )}
                  </div>
                  {(i.marca || i.codigo) && (
                    <p className="mt-1 truncate text-[13px] text-muted-foreground">
                      {[i.marca, i.codigo].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <p className="mt-4 text-2xl font-bold">{i.stock}</p>
                  <p className="text-[13px] text-muted-foreground">
                    en stock
                  </p>
                  <p className="mt-4 text-[13px] text-muted-foreground">
                    Cuesta {pesos(i.costo)} · cobras {pesos(i.precio)}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmando(i);
                    }}
                    className="mt-4 self-start text-[13px] text-muted-foreground underline underline-offset-4 hover:text-destructive"
                  >
                    Eliminar
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="scroll-discreto mt-6 hidden overflow-x-auto rounded-xl border border-border lg:block">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-border bg-card">
                  {["Nombre", "Código", "Marca", "Stock", "Costo", "Precio", "Acciones"].map(
                    (c) => (
                      <th
                        key={c}
                        className="px-4 py-4 text-left font-medium whitespace-nowrap text-muted-foreground"
                      >
                        {c}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {insumos.map((i) => {
                  const bajo = i.stock <= i.stockMinimo && i.stockMinimo > 0;
                  return (
                    <tr
                      key={i.id}
                      onClick={() => setEditando(i)}
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-card/50"
                    >
                      <td className="px-4 py-4 font-medium whitespace-nowrap">
                        {i.nombre}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                        {i.codigo ?? "No especifica"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                        {i.marca ?? "No especifica"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap tabular-nums">
                        {i.stock}
                        {bajo && (
                          <span className="ml-2 rounded-full bg-acento/15 px-2 py-1 font-sans text-[12px] font-medium text-acento">
                            Queda poco
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap tabular-nums">
                        {pesos(i.costo)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap tabular-nums">
                        {pesos(i.precio)}
                      </td>
                      <td
                        className="px-4 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setConfirmando(i)}
                          className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-destructive"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
