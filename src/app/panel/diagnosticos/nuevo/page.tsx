import { redirect } from "next/navigation";
import { tienePlan } from "@/lib/taller";
import { listarTecnicos } from "../../ordenes/acciones";
import { NuevoDiagnostico } from "./formulario";

export default async function NuevoDiagnosticoPage() {
  if (!(await tienePlan("impresionOrden"))) redirect("/panel");

  const tecnicos = await listarTecnicos();

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold tracking-tight">
        Nuevo diagnóstico
      </h1>

      <NuevoDiagnostico tecnicos={tecnicos} />
    </>
  );
}
