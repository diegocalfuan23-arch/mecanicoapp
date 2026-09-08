import { redirect } from "next/navigation";
import { tienePlan } from "@/lib/taller";
import { listarCompras, listarProveedores } from "./acciones";
import { VistaCompras } from "./vista";

export default async function Compras() {
  if (!(await tienePlan("impresionOrden"))) redirect("/panel");

  const [compras, proveedores] = await Promise.all([
    listarCompras(),
    listarProveedores(),
  ]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Compras</h1>
      </div>

      <VistaCompras compras={compras} proveedores={proveedores} />
    </>
  );
}
