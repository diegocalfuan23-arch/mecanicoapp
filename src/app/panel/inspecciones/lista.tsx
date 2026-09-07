import Link from "next/link";
import { fecha } from "@/lib/formato";

type Inspeccion = {
  id: string;
  numero: number;
  clienteNombre: string | null;
  patente: string | null;
  marca: string | null;
  modelo: string | null;
  fecha: Date;
};

export function ListaInspecciones({
  inspecciones,
}: {
  inspecciones: Inspeccion[];
}) {
  if (inspecciones.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground">
          Todavía no has creado ninguna inspección.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {inspecciones.map((i) => (
        <li key={i.id}>
          <Link
            href={`/panel/inspecciones/${i.id}`}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-6 py-4 transition-colors hover:border-primary/40"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                {i.patente && (
                  <span className="font-mono text-lg font-medium">
                    {i.patente}
                  </span>
                )}
                <span className="text-muted-foreground">
                  {[i.marca, i.modelo].filter(Boolean).join(" ") ||
                    "Sin vehículo asignado"}
                </span>
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">
                IP-{i.numero} · {fecha(i.fecha)}
                {i.clienteNombre ? ` · ${i.clienteNombre}` : ""}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
