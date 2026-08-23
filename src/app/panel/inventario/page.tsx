import { listarInventario } from "./acciones";
import { TablaInventario } from "./tabla";

export default async function Inventario() {
  const insumos = await listarInventario();
  const bajos = insumos.filter(
    (i) => i.stock <= i.stockMinimo && i.stockMinimo > 0
  ).length;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Inventario</h1>
        <p className="mt-2 text-muted-foreground">
          {insumos.length === 0
            ? "Aceite, líquido de frenos, insumos que compras por adelantado."
            : bajos > 0
              ? `${insumos.length} en total, ${bajos} ${bajos === 1 ? "a punto de acabarse" : "a punto de acabarse"}.`
              : `${insumos.length} ${insumos.length === 1 ? "insumo" : "insumos"} registrados.`}
        </p>
      </div>

      <TablaInventario insumos={insumos} />
    </>
  );
}
