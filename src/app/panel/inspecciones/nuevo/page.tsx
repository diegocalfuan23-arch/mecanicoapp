import { redirect } from "next/navigation";
import { tienePlan } from "@/lib/taller";
import { listarClientesParaSelector } from "../../propietarios/acciones";
import { listarVehiculosParaSelector } from "../../vehiculos/acciones";
import { NuevaInspeccion } from "./formulario";

export default async function NuevaInspeccionPage() {
  if (!(await tienePlan("impresionOrden"))) redirect("/panel");

  const [clientes, vehiculos] = await Promise.all([
    listarClientesParaSelector(),
    listarVehiculosParaSelector(),
  ]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">
          Nueva inspección pre-compra
        </h1>
        <p className="mt-2 text-muted-foreground">
          Registra la evaluación del vehículo con cliente y vehículo
          asociados.
        </p>
      </div>

      <NuevaInspeccion clientes={clientes} vehiculos={vehiculos} />
    </>
  );
}
