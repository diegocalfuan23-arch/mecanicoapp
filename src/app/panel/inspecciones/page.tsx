import { redirect } from "next/navigation";
import Link from "next/link";
import { listarInspecciones } from "./acciones";
import { tienePlan } from "@/lib/taller";
import { ListaInspecciones } from "./lista";
import { HugeiconsIcon } from "@hugeicons/react";
import { AddIcon } from "@hugeicons/core-free-icons";

export default async function Inspecciones() {
  if (!(await tienePlan("impresionOrden"))) redirect("/panel");

  const inspecciones = await listarInspecciones();

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">
            Inspecciones pre-compra
          </h1>
          {inspecciones.length === 0 && (
            <p className="mt-2 text-muted-foreground">
              Evalúa un vehículo antes de que el cliente lo compre.
            </p>
          )}
        </div>
        <Link
          href="/panel/inspecciones/nuevo"
          aria-label="Nueva inspección"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 sm:size-auto sm:rounded-lg sm:px-6 sm:py-2 sm:font-medium"
        >
          <HugeiconsIcon icon={AddIcon} className="size-5 sm:hidden" />
          <span className="hidden sm:inline">Nueva inspección</span>
        </Link>
      </div>

      <ListaInspecciones inspecciones={inspecciones} />
    </>
  );
}
