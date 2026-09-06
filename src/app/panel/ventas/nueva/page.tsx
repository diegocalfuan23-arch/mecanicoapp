import { redirect } from "next/navigation";
import { tienePlan } from "@/lib/taller";
import { listarInventario } from "../../inventario/acciones";
import { listarClientesParaSelector } from "../../propietarios/acciones";
import { NuevaVenta } from "./formulario";

export default async function NuevaVentaPage() {
  if (!(await tienePlan("impresionOrden"))) redirect("/panel");

  const [inventario, clientes] = await Promise.all([
    listarInventario(),
    listarClientesParaSelector(),
  ]);

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold tracking-tight">
        Nueva venta
      </h1>

      <NuevaVenta inventario={inventario} clientes={clientes} />
    </>
  );
}
