import { redirect } from "next/navigation";
import { tienePlan } from "@/lib/taller";
import { NuevoPresupuesto } from "./formulario";

export default async function NuevoPresupuestoPage() {
  if (!(await tienePlan("impresionOrden"))) redirect("/panel");

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold tracking-tight">
        Nuevo presupuesto
      </h1>

      <NuevoPresupuesto />
    </>
  );
}
