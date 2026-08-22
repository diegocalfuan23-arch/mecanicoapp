import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { tallerActual } from "@/lib/taller";
import { listarEquipo } from "./acciones";
import { TablaEquipo } from "./tabla";

export default async function Equipo() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) redirect("/entrar");

  // Un ayudante no gestiona el equipo — solo el dueño, para quien
  // tallerActual() coincide con su propio id.
  const esDueno = (await tallerActual()) === sesion.user.id;
  if (!esDueno) redirect("/panel");

  const miembros = await listarEquipo();

  return (
    <>
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Equipo</h1>
        <p className="mt-2 text-muted-foreground">
          {miembros.length === 0
            ? "Quiénes trabajan contigo en el taller."
            : `${miembros.length} ${miembros.length === 1 ? "ayudante" : "ayudantes"} con acceso.`}
        </p>
      </div>

      <TablaEquipo miembros={miembros} />
    </>
  );
}
