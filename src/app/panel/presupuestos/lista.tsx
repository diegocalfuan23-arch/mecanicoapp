"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { aprobarPresupuesto, rechazarPresupuesto } from "./acciones";
import { pesos, fecha } from "@/lib/formato";

type Presupuesto = {
  id: string;
  numero: number;
  patente: string;
  clienteNombre: string | null;
  estado: string;
  fecha: Date;
  total: number;
};

const ESTILO_ESTADO: Record<string, string> = {
  pendiente: "bg-foreground/10 text-foreground",
  aprobado: "bg-acento/15 text-acento",
  rechazado: "text-muted-foreground line-through decoration-1",
};

const TEXTO_ESTADO: Record<string, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

export function ListaPresupuestos({
  presupuestos,
}: {
  presupuestos: Presupuesto[];
}) {
  const router = useRouter();
  const [enCurso, setEnCurso] = useState<string | null>(null);

  async function aprobar(id: string) {
    setEnCurso(id);
    const res = await aprobarPresupuesto(id);
    setEnCurso(null);
    if (res?.ok && res.trabajoId) {
      router.push(`/panel/ordenes/${res.trabajoId}`);
    }
  }

  async function rechazar(id: string) {
    setEnCurso(id);
    await rechazarPresupuesto(id);
    setEnCurso(null);
    router.refresh();
  }

  if (presupuestos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground">
          Todavía no has creado ningún presupuesto.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {presupuestos.map((p) => (
        <li
          key={p.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-6 py-4"
        >
          <Link
            href={`/panel/presupuestos/${p.id}`}
            className="min-w-0 flex-1"
          >
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="font-mono text-lg font-medium">
                {p.patente}
              </span>
              <span className="text-muted-foreground">
                {p.clienteNombre ?? "Sin nombre aún"}
              </span>
              <span
                className={`rounded-full px-2 py-1 text-[12px] font-medium ${
                  ESTILO_ESTADO[p.estado] ?? ""
                }`}
              >
                {TEXTO_ESTADO[p.estado] ?? p.estado}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              PR-{p.numero} · {fecha(p.fecha)}
              {p.total > 0 ? ` · ${pesos(p.total)}` : ""}
            </p>
          </Link>

          {p.estado === "pendiente" && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => rechazar(p.id)}
                disabled={enCurso === p.id}
                className="rounded-lg border border-border px-3 py-1.5 text-[13px] transition-colors hover:bg-background disabled:opacity-60"
              >
                Rechazar
              </button>
              <button
                type="button"
                onClick={() => aprobar(p.id)}
                disabled={enCurso === p.id}
                className="rounded-lg bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {enCurso === p.id ? "Aprobando…" : "Aprobar"}
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
