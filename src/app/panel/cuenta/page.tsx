import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { tallerActual } from "@/lib/taller";
import { PanelDatos } from "./panel-datos";
import { PanelTaller } from "./panel-taller";
import { BotonSalir } from "../boton-salir";
import { SelectorTema } from "@/components/selector-tema";

export default async function Cuenta() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) redirect("/entrar");

  // Datos del taller (logo/nombre/RUT/dirección) son de identidad
  // legal del negocio — solo el dueño los edita, nunca un ayudante
  // (jefe_taller, mecánico o rol a medida), sea cual sea su plan.
  const tallerId = await tallerActual();
  const esDueno = tallerId === sesion.user.id;

  const [datos] = await db
    .select({
      taller: user.taller,
      rut: user.rut,
      direccion: user.direccion,
      telefono: user.telefono,
      logo: user.image,
    })
    .from(user)
    .where(eq(user.id, tallerId))
    .limit(1);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Mi cuenta</h1>
        <p className="mt-2 text-muted-foreground">
          {sesion.user.email}
        </p>
      </div>

      {esDueno && (
        <PanelTaller
          taller={datos?.taller ?? ""}
          rut={datos?.rut ?? ""}
          direccion={datos?.direccion ?? ""}
          telefono={datos?.telefono ?? ""}
          logo={datos?.logo ?? null}
        />
      )}

      <div className="mt-6">
        <PanelDatos correo={sesion.user.email} esDueno={esDueno} />
      </div>

      <div className="mt-6">
        <SelectorTema />
      </div>

      <p className="mt-8 text-[13px] text-muted-foreground">
        <Link
          href="/ayuda"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Centro de ayuda
        </Link>
        {" · "}
        Cómo tratamos los datos está en la{" "}
        <Link
          href="/panel/cuenta/privacidad"
          className="underline underline-offset-4 hover:text-foreground"
        >
          política de privacidad
        </Link>
        .
      </p>

      <div className="mt-8 border-t border-border pt-6">
        <BotonSalir />
      </div>
    </div>
  );
}
