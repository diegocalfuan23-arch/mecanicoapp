import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { tallerActual } from "@/lib/taller";
import { listarEquipo } from "./equipo";
import { PanelDatos } from "./panel-datos";
import { Equipo } from "./equipo-ui";

export default async function Cuenta() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) redirect("/entrar");

  // Un ayudante no gestiona el equipo — solo el dueño, para quien
  // tallerActual() coincide con su propio id.
  const esDueno = (await tallerActual()) === sesion.user.id;
  const miembros = esDueno ? await listarEquipo() : [];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Mi cuenta</h1>
        <p className="mt-2 text-muted-foreground">
          {sesion.user.email}
        </p>
      </div>

      {esDueno && (
        <div className="mb-6">
          <Equipo miembros={miembros} />
        </div>
      )}

      <PanelDatos correo={sesion.user.email} />

      <p className="mt-8 text-[13px] text-muted-foreground">
        Cómo tratamos los datos está en la{" "}
        <Link
          href="/panel/cuenta/privacidad"
          className="underline underline-offset-4 hover:text-foreground"
        >
          política de privacidad
        </Link>
        .
      </p>
    </div>
  );
}
