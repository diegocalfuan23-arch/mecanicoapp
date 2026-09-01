import { Suspense } from "react";
import {
  listarOrdenes,
  listarVehiculosParaOrden,
  listarTecnicos,
} from "./acciones";
import { listarInventario } from "../inventario/acciones";
import { tienePlan } from "@/lib/taller";
import { ListaOrdenes } from "./lista";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ClipboardIcon,
  CarFrontIcon,
  Tick02Icon,
  ListViewIcon,
} from "@hugeicons/core-free-icons";

function Kpi({
  etiqueta,
  valor,
  ayuda,
  icon,
}: {
  etiqueta: string;
  valor: string;
  ayuda: string;
  icon: typeof ClipboardIcon;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-acento/15 text-acento">
        <HugeiconsIcon icon={icon} className="size-[18px]" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{etiqueta}</p>
        <p className="text-xl font-semibold tracking-tight tabular-nums">
          {valor}
        </p>
        <p className="text-[10px] text-muted-foreground">{ayuda}</p>
      </div>
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
  const entregadas = ordenes.filter((o) => o.estado === "entregado").length;

  // Un vehículo sigue en el taller mientras la orden no se entregue
  // — hoy es el mismo criterio que "abiertas", sin un tope de
  // espacios inventado (no existe ese dato en la app).
  const enTaller = abiertas;

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
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi
            etiqueta="Órdenes totales"
            valor={String(ordenes.length)}
            ayuda="desde siempre"
            icon={ListViewIcon}
          />
          <Kpi
            etiqueta="Órdenes abiertas"
            valor={String(abiertas)}
            ayuda="en proceso ahora"
            icon={ClipboardIcon}
          />
          <Kpi
            etiqueta="Entregadas"
            valor={String(entregadas)}
            ayuda="ya retiradas"
            icon={Tick02Icon}
          />
          <Kpi
            etiqueta="Vehículos en taller"
            valor={String(enTaller)}
            ayuda="sin entregar"
            icon={CarFrontIcon}
          />
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
