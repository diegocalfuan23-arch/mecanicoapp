import { redirect } from "next/navigation";
import Link from "next/link";
import { listarDiagnosticos } from "./acciones";
import { tienePlan } from "@/lib/taller";
import { ListaDiagnosticos } from "./lista";
import { HugeiconsIcon } from "@hugeicons/react";
import { AddIcon } from "@hugeicons/core-free-icons";

export default async function Diagnosticos() {
  if (!(await tienePlan("impresionOrden"))) redirect("/panel");

  const diagnosticos = await listarDiagnosticos();

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">
            Diagnósticos
          </h1>
          {diagnosticos.length === 0 && (
            <p className="mt-2 text-muted-foreground">
              Revisa el auto antes de decidir qué reparar.
            </p>
          )}
        </div>
        <Link
          href="/panel/diagnosticos/nuevo"
          aria-label="Nuevo diagnóstico"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 sm:size-auto sm:rounded-lg sm:px-6 sm:py-2 sm:font-medium"
        >
          <HugeiconsIcon icon={AddIcon} className="size-5 sm:hidden" />
          <span className="hidden sm:inline">Nuevo diagnóstico</span>
        </Link>
      </div>

      <ListaDiagnosticos diagnosticos={diagnosticos} />
    </>
  );
}
