import Link from "next/link";
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
      <div className="mb-6">
        <Link
          href="/panel/ordenes"
          className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          ← Volver a órdenes
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">
            OT-{orden.numero}
          </h1>
          <span className="font-mono text-[14px] text-muted-foreground">
            {orden.patente}
          </span>
          {orden.marca && (
            <span className="text-[14px] text-muted-foreground">
              {orden.marca} {orden.modelo}
            </span>
          )}
        </div>
      </div>

      <EditarOrden
        orden={orden}
        tieneImpresion={tieneImpresion}
        tecnicos={tecnicos}
        servicios={servicios}
      />
    </>
  );
}
