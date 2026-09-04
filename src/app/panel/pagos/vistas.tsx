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
  metodoPago: string | null;
  cuotas: number | null;
  patente: string;
  propietario: string | null;
};

const NOMBRE_METODO_PAGO: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  debito: "Débito",
  credito: "Crédito",
};

function textoMetodoPago(c: Pick<Cobro, "metodoPago" | "cuotas">) {
  if (!c.metodoPago) return null;
  const nombre = NOMBRE_METODO_PAGO[c.metodoPago] ?? c.metodoPago;
  if (c.metodoPago === "credito" && c.cuotas) {
    return `${nombre} · ${c.cuotas} ${c.cuotas === 1 ? "cuota" : "cuotas"}`;
  }
  return nombre;
}

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
    // Dos columnas en pantalla ancha: un cobro es poco texto, y en una
    // sola columna cada fila quedaba con medio ancho vacío.
    <ul className="grid gap-4 lg:grid-cols-2">
      {cobros.map((c) => (
        <li
          key={c.id}
          className="rounded-xl border border-border bg-card p-4 sm:p-6"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="font-mono font-medium">{c.patente}</span>
            <span className="text-lg font-semibold tabular-nums">
              {pesos(c.monto)}
            </span>
          </div>
          <p className="mt-2 text-[15px]">
            {c.descripcion ?? "Sin detalle del trabajo"}
          </p>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {c.propietario ?? "Sin dueño registrado"} · {fecha(c.fecha)}
            {textoMetodoPago(c) && ` · ${textoMetodoPago(c)}`}
          </p>
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
      {/* El total y las pestañas comparten fila: por separado, cada uno
          ocupaba todo el ancho para un solo dato. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
        <div className="rounded-xl border border-border bg-card p-6 sm:min-w-64">
          <span className="text-[13px] tracking-wide text-muted-foreground uppercase">
            {enCobrar ? "Te deben en total" : "Cobrado este mes"}
          </span>
          <p className="mt-2 text-[30px] leading-none font-bold text-acento sm:text-[40px]">
            {pesos(enCobrar ? pendiente : cobrado)}
          </p>
        </div>

        <div
          role="tablist"
          className="flex gap-2 rounded-xl border border-border p-1 sm:flex-1 sm:flex-col"
        >
          {(
            [
              ["cobrar", "Por cobrar", deudas.length],
              ["cobrado", "Cobrado", cobros.length],
            ] as const
          ).map(([valor, texto, cuantos]) => (
            <button
              key={valor}
              role="tab"
              aria-selected={vista === valor}
              onClick={() => setVista(valor)}
              className={`flex flex-1 items-center justify-between gap-4 rounded-lg px-4 py-2 text-[14px] font-medium transition-colors ${
                vista === valor
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{texto}</span>
              <span className="text-[13px] tabular-nums opacity-70">
                {cuantos}
              </span>
            </button>
          ))}
        </div>
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
