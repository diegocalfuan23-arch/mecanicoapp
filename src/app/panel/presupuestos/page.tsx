import { redirect } from "next/navigation";
import Link from "next/link";
import { listarPresupuestos } from "./acciones";
import { tienePlan } from "@/lib/taller";
import { ListaPresupuestos } from "./lista";
import { HugeiconsIcon } from "@hugeicons/react";
import { AddIcon } from "@hugeicons/core-free-icons";

export default async function Presupuestos() {
  if (!(await tienePlan("impresionOrden"))) redirect("/panel");

  const presupuestos = await listarPresupuestos();

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">
            Presupuestos
          </h1>
          {presupuestos.length === 0 && (
            <p className="mt-2 text-muted-foreground">
              Cotiza antes de que el auto entre al taller.
            </p>
          )}
        </div>
        <Link
          href="/panel/presupuestos/nuevo"
          aria-label="Nuevo presupuesto"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 sm:size-auto sm:rounded-lg sm:px-6 sm:py-2 sm:font-medium"
        >
          <HugeiconsIcon icon={AddIcon} className="size-5 sm:hidden" />
          <span className="hidden sm:inline">Nuevo presupuesto</span>
        </Link>
      </div>

      <ListaPresupuestos presupuestos={presupuestos} />
    </>
  );
}
