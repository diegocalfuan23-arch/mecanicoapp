import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listarVehiculos } from "./acciones";
import { tienePlan } from "@/lib/taller";
import { TablaVehiculos } from "./tabla";

export default async function Vehiculos() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) redirect("/entrar");

  const [vehiculos, tieneImpresion] = await Promise.all([
    listarVehiculos(),
    tienePlan("impresionOrden"),
  ]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Vehículos</h1>
        <p className="mt-2 text-muted-foreground">
          {vehiculos.length === 0
            ? "Registra los autos que pasan por el taller."
            : `${vehiculos.length} ${vehiculos.length === 1 ? "vehículo registrado" : "vehículos registrados"}.`}
        </p>
      </div>

      <TablaVehiculos vehiculos={vehiculos} tieneImpresion={tieneImpresion} />
    </>
  );
}
