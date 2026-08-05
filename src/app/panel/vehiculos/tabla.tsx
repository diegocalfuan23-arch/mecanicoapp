"use client";

import { useState } from "react";
import { FormularioVehiculo } from "./formulario";

type Vehiculo = {
  id: string;
  patente: string;
  vin: string | null;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  color: string | null;
  tipo: string | null;
  motor: string | null;
  ejes: number | null;
  procedencia: string | null;
  kilometrajeInicial: number | null;
  copropietario: string | null;
  primeraVez: boolean;
  propietario: string | null;
  propietarioTelefono: string | null;
};

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
  "",
];

export function TablaVehiculos({ vehiculos }: { vehiculos: Vehiculo[] }) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");

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

  if (abierto) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-lg font-medium">Nuevo vehículo</h2>
        <div className="mt-6">
          <FormularioVehiculo onListo={() => setAbierto(false)} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por patente, marca o dueño"
          className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30 sm:max-w-sm"
        />
        <button
          onClick={() => setAbierto(true)}
          className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-opacity hover:opacity-90"
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
              className="mt-4 text-primary hover:underline"
            >
              Registrar el primero
            </button>
          )}
        </div>
      ) : (
        <div className="scroll-discreto mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-border bg-card">
                {COLUMNAS.map((c) => (
                  <th
                    key={c}
                    className="px-4 py-3 text-left font-medium whitespace-nowrap text-muted-foreground"
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
                  <td className="px-4 py-3 font-mono font-medium whitespace-nowrap">
                    {v.patente}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {v.tipo ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
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
                  <td className="px-4 py-3 whitespace-nowrap">
                    {v.modelo ?? "—"}
                    {v.anio && (
                      <span className="text-muted-foreground"> {v.anio}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {v.color ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {v.motor ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {v.ejes ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                    {v.kilometrajeInicial
                      ? v.kilometrajeInicial.toLocaleString("es-CL")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {v.procedencia ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-[13px] whitespace-nowrap text-muted-foreground">
                    {v.vin ? (
                      <span title={v.vin}>{v.vin.slice(0, 6)}…</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {v.propietario ?? "—"}
                    {v.copropietario && (
                      <span className="block text-[13px] text-muted-foreground">
                        con {v.copropietario}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {v.primeraVez && (
                      <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[12px] font-medium text-primary">
                        Primera vez
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
