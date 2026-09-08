import { redirect } from "next/navigation";
import { tienePlan } from "@/lib/taller";
import { listarProveedores, listarRepuestosParaCompra } from "../acciones";
import { NuevaCompra } from "./formulario";

export default async function NuevaCompraPage() {
  if (!(await tienePlan("impresionOrden"))) redirect("/panel");

  const [proveedores, repuestos] = await Promise.all([
    listarProveedores(),
    listarRepuestosParaCompra(),
  ]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Nueva compra</h1>
      </div>

      <NuevaCompra proveedores={proveedores} repuestos={repuestos} />
    </>
  );
}
