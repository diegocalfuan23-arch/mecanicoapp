import { notFound } from "next/navigation";
import { obtenerClienteCRM } from "../acciones";
import { tienePlan } from "@/lib/taller";
import { listarEquipoParaCita, listarServiciosParaCita } from "../../agenda/acciones";
import { DetalleClienteCRM } from "./detalle";

export default async function DetalleCliente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [cliente, tieneImpresion, equipo, servicios] = await Promise.all([
    obtenerClienteCRM(id),
    tienePlan("impresionOrden"),
    listarEquipoParaCita(),
    listarServiciosParaCita(),
  ]);

  if (!cliente) notFound();

  return (
    <DetalleClienteCRM
      cliente={cliente}
      tieneImpresion={tieneImpresion}
      equipo={equipo}
      servicios={servicios}
    />
  );
}
