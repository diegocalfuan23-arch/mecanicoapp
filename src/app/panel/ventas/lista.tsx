import { pesos, fecha } from "@/lib/formato";

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
  pagada: "Pagada",
  cotizacion: "Cotización",
};

const TEXTO_METODO: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  otro: "Otro",
};

export function ListaVentas({ ventas }: { ventas: Venta[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {ventas.map((v) => (
        <li
          key={v.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-6 py-4"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="font-medium">
                V-{v.numero}
                {v.patente ? ` · ${v.patente}` : ""}
              </span>
              <span className="text-muted-foreground">
                {v.clienteNombre ?? "Sin nombre"}
              </span>
              <span
                className={`rounded-full px-2 py-1 text-[12px] font-medium ${
                  v.estado === "pagada"
                    ? "bg-acento/15 text-acento"
                    : "bg-foreground/10 text-foreground"
                }`}
              >
                {TEXTO_ESTADO[v.estado] ?? v.estado}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {fecha(v.fecha)}
              {v.metodoPago ? ` · ${TEXTO_METODO[v.metodoPago] ?? v.metodoPago}` : ""}
            </p>
          </div>
          <span className="shrink-0 text-[15px] font-semibold tabular-nums">
            {pesos(v.total)}
          </span>
        </li>
      ))}
    </ul>
  );
}
