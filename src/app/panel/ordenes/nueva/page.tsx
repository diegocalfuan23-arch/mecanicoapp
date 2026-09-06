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
        <h1 className="text-xl font-semibold tracking-tight">
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
