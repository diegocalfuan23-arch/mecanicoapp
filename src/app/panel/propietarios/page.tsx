import { listarClientesCRM } from "./acciones";
import { tienePlan } from "@/lib/taller";
import { TablaCRM } from "./tabla-crm";

export default async function Propietarios() {
  const [clientes, tieneImpresion] = await Promise.all([
    listarClientesCRM(),
    tienePlan("impresionOrden"),
  ]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Clientes</h1>
      </div>

      <TablaCRM clientes={clientes} tieneImpresion={tieneImpresion} />
    </>
  );
}
