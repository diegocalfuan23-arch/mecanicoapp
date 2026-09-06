import { notFound } from "next/navigation";
import {
  obtenerOrden,
  listarTecnicos,
} from "../acciones";
import { listarServicios } from "../../servicios/acciones";
import { tienePlan } from "@/lib/taller";
import { EditarOrden } from "./editar";

export default async function DetalleOrden({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [orden, tecnicos, servicios, tieneImpresion] = await Promise.all([
    obtenerOrden(id),
    listarTecnicos(),
    listarServicios(),
    tienePlan("impresionOrden"),
  ]);

  if (!orden) notFound();

  return (
    <>
      <p className="mb-4 text-[13px] text-muted-foreground">
        OT-{orden.numero} · <span className="font-mono">{orden.patente}</span>
        {orden.marca && ` · ${orden.marca} ${orden.modelo}`}
      </p>

      <EditarOrden
        orden={orden}
        tieneImpresion={tieneImpresion}
        tecnicos={tecnicos}
        servicios={servicios}
      />
    </>
  );
}
