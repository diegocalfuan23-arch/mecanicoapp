"use client";

import { useState } from "react";
import { Menu } from "@base-ui/react/menu";
import { useRouter } from "next/navigation";
import { FormularioVehiculo, type VehiculoEditable } from "./formulario";
import { eliminarVehiculo } from "./acciones";

type Vehiculo = VehiculoEditable;

// VIN y ejes existen en la ficha del vehículo, pero en la tabla solo
// ocupaban ancho: no son datos que se miren de un vistazo.
const COLUMNAS = [
  "Patente",
  "Tipo",
  "Marca",
  "Modelo",
  "Color",
  "Motor",
  "Km",
  "Procedencia",
  "Dueño",
  "Acciones",
];

/**
 * Clic en la fila ya abre para editar (ver más abajo) — este menú
 * queda solo para lo que no es "tocar y editar": ver el historial
 * completo, o eliminar la ficha.
 *
 * Usa Menu de Base UI en vez de calcular la posición a mano con
 * getBoundingClientRect(): "main" tiene overflow-y-auto, y un
 * ancestro scrolleable puede hacer que position:fixed se posicione
 * relativo a él en vez de a la ventana — el menú manual terminaba
 * flotando lejos del botón que lo abrió. Menu.Positioner se encarga
 * del anclaje real, igual que ya hace Selector con Select.Positioner.
 */
function Acciones({ v, onBorrar }: { v: Vehiculo; onBorrar: () => void }) {
  const router = useRouter();

  const opcion =
    "block w-full px-4 py-2 text-left text-[14px] outline-none transition-colors data-highlighted:bg-background";

  return (
    <Menu.Root>
      <Menu.Trigger
        onClick={(e) => e.stopPropagation()}
        aria-label={`Acciones de ${v.patente}`}
        className="rounded-lg border border-border p-2 transition-colors hover:bg-background"
      >
        <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
          <circle cx="4" cy="10" r="1.5" fill="currentColor" />
          <circle cx="10" cy="10" r="1.5" fill="currentColor" />
          <circle cx="16" cy="10" r="1.5" fill="currentColor" />
        </svg>
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner className="z-50 outline-none" sideOffset={4} align="end">
          <Menu.Popup className="w-40 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg outline-none">
            <Menu.Item
              onClick={() => router.push(`/panel/historial/${v.id}`)}
              className={opcion}
            >
              Ver historial
            </Menu.Item>
            <Menu.Item
              onClick={onBorrar}
              className={`${opcion} text-destructive data-highlighted:bg-destructive/10`}
            >
              Eliminar
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export function TablaVehiculos({
  vehiculos,
  tieneImpresion,
}: {
  vehiculos: Vehiculo[];
  tieneImpresion: boolean;
}) {
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
            autoguardar={!!editando}
            tieneImpresion={tieneImpresion}
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
                onClick={() => setEditando(v)}
                className="cursor-pointer rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
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

                <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                  <Acciones v={v} onBorrar={() => setConfirmando(v)} />
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
                  onClick={() => setEditando(v)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-card/50"
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
                  <td className="px-4 py-4 whitespace-nowrap tabular-nums">
                    {v.kilometrajeInicial
                      ? v.kilometrajeInicial.toLocaleString("es-CL")
                      : "—"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {v.procedencia ?? "—"}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {v.propietario ?? "—"}
                    {v.copropietario && (
                      <span className="block text-[13px] text-muted-foreground">
                        con {v.copropietario}
                      </span>
                    )}
                  </td>
                  <td
                    className="px-4 py-4 whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Acciones v={v} onBorrar={() => setConfirmando(v)} />
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
