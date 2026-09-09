import { notFound } from "next/navigation";
import { obtenerClienteCRM } from "../acciones";
import { tienePlan } from "@/lib/taller";
import { DetalleClienteCRM } from "./detalle";

export default async function DetalleCliente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [cliente, tieneImpresion] = await Promise.all([
    obtenerClienteCRM(id),
    tienePlan("impresionOrden"),
  ]);

  if (!cliente) notFound();

  return <DetalleClienteCRM cliente={cliente} tieneImpresion={tieneImpresion} />;
}
