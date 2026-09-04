"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { aprobarPresupuesto, rechazarPresupuesto } from "../acciones";
import { pesos, fecha } from "@/lib/formato";

type Item = {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
};

type Presupuesto = {
  id: string;
  numero: number;
  patente: string;
  clienteNombre: string | null;
  clienteTelefono: string | null;
  sintoma: string | null;
  diagnostico: string | null;
  estado: string;
  trabajoId: string | null;
  fecha: Date;
  items: Item[];
};

const TEXTO_ESTADO: Record<string, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

export function DetallePresupuesto({
  presupuesto,
}: {
  presupuesto: Presupuesto;
}) {
  const router = useRouter();
  const [enCurso, setEnCurso] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = presupuesto.items.reduce(
    (s, i) => s + i.cantidad * i.precioUnitario,
    0
  );

  async function aprobar() {
    setEnCurso(true);
    setError(null);
    const res = await aprobarPresupuesto(presupuesto.id);
    setEnCurso(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    if (res?.trabajoId) {
      router.push(`/panel/ordenes/${res.trabajoId}`);
    }
  }

  async function rechazar() {
    setEnCurso(true);
    setError(null);
    await rechazarPresupuesto(presupuesto.id);
    setEnCurso(false);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-mono text-xl font-medium">
          {presupuesto.patente}
        </span>
        <span className="text-muted-foreground">
          {presupuesto.clienteNombre ?? "Sin nombre aún"}
        </span>
        <span className="rounded-full bg-foreground/10 px-2 py-1 text-[12px] font-medium">
          {TEXTO_ESTADO[presupuesto.estado] ?? presupuesto.estado}
        </span>
      </div>
      <p className="mt-1 text-[13px] text-muted-foreground">
        {fecha(presupuesto.fecha)}
        {presupuesto.clienteTelefono ? ` · ${presupuesto.clienteTelefono}` : ""}
      </p>

      {(presupuesto.sintoma || presupuesto.diagnostico) && (
        <div className="mt-6 rounded-xl border border-border bg-card p-4">
          {presupuesto.sintoma && (
            <p className="text-[14px]">
              <span className="text-muted-foreground">Síntoma: </span>
              {presupuesto.sintoma}
            </p>
          )}
          {presupuesto.diagnostico && (
            <p className="mt-2 text-[14px]">
              <span className="text-muted-foreground">Diagnóstico: </span>
              {presupuesto.diagnostico}
            </p>
          )}
        </div>
      )}

      <div className="mt-6">
        <p className="mb-2 text-[13px] font-medium">Cotizado</p>
        {presupuesto.items.length === 0 ? (
          <p className="text-[14px] text-muted-foreground">
            Sin items cotizados.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {presupuesto.items.map((i) => (
              <li
                key={i.id}
                className="flex items-center justify-between gap-4 px-4 py-3 text-[14px]"
              >
                <span>
                  {i.nombre}
                  {i.cantidad > 1 && (
                    <span className="text-muted-foreground"> × {i.cantidad}</span>
                  )}
                </span>
                <span className="tabular-nums">
                  {pesos(i.cantidad * i.precioUnitario)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {total > 0 && (
          <p className="mt-2 text-right text-[15px] font-semibold tabular-nums">
            Total {pesos(total)}
          </p>
        )}
      </div>

      {error && (
        <p className="mt-4 text-[13px] text-destructive" role="alert">
          {error}
        </p>
      )}

      {presupuesto.estado === "pendiente" && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={aprobar}
            disabled={enCurso}
            className="rounded-lg bg-primary px-4 py-2 text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {enCurso ? "Aprobando…" : "Aprobar y crear orden"}
          </button>
          <button
            type="button"
            onClick={rechazar}
            disabled={enCurso}
            className="rounded-lg border border-border px-4 py-2 text-[14px] transition-colors hover:bg-background disabled:opacity-60"
          >
            Rechazar
          </button>
        </div>
      )}

      {presupuesto.estado === "aprobado" && presupuesto.trabajoId && (
        <Link
          href={`/panel/ordenes/${presupuesto.trabajoId}`}
          className="mt-6 inline-block text-[14px] text-acento hover:underline"
        >
          Ver orden generada →
        </Link>
      )}
    </div>
  );
}
