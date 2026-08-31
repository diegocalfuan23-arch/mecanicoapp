import { Suspense } from "react";
import {
  listarOrdenes,
  listarVehiculosParaOrden,
  listarTecnicos,
} from "./acciones";
import { listarInventario } from "../inventario/acciones";
import { tienePlan } from "@/lib/taller";
import { ListaOrdenes } from "./lista";

function Kpi({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-[12px] text-muted-foreground">{etiqueta}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
        {valor}
      </p>
    </div>
  );
}

export default async function Ordenes() {
  const [ordenes, vehiculos, inventario, tecnicos, tieneImpresion] =
    await Promise.all([
      listarOrdenes(),
      listarVehiculosParaOrden(),
      listarInventario(),
      listarTecnicos(),
      tienePlan("impresionOrden"),
    ]);

  const abiertas = ordenes.filter((o) => o.estado !== "entregado").length;
  const cerradas = ordenes.length - abiertas;
  const esperandoRepuesto = ordenes.filter(
    (o) => o.estado === "esperando_repuesto"
  ).length;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">
          Órdenes de trabajo
        </h1>
        <p className="mt-2 text-muted-foreground">
          {ordenes.length === 0
            ? "Los autos que entran al taller."
            : `${abiertas} ${abiertas === 1 ? "orden abierta" : "órdenes abiertas"}.`}
        </p>
      </div>

      {ordenes.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi etiqueta="Totales" valor={ordenes.length} />
          <Kpi etiqueta="Abiertas" valor={abiertas} />
          <Kpi etiqueta="Cerradas" valor={cerradas} />
          <Kpi etiqueta="Esperando repuesto" valor={esperandoRepuesto} />
        </div>
      )}

      <Suspense>
        <ListaOrdenes
          ordenes={ordenes}
          vehiculos={vehiculos}
          inventario={inventario}
          tecnicos={tecnicos}
          tieneImpresion={tieneImpresion}
        />
      </Suspense>
    </>
  );
}
