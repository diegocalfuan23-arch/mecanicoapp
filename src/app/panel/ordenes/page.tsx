import { listarOrdenes, listarVehiculosParaOrden } from "./acciones";
import { ListaOrdenes } from "./lista";

export default async function Ordenes() {
  const [ordenes, vehiculos] = await Promise.all([
    listarOrdenes(),
    listarVehiculosParaOrden(),
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

      <ListaOrdenes ordenes={ordenes} vehiculos={vehiculos} />
    </>
  );
}
