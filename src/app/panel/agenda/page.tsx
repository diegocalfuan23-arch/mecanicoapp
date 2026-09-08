import { redirect } from "next/navigation";
import { tienePlan } from "@/lib/taller";
import { listarCitasDelMes } from "./acciones";
import { listarClientesParaSelector } from "../propietarios/acciones";
import { listarVehiculosParaSelector } from "../vehiculos/acciones";
import { VistaAgenda } from "./vista";

function hoyISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" });
}

export default async function Agenda({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  if (!(await tienePlan("impresionOrden"))) redirect("/panel");

  const { mes } = await searchParams;
  const mesSeleccionado = mes || hoyISO();

  const [citas, clientes, vehiculos] = await Promise.all([
    listarCitasDelMes(mesSeleccionado),
    listarClientesParaSelector(),
    listarVehiculosParaSelector(),
  ]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Agenda</h1>
      </div>

      <VistaAgenda
        mes={mesSeleccionado}
        citas={citas}
        clientes={clientes}
        vehiculos={vehiculos}
      />
    </>
  );
}
