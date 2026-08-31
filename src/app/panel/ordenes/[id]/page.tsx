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
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href="/panel/ordenes"
          className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          ← Volver
        </Link>
        <span className="text-[13px] text-muted-foreground">
          OT-{orden.numero} · <span className="font-mono">{orden.patente}</span>
          {orden.marca && ` · ${orden.marca} ${orden.modelo}`}
        </span>
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
