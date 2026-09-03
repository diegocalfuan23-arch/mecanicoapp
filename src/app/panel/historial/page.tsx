import { Buscador } from "./buscador";
import { tienePlan } from "@/lib/taller";

export default async function Historial() {
  const tieneImpresion = await tienePlan("impresionOrden");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">
          Historial por patente
        </h1>
        <p className="mt-2 text-muted-foreground">
          Escribe la patente y mira todo lo que le has hecho a ese auto.
        </p>
      </div>

      <Buscador tieneImpresion={tieneImpresion} />
    </div>
  );
}
