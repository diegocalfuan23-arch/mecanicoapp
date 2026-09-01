import Link from "next/link";
import {
  listarVehiculosParaOrden,
  listarTecnicos,
} from "../acciones";
import { listarInventario } from "../../inventario/acciones";
import { tienePlan } from "@/lib/taller";
import { Abrir } from "./abrir";

export default async function NuevaOrden({
  searchParams,
}: {
  searchParams: Promise<{ vehiculo?: string }>;
}) {
  const { vehiculo } = await searchParams;

  const [vehiculos, inventario, tecnicos, tieneImpresion] = await Promise.all(
    [
      listarVehiculosParaOrden(),
      listarInventario(),
      listarTecnicos(),
      tienePlan("impresionOrden"),
    ]
  );

  return (
    <>
      <div className="mb-6">
        <Link
          href="/panel/ordenes"
          className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          ← Volver a órdenes
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Ingresar vehículo
        </h1>
        <p className="mt-1 text-muted-foreground">
          Se abre la orden con lo que reporta el cliente. El detalle del
          trabajo se completa después.
        </p>
      </div>

      <Abrir
        vehiculos={vehiculos}
        vehiculoIdInicial={vehiculo}
        tieneImpresion={tieneImpresion}
        inventario={inventario}
        tecnicos={tecnicos}
      />
    </>
  );
}
