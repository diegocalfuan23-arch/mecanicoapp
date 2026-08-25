import { listarPropietarios } from "./acciones";
import { tienePlan } from "@/lib/taller";
import { TablaPropietarios } from "./tabla";

export default async function Propietarios() {
  const [propietarios, tieneImpresion] = await Promise.all([
    listarPropietarios(),
    tienePlan("impresionOrden"),
  ]);
  // Cliente es el que volvió: dos visitas o más.
  const clientes = propietarios.filter((p) => p.visitas >= 2).length;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Propietarios</h1>
        <p className="mt-2 text-muted-foreground">
          {propietarios.length === 0
            ? "Los dueños de los autos que atiendes."
            : clientes > 0
              ? `${propietarios.length} en total, ${clientes} ${clientes === 1 ? "que ha vuelto" : "que han vuelto"}.`
              : `${propietarios.length} ${propietarios.length === 1 ? "propietario" : "propietarios"}, ninguno ha vuelto todavía.`}
        </p>
      </div>

      <TablaPropietarios
        propietarios={propietarios}
        tieneImpresion={tieneImpresion}
      />
    </>
  );
}
