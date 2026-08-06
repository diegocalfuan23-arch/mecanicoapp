"use client";

import { useState } from "react";
import { ListaDeudas } from "./lista";
import { pesos, fecha } from "@/lib/formato";

type Deuda = React.ComponentProps<typeof ListaDeudas>["deudas"][number];

type Cobro = {
  id: string;
  monto: number;
  fecha: Date;
  descripcion: string | null;
  patente: string;
  propietario: string | null;
};

function ListaCobros({ cobros }: { cobros: Cobro[] }) {
  if (cobros.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground">
          Todavía no has registrado ningún cobro.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {cobros.map((c) => (
        <li
          key={c.id}
          className="flex flex-wrap items-baseline justify-between gap-4 rounded-xl border border-border bg-card p-4 sm:p-6"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-mono font-medium">{c.patente}</span>
              <span className="text-[13px] text-muted-foreground">
                {fecha(c.fecha)}
              </span>
            </div>
            <p className="mt-2 text-[15px]">
              {c.descripcion ?? "Sin detalle del trabajo"}
            </p>
            <p className="mt-2 text-[13px] text-muted-foreground">
              {c.propietario ?? "Sin dueño registrado"}
            </p>
          </div>
          <span className="font-medium">{pesos(c.monto)}</span>
        </li>
      ))}
    </ul>
  );
}

export function VistasPagos({
  deudas,
  cobros,
  pendiente,
  cobrado,
}: {
  deudas: Deuda[];
  cobros: Cobro[];
  pendiente: number;
  cobrado: number;
}) {
  const [vista, setVista] = useState<"cobrar" | "cobrado">("cobrar");
  const enCobrar = vista === "cobrar";

  return (
    <>
      {/* Dos pestañas: lo que falta cobrar y lo que ya entró. */}
      <div
        role="tablist"
        className="flex gap-2 rounded-lg border border-border p-1"
      >
        {(
          [
            ["cobrar", "Por cobrar"],
            ["cobrado", "Cobrado"],
          ] as const
        ).map(([valor, texto]) => (
          <button
            key={valor}
            role="tab"
            aria-selected={vista === valor}
            onClick={() => setVista(valor)}
            className={`flex-1 rounded-lg px-4 py-2 text-[14px] font-medium transition-colors ${
              vista === valor
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {texto}
          </button>
        ))}
      </div>

      {/* El monto de la vista activa: el único acento de la pantalla. */}
      <div className="mt-4 rounded-xl border border-border bg-card p-6">
        <span className="text-[13px] tracking-wide text-muted-foreground uppercase">
          {enCobrar ? "Te deben en total" : "Cobrado este mes"}
        </span>
        <p className="mt-2 text-[30px] leading-none font-bold text-acento sm:text-[40px]">
          {pesos(enCobrar ? pendiente : cobrado)}
        </p>
      </div>

      <div className="mt-8">
        {enCobrar ? (
          <ListaDeudas deudas={deudas} />
        ) : (
          <ListaCobros cobros={cobros} />
        )}
      </div>
    </>
  );
}
