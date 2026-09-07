import { redirect } from "next/navigation";
import { puedeVerPagos } from "@/lib/taller";
import { resumenDia, listarMovimientosDia } from "./acciones";
import { VistaCaja } from "./vista";

function hoyISO() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export default async function Caja({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  // Mismo criterio de acceso que Pagos: el dueño puede ocultárselo a
  // un ayudante puntual sin tener que bajarle el rol completo.
  if (!(await puedeVerPagos())) redirect("/panel");

  const { fecha } = await searchParams;
  const fechaSeleccionada = fecha || hoyISO();

  const [resumen, movimientos] = await Promise.all([
    resumenDia(fechaSeleccionada),
    listarMovimientosDia(fechaSeleccionada),
  ]);

  if (!resumen.ok) redirect("/panel");

  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Caja</h1>
        <p className="mt-2 text-muted-foreground">
          Lo que entró y salió en efectivo y otros medios, día por día.
        </p>
      </div>

      <VistaCaja
        fecha={fechaSeleccionada}
        resumen={resumen}
        movimientos={movimientos}
      />
    </>
  );
}
