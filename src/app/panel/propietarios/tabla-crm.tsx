"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Formulario } from "./tabla";
import type { ClienteCRM } from "./acciones";

function nombreCompleto(c: ClienteCRM) {
  return [c.nombre, c.apellido].filter(Boolean).join(" ");
}

function tiempoRelativo(fecha: Date | null) {
  if (!fecha) return "—";
  const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000);
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "hace 1 día";
  if (dias < 30) return `hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `hace ${meses} ${meses === 1 ? "mes" : "meses"}`;
  const anios = Math.floor(meses / 12);
  return `hace ${anios} ${anios === 1 ? "año" : "años"}`;
}

function celdaCsv(valor: string | number | null | undefined) {
  const texto = String(valor ?? "");
  return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function exportarCsv(clientes: ClienteCRM[]) {
  const encabezados = [
    "Cliente", "Documento", "Rating", "NPS", "Último contacto",
    "Email", "Teléfono", "Órdenes", "Presupuestos", "Ventas", "Citas", "Vehículos",
  ];
  const filas = clientes.map((c) => [
    nombreCompleto(c), c.rut, c.rating, c.nps,
    c.ultimoContacto ? new Date(c.ultimoContacto).toISOString().slice(0, 10) : "",
    c.email, c.telefono, c.ordenes, c.presupuestos, c.ventas, c.citas, c.vehiculos,
  ]);

  const csv = [encabezados, ...filas]
    .map((fila) => fila.map(celdaCsv).join(","))
    .join("\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reporte-crm-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function TablaCRM({
  clientes,
  tieneImpresion,
}: {
  clientes: ClienteCRM[];
  tieneImpresion: boolean;
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);

  const q = busqueda.trim().toLowerCase();
  const filtrados = q
    ? clientes.filter(
        (c) =>
          nombreCompleto(c).toLowerCase().includes(q) ||
          c.rut?.toLowerCase().includes(q)
      )
    : clientes;

  if (creando) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-lg font-medium">Nuevo cliente</h2>
        <div className="mt-6">
          <Formulario
            tieneImpresion={tieneImpresion}
            onListo={() => {
              setCreando(false);
              router.refresh();
            }}
          />
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
          placeholder="Buscar por nombre o documento…"
          className="w-full rounded-lg border border-border bg-card px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30 sm:max-w-sm"
        />
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={() => exportarCsv(filtrados)}>
            Reporte CRM
          </Button>
          <Button onClick={() => setCreando(true)}>+ Nuevo cliente</Button>
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">
            {clientes.length === 0
              ? "Todavía no hay clientes registrados."
              : "Ninguno coincide con esa búsqueda."}
          </p>
          {clientes.length === 0 && (
            <button
              onClick={() => setCreando(true)}
              className="mt-4 text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Registrar el primero
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="mt-4 text-[13px] text-muted-foreground">
            Haz clic en una fila para ver el detalle
          </p>
          <div className="scroll-discreto mt-2 overflow-x-auto rounded-xl border border-border">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-border bg-card">
                  {[
                    "Cliente", "Rating", "NPS", "Último contacto", "Info contacto",
                    "Órdenes", "Presupuestos", "Ventas", "Citas", "Vehículos",
                  ].map((c) => (
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
                {filtrados.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0">
                    <td className="p-0">
                      <Link
                        href={`/panel/propietarios/${c.id}`}
                        className="flex flex-col px-4 py-3 hover:bg-card/50"
                      >
                        <span className="font-medium whitespace-nowrap">
                          {nombreCompleto(c)}
                        </span>
                        {c.rut && (
                          <span className="text-[12px] whitespace-nowrap text-muted-foreground">
                            {c.rut}
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {c.rating ? `${c.rating} / 5` : "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {c.nps ?? "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {tiempoRelativo(c.ultimoContacto)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col text-[13px]">
                        {c.email && <span className="truncate">{c.email}</span>}
                        {c.telefono && (
                          <span className="text-success">{c.telefono}</span>
                        )}
                        {!c.email && !c.telefono && (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                      {c.ordenes}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                      {c.presupuestos}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                      {c.ventas}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                      {c.citas}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                      {c.vehiculos}
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
