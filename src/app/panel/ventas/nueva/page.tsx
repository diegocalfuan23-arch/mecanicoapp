import { redirect } from "next/navigation";
import { tienePlan } from "@/lib/taller";
import { listarInventario, listarServicios } from "../../inventario/acciones";
import { listarClientesParaSelector } from "../../propietarios/acciones";
import { listarVehiculosParaSelector } from "../../vehiculos/acciones";
import { NuevaVenta } from "./formulario";

export default async function NuevaVentaPage() {
  if (!(await tienePlan("impresionOrden"))) redirect("/panel");

  const [inventario, servicios, clientes, vehiculos] = await Promise.all([
    listarInventario(),
    listarServicios(),
    listarClientesParaSelector(),
    listarVehiculosParaSelector(),
  ]);

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold tracking-tight">
        Nueva venta
      </h1>

      <NuevaVenta
        inventario={inventario}
        servicios={servicios}
        clientes={clientes}
        vehiculos={vehiculos}
      />
    </>
  );
}
