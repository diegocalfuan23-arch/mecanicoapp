import { Suspense } from "react";
import { listarOrdenes, listarVehiculosParaOrden } from "./acciones";
import { listarInventario } from "../inventario/acciones";
import { tienePlan } from "@/lib/taller";
import { ListaOrdenes } from "./lista";

export default async function Ordenes() {
  const [ordenes, vehiculos, inventario, tieneImpresion] = await Promise.all([
    listarOrdenes(),
    listarVehiculosParaOrden(),
    listarInventario(),
    tienePlan("impresionOrden"),
  ]);

  const abiertas = ordenes.filter((o) => o.estado !== "entregado").length;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">
          Órdenes de trabajo
        </h1>
        <p className="mt-2 text-muted-foreground">
          {ordenes.length === 0
            ? "Los autos que entran al taller."
            : `${abiertas} ${abiertas === 1 ? "orden abierta" : "órdenes abiertas"}.`}
        </p>
      </div>

      <Suspense>
        <ListaOrdenes
          ordenes={ordenes}
          vehiculos={vehiculos}
          inventario={inventario}
          tieneImpresion={tieneImpresion}
        />
      </Suspense>
    </>
  );
}
