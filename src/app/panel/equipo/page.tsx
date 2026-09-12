import { redirect } from "next/navigation";
import { puedeVerEquipo, tallerActual, tienePlan } from "@/lib/taller";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  listarEquipo,
  listarInvitacionesPendientes,
  listarRolesPersonalizados,
} from "./acciones";
import { TablaEquipo } from "./tabla";

export default async function Equipo() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) redirect("/entrar");

  // Dueño y jefe_taller gestionan el equipo — un mecánico es
  // redirigido, para que no basta con ocultar el link del sidebar.
  if (!(await puedeVerEquipo())) redirect("/panel");

  const esDueno = (await tallerActual()) === sesion.user.id;

  const [miembros, invitaciones, rolesPersonalizados, tieneRolesPersonalizados] =
    await Promise.all([
      listarEquipo(),
      listarInvitacionesPendientes(),
      listarRolesPersonalizados(),
      tienePlan("rolesPersonalizados"),
    ]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Equipo</h1>
        <p className="mt-2 text-muted-foreground">
          {miembros.length === 0
            ? "Quiénes trabajan contigo en el taller."
            : `${miembros.length} ${miembros.length === 1 ? "persona" : "personas"} con acceso.`}
        </p>
      </div>

      <TablaEquipo
        miembros={miembros}
        invitaciones={invitaciones}
        esDueno={esDueno}
        rolesPersonalizados={rolesPersonalizados}
        tieneRolesPersonalizados={tieneRolesPersonalizados}
      />
    </>
  );
}
