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
      <p className="mb-4 text-[13px] text-muted-foreground">
        PR-{presupuesto.numero} ·{" "}
        <span className="font-mono">{presupuesto.patente}</span>
      </p>

      <DetallePresupuesto presupuesto={presupuesto} />
    </>
  );
}
