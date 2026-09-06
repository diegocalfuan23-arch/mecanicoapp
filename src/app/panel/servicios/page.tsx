import { redirect } from "next/navigation";
import { tienePlan, puedeVerInventario } from "@/lib/taller";
import { listarServicios } from "./acciones";
import { listarInventario } from "../inventario/acciones";
import { TablaServicios } from "./tabla";

export default async function Servicios() {
  // Plan Serviteca, y solo dueño/jefe de taller — si alguien entra
  // directo por URL sin el plan o el rol, no basta con ocultar el
  // link del sidebar.
  if (!(await tienePlan("impresionOrden"))) redirect("/panel");
  if (!(await puedeVerInventario())) redirect("/panel");

  const [servicios, inventario] = await Promise.all([
    listarServicios(),
    listarInventario(),
  ]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Servicios</h1>
        <p className="mt-2 text-muted-foreground">
          {servicios.length === 0
            ? "El checklist de servicios que aparece al cerrar una orden."
            : `${servicios.length} ${servicios.length === 1 ? "servicio" : "servicios"} configurados.`}
        </p>
      </div>

      <TablaServicios servicios={servicios} inventario={inventario} />
    </>
  );
}
