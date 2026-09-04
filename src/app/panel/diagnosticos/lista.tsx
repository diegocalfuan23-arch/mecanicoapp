import Link from "next/link";
import { fecha } from "@/lib/formato";

type Diagnostico = {
  id: string;
  numero: number;
  patente: string;
  clienteNombre: string | null;
  tecnicoNombre: string | null;
  estado: string;
  fecha: Date;
};

const ESTILO_ESTADO: Record<string, string> = {
  pendiente: "bg-foreground/10 text-foreground",
  vinculado: "bg-acento/15 text-acento",
};

const TEXTO_ESTADO: Record<string, string> = {
  pendiente: "Pendiente",
  vinculado: "Vinculado a una orden",
};

export function ListaDiagnosticos({
  diagnosticos,
}: {
  diagnosticos: Diagnostico[];
}) {
  if (diagnosticos.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground">
          Todavía no has creado ningún diagnóstico.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {diagnosticos.map((d) => (
        <li key={d.id}>
          <Link
            href={`/panel/diagnosticos/${d.id}`}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-6 py-4 transition-colors hover:border-primary/40"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-mono text-lg font-medium">
                  {d.patente}
                </span>
                <span className="text-muted-foreground">
                  {d.clienteNombre ?? "Sin nombre aún"}
                </span>
                <span
                  className={`rounded-full px-2 py-1 text-[12px] font-medium ${
                    ESTILO_ESTADO[d.estado] ?? ""
                  }`}
                >
                  {TEXTO_ESTADO[d.estado] ?? d.estado}
                </span>
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">
                DX-{d.numero} · {fecha(d.fecha)}
                {d.tecnicoNombre ? ` · ${d.tecnicoNombre}` : ""}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
