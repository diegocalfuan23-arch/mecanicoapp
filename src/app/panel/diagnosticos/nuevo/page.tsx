import Link from "next/link";
import { redirect } from "next/navigation";
import { tienePlan } from "@/lib/taller";
import { listarTecnicos } from "../../ordenes/acciones";
import { NuevoDiagnostico } from "./formulario";

export default async function NuevoDiagnosticoPage() {
  if (!(await tienePlan("impresionOrden"))) redirect("/panel");

  const tecnicos = await listarTecnicos();

  return (
    <>
      <div className="mb-6">
        <Link
          href="/panel/diagnosticos"
          className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          ← Volver
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">
          Nuevo diagnóstico
        </h1>
      </div>

      <NuevoDiagnostico tecnicos={tecnicos} />
    </>
  );
}
