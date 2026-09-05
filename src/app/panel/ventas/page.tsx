import { redirect } from "next/navigation";
import { tienePlan } from "@/lib/taller";
import { listarVentas } from "./acciones";
import { ListaVentas } from "./lista";

export default async function VentasPOS() {
  if (!(await tienePlan("impresionOrden"))) redirect("/panel");

  const ventas = await listarVentas();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Ventas POS</h1>
        <p className="mt-2 text-muted-foreground">
          Ventas de mostrador, sin pasar por una orden de trabajo.
        </p>
      </div>

      <ListaVentas ventas={ventas} />
    </>
  );
}
