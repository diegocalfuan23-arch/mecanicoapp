import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerPresupuesto } from "../acciones";
import { DetallePresupuesto } from "./detalle";

export default async function VerPresupuesto({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const presupuesto = await obtenerPresupuesto(id);

  if (!presupuesto) notFound();

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href="/panel/presupuestos"
          className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          ← Volver
        </Link>
        <span className="text-[13px] text-muted-foreground">
          PR-{presupuesto.numero} ·{" "}
          <span className="font-mono">{presupuesto.patente}</span>
        </span>
      </div>

      <DetallePresupuesto presupuesto={presupuesto} />
    </>
  );
}
