import Link from "next/link";
import { redirect } from "next/navigation";
import { tienePlan } from "@/lib/taller";
import { listarInventario } from "../../inventario/acciones";
import { NuevaVenta } from "./formulario";

export default async function NuevaVentaPage() {
  if (!(await tienePlan("impresionOrden"))) redirect("/panel");

  const inventario = await listarInventario();

  return (
    <>
      <div className="mb-6">
        <Link
          href="/panel/ventas"
          className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          ← Volver
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Nueva venta
        </h1>
      </div>

      <NuevaVenta inventario={inventario} />
    </>
  );
}
