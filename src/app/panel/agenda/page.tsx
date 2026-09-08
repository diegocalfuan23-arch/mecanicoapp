import { redirect } from "next/navigation";
import { tienePlan } from "@/lib/taller";
import {
  listarCitasDelMes,
  listarCitasDeSemana,
  listarCitasDeDia,
  listarEquipoParaCita,
  listarServiciosParaCita,
} from "./acciones";
import { listarClientesParaSelector } from "../propietarios/acciones";
import { listarVehiculosParaSelector } from "../vehiculos/acciones";
import { VistaAgenda } from "./vista";

function hoyISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" });
}

function lunesDeSemana(fechaIso: string) {
  const d = new Date(`${fechaIso}T00:00:00`);
  const offset = (d.getDay() + 6) % 7; // getDay(): 0=domingo — se corrige a lunes-primero.
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
}

export default async function Agenda({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; semana?: string; dia?: string }>;
}) {
  if (!(await tienePlan("impresionOrden"))) redirect("/panel");

  const { mes, semana, dia } = await searchParams;
  const mesSeleccionado = mes || hoyISO();
  const semanaSeleccionada = lunesDeSemana(semana || hoyISO());
  const diaSeleccionado = dia || hoyISO();

  const [citasMes, citasSemana, citasDia, clientes, vehiculos, equipo, servicios] =
    await Promise.all([
      listarCitasDelMes(mesSeleccionado),
      listarCitasDeSemana(semanaSeleccionada),
      listarCitasDeDia(diaSeleccionado),
      listarClientesParaSelector(),
      listarVehiculosParaSelector(),
      listarEquipoParaCita(),
      listarServiciosParaCita(),
    ]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Agenda</h1>
      </div>

      <VistaAgenda
        mes={mesSeleccionado}
        semana={semanaSeleccionada}
        dia={diaSeleccionado}
        citasMes={citasMes}
        citasSemana={citasSemana}
        citasDia={citasDia}
        clientes={clientes}
        vehiculos={vehiculos}
        equipo={equipo}
        servicios={servicios}
      />
    </>
  );
}
