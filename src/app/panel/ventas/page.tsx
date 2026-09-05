import { redirect } from "next/navigation";
import { tienePlan } from "@/lib/taller";
import { listarInventario } from "../inventario/acciones";
import { listarVentas } from "./acciones";
import { Carrito } from "./carrito";
import { ListaVentas } from "./lista";

export default async function VentasPOS() {
  if (!(await tienePlan("impresionOrden"))) redirect("/panel");

  const [inventario, ventas] = await Promise.all([
    listarInventario(),
    listarVentas(),
  ]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Ventas POS</h1>
        <p className="mt-2 text-muted-foreground">
          Vende un repuesto o un ítem suelto, sin abrir una orden de trabajo.
        </p>
      </div>

      <Carrito inventario={inventario} />

      {ventas.length > 0 && (
        <div className="mt-10">
          <h2 className="text-[15px] font-medium">Ventas recientes</h2>
          <div className="mt-4">
            <ListaVentas ventas={ventas} />
          </div>
        </div>
      )}
    </>
  );
}
