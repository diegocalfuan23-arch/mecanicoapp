import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { tienePlan, puedeVerPagos } from "@/lib/taller";
import { RegistrarSW } from "@/components/registrar-sw";
import { BotonInstalar } from "@/components/boton-instalar";
import { ThemeProvider } from "@/components/theme-provider";
import {
  ProveedorAsistente,
  BotonAsistente,
  PanelAsistente,
} from "@/components/asistente-flotante";
import { listarConversaciones } from "./asistente/acciones";
import { Sidebar, MenuMovil } from "./navegacion";

export default async function LayoutPanel({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) redirect("/entrar");

  // Inventario y Servicios son del Plan Serviteca — Tío Lalo/Pipe no
  // los ven ni los necesitan, y no hay que dejarles el ítem sin uso
  // en el sidebar.
  const tieneInventario = await tienePlan("inventario");
  const tieneServicios = await tienePlan("impresionOrden");
  const vePagos = await puedeVerPagos();
  const conversaciones = await listarConversaciones();

  return (
    // El toggle de tema solo existe dentro del panel — fuera de la
    // sesión (landing, login, registro) queda fijo en oscuro (ver
    // layout.tsx raíz). ThemeProvider vive acá, no en el layout raíz,
    // porque next-themes ignora un segundo provider anidado dentro de
    // uno ya existente: si estuviera arriba, este de acá no haría nada.
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <ProveedorAsistente>
        {/* El sidebar es una columna completa de arriba a abajo — el
            header NO se extiende por encima de él (a diferencia de
            antes, donde header y aside eran bloques apilados con sus
            propios bordes, que en vista de escritorio se veían
            desalineados en la esquina superior izquierda). Por eso el
            <aside> va aquí, hermano de la columna header+main, en vez
            de vivir dentro de esa columna. */}
        <div className="flex h-dvh overflow-hidden">
          <RegistrarSW />
          <Sidebar
            tieneInventario={tieneInventario}
            tieneServicios={tieneServicios}
            vePagos={vePagos}
          />

          <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
            <header className="shrink-0 border-b border-border">
              <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-4">
                  <MenuMovil
                    tieneInventario={tieneInventario}
                    tieneServicios={tieneServicios}
                    vePagos={vePagos}
                  />
                  <Link
                    href="/panel"
                    className="truncate text-lg font-semibold tracking-tight lg:hidden"
                  >
                    Mecanico<span className="text-acento">App</span>
                  </Link>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <BotonAsistente />
                  <BotonInstalar />
                </div>
              </div>
            </header>

            {/* El panel del Asistente ocupa exactamente el mismo espacio
                que <main> (mismo contenedor flex-1/min-h-0, con
                position: relative para cubrirlo con absolute inset-0)
                — así el header queda siempre visible arriba, sin
                adivinar su alto en píxeles ni tapar toda la pantalla
                con position:fixed. */}
            <div className="relative flex min-h-0 min-w-0 flex-1">
              <PanelAsistente conversaciones={conversaciones} />
              <main className="scroll-discreto min-w-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
                {children}
              </main>
            </div>
          </div>
        </div>
      </ProveedorAsistente>
    </ThemeProvider>
  );
}
