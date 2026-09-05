"use client";

import { useState } from "react";
import Link from "next/link";
import { pesos, fecha } from "@/lib/formato";
import { Button } from "@/components/ui/button";

type Venta = {
  id: string;
  numero: number;
  clienteNombre: string | null;
  patente: string | null;
  estado: string;
  metodoPago: string | null;
  total: number;
  fecha: Date;
};

const TEXTO_ESTADO: Record<string, string> = {
  pagada: "Completada",
  cotizacion: "Cotización",
};

const ESTILO_ESTADO: Record<string, string> = {
  pagada: "bg-acento/15 text-acento",
  cotizacion: "bg-foreground/10 text-foreground",
};

const TEXTO_METODO: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  otro: "Otro",
};

export function ListaVentas({ ventas }: { ventas: Venta[] }) {
  const [busqueda, setBusqueda] = useState("");

  const filtradas = busqueda.trim()
    ? ventas.filter((v) => {
        const q = busqueda.trim().toLowerCase();
        return (
          String(v.numero).includes(q) ||
          v.clienteNombre?.toLowerCase().includes(q) ||
          v.patente?.toLowerCase().includes(q)
        );
      })
    : ventas;

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por número, cliente o patente…"
          className="w-full rounded-lg border border-border bg-card px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30 sm:max-w-sm"
        />
        <Link href="/panel/ventas/nueva" className="shrink-0">
          <Button className="w-full sm:w-auto">Nueva venta</Button>
        </Link>
      </div>

      {filtradas.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">
            {ventas.length === 0
              ? "Todavía no has registrado ninguna venta."
              : "Ninguna coincide con esa búsqueda."}
          </p>
        </div>
      ) : (
        <>
          {/* Tarjetas en el teléfono, tabla desde tablet. */}
          <ul className="mt-6 flex flex-col gap-4 sm:hidden">
            {filtradas.map((v) => (
              <li
                key={v.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">
                    V-{v.numero}
                    {v.patente ? ` · ${v.patente}` : ""}
                  </span>
                  <span className="font-medium tabular-nums">
                    {pesos(v.total)}
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {v.clienteNombre ?? "Cliente ocasional"}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-[12px] font-medium ${
                      ESTILO_ESTADO[v.estado] ?? ""
                    }`}
                  >
                    {TEXTO_ESTADO[v.estado] ?? v.estado}
                  </span>
                  <span className="text-[13px] text-muted-foreground">
                    {fecha(v.fecha)}
                    {v.metodoPago
                      ? ` · ${TEXTO_METODO[v.metodoPago] ?? v.metodoPago}`
                      : ""}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="scroll-discreto mt-6 hidden overflow-x-auto rounded-xl border border-border sm:block">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-border bg-card">
                  {["Número", "Cliente", "Estado", "Pago", "Total", "Fecha"].map(
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
                {filtradas.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-border last:border-0 hover:bg-card/50"
                  >
                    <td className="px-4 py-4 font-medium whitespace-nowrap">
                      V-{v.numero}
                      {v.patente && (
                        <span className="ml-2 font-mono text-[13px] text-muted-foreground">
                          {v.patente}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {v.clienteNombre ?? (
                        <span className="text-muted-foreground">
                          Cliente ocasional
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`rounded-full px-2 py-1 text-[12px] font-medium ${
                          ESTILO_ESTADO[v.estado] ?? ""
                        }`}
                      >
                        {TEXTO_ESTADO[v.estado] ?? v.estado}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {v.metodoPago ? (
                        (TEXTO_METODO[v.metodoPago] ?? v.metodoPago)
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 font-medium whitespace-nowrap tabular-nums">
                      {pesos(v.total)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                      {fecha(v.fecha)}
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
