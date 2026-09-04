import Link from "next/link";
import { redirect } from "next/navigation";
import { tienePlan } from "@/lib/taller";
import { NuevoPresupuesto } from "./formulario";

export default async function NuevoPresupuestoPage() {
  if (!(await tienePlan("impresionOrden"))) redirect("/panel");

  return (
    <>
      <div className="mb-6">
        <Link
          href="/panel/presupuestos"
          className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          ← Volver
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Nuevo presupuesto
        </h1>
      </div>

      <NuevoPresupuesto />
    </>
  );
}
