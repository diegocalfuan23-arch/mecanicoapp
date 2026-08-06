"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormularioVehiculo, type VehiculoEditable } from "./formulario";
import { eliminarVehiculo } from "./acciones";

type Vehiculo = VehiculoEditable;

const COLUMNAS = [
  "Patente",
  "Tipo",
  "Marca",
  "Modelo",
  "Color",
  "Motor",
  "Ejes",
  "Km",
  "Procedencia",
  "VIN",
  "Dueño",
  "Acciones",
];

/** Ver la ficha, editarla o borrarla. */
function Acciones({
  v,
  onEditar,
  onBorrar,
  borrando,
}: {
  v: Vehiculo;
  onEditar: () => void;
  onBorrar: () => void;
  borrando: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/panel/historial/${v.id}`}
        className="rounded-lg border border-border px-4 py-2 text-[13px] transition-colors hover:bg-background"
      >
        Ver
      </Link>
      <button
        onClick={onEditar}
        className="rounded-lg border border-border px-4 py-2 text-[13px] transition-colors hover:bg-background"
      >
        Editar
      </button>
      <button
        onClick={onBorrar}
        disabled={borrando}
        className="rounded-lg border border-border px-4 py-2 text-[13px] text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
      >
        {borrando ? "Borrando…" : "Eliminar"}
      </button>
    </div>
  );
}

export function TablaVehiculos({ vehiculos }: { vehiculos: Vehiculo[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Vehiculo | null>(null);
  const [confirmando, setConfirmando] = useState<Vehiculo | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [errorBorrado, setErrorBorrado] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  async function borrar() {
    if (!confirmando) return;
    setBorrando(true);
    setErrorBorrado(null);

    const res = await eliminarVehiculo(confirmando.id);
    setBorrando(false);

    if (res?.error) {
      setErrorBorrado(res.error);
      return;
    }

    setConfirmando(null);
    router.refresh();
  }

  const filtrados = busqueda.trim()
    ? vehiculos.filter((v) => {
        const q = busqueda.trim().toLowerCase();
        return (
          v.patente.toLowerCase().includes(q) ||
          v.marca?.toLowerCase().includes(q) ||
          v.modelo?.toLowerCase().includes(q) ||
          v.propietario?.toLowerCase().includes(q) ||
          v.vin?.toLowerCase().includes(q)
        );
      })
    : vehiculos;

  if (abierto || editando) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-lg font-medium">
          {editando ? `Editar ${editando.patente}` : "Nuevo vehículo"}
        </h2>
        <div className="mt-6">
          <FormularioVehiculo
            /* Remonta el formulario al cambiar de ficha, si no Formik
               conserva los valores de la anterior. */
            key={editando?.id ?? "nuevo"}
            vehiculo={editando ?? undefined}
            onListo={() => {
              setAbierto(false);
              setEditando(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            aria-label="Cancelar"
            onClick={() => {
              setConfirmando(null);
              setErrorBorrado(null);
            }}
            className="absolute inset-0 bg-black/60"
          />
          <div
            role="dialog"
            aria-modal
            className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6"
          >
            <h2 className="text-lg font-medium">
              ¿Eliminar {confirmando.patente}?
            </h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
              {errorBorrado ?? "Esta ficha se borra y no se puede recuperar."}
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              {!errorBorrado && (
                <button
                  onClick={borrar}
                  disabled={borrando}
                  className="rounded-lg bg-destructive px-6 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {borrando ? "Borrando…" : "Sí, eliminar"}
                </button>
              )}
              <button
                onClick={() => {
                  setConfirmando(null);
                  setErrorBorrado(null);
                }}
                className="rounded-lg border border-border px-6 py-2 font-medium transition-colors hover:bg-background"
              >
                {errorBorrado ? "Entendido" : "Cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por patente, marca o dueño"
          className="w-full rounded-lg border border-border bg-card px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30 sm:max-w-sm"
        />
        <button
          onClick={() => setAbierto(true)}
          className="shrink-0 rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Registrar vehículo
        </button>
      </div>

      {filtrados.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">
            {vehiculos.length === 0
              ? "Todavía no hay vehículos registrados."
              : "Ningún vehículo coincide con esa búsqueda."}
          </p>
          {vehiculos.length === 0 && (
            <button
              onClick={() => setAbierto(true)}
              className="mt-4 text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Registrar el primero
            </button>
          )}
        </div>
      ) : (
        <>
          {/* En el teléfono cada vehículo es una tarjeta: una tabla de doce
              columnas obliga a arrastrar de lado para leer una sola fila. */}
          <ul className="mt-6 flex flex-col gap-4 lg:hidden">
            {filtrados.map((v) => (
              <li
                key={v.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-mono text-lg font-medium">
                    {v.patente}
                  </span>
                  {v.primeraVez && (
                    <span className="rounded-full bg-foreground/10 px-2 py-1 text-[12px] font-medium">
                      Primera vez
                    </span>
                  )}
                </div>

                <p className="mt-2 text-[15px]">
                  {[v.marca, v.modelo, v.anio].filter(Boolean).join(" ") ||
                    "Sin datos del modelo"}
                </p>

                <p className="mt-2 text-[13px] text-muted-foreground">
                  {[
                    v.tipo,
                    v.color,
                    v.motor,
                    v.kilometrajeInicial
                      ? `${v.kilometrajeInicial.toLocaleString("es-CL")} km`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Sin especificaciones"}
                </p>

                <p className="mt-2 text-[13px] text-muted-foreground">
                  {v.propietario ?? "Sin dueño registrado"}
                  {v.copropietario ? ` · con ${v.copropietario}` : ""}
                </p>

                <div className="mt-4">
                  <Acciones
                    v={v}
                    onEditar={() => setEditando(v)}
                    onBorrar={() => setConfirmando(v)}
                    borrando={borrando && confirmando?.id === v.id}
                  />
                </div>
              </li>
            ))}
          </ul>

          <div className="scroll-discreto mt-6 hidden overflow-x-auto rounded-xl border border-border lg:block">
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-border bg-card">
                {COLUMNAS.map((c) => (
                  <th
                    key={c}
                    className="px-4 py-4 text-left font-medium whitespace-nowrap text-muted-foreground"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((v) => (
                <tr
                  key={v.id}
                  className="border-b border-border last:border-0 hover:bg-card/50"
                >
                  <td className="px-4 py-4 font-mono font-medium whitespace-nowrap">
                    {v.patente}
                    {v.primeraVez && (
                      <span className="ml-2 rounded-full bg-foreground/10 px-2 py-1 font-sans text-[12px] font-medium">
                        Primera vez
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {v.tipo ?? "—"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {v.marca ? (
                      <span title={v.marca}>
                        {v.marca.length > 6
                          ? `${v.marca.slice(0, 6)}…`
                          : v.marca}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {v.modelo ?? "—"}
                    {v.anio && (
                      <span className="text-muted-foreground"> {v.anio}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {v.color ?? "—"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {v.motor ?? "—"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {v.ejes ?? "—"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap tabular-nums">
                    {v.kilometrajeInicial
                      ? v.kilometrajeInicial.toLocaleString("es-CL")
                      : "—"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {v.procedencia ?? "—"}
                  </td>
                  <td className="px-4 py-4 font-mono text-[13px] whitespace-nowrap text-muted-foreground">
                    {v.vin ? (
                      <span title={v.vin}>{v.vin.slice(0, 6)}…</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {v.propietario ?? "—"}
                    {v.copropietario && (
                      <span className="block text-[13px] text-muted-foreground">
                        con {v.copropietario}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Acciones
                      v={v}
                      onEditar={() => setEditando(v)}
                      onBorrar={() => setConfirmando(v)}
                      borrando={borrando && confirmando?.id === v.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
    </>
  );
}
