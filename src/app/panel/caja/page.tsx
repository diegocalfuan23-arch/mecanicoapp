import { redirect } from "next/navigation";
import { puedeVerPagos, tienePlan } from "@/lib/taller";
import { resumenDia, listarMovimientosDia } from "./acciones";
import { VistaCaja } from "./vista";

/**
 * "Hoy" en la zona horaria del taller (Chile), no la del proceso —
 * en producción el servidor corre en UTC, así que ahora.getDate() sin
 * ajustar podía dar un día distinto al que el mecánico ve en su
 * pantalla según la hora del día.
 */
function hoyISO() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Santiago" });
}

export default async function Caja({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  // Mismo criterio de acceso que Pagos (el dueño puede ocultárselo a
  // un ayudante puntual sin tener que bajarle el rol completo), más
  // el gate de Plan Serviteca — Caja no está en Plan Taller.
  const [vePagos, tieneServicios] = await Promise.all([
    puedeVerPagos(),
    tienePlan("impresionOrden"),
  ]);
  if (!vePagos || !tieneServicios) redirect("/panel");

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
