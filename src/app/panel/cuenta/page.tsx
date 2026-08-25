import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { PanelDatos } from "./panel-datos";
import { PanelTaller } from "./panel-taller";

export default async function Cuenta() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) redirect("/entrar");

  const [datos] = await db
    .select({
      taller: user.taller,
      rut: user.rut,
      direccion: user.direccion,
      telefono: user.telefono,
      logo: user.image,
    })
    .from(user)
    .where(eq(user.id, sesion.user.id))
    .limit(1);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Mi cuenta</h1>
        <p className="mt-2 text-muted-foreground">
          {sesion.user.email}
        </p>
      </div>

      <PanelTaller
        taller={datos?.taller ?? ""}
        rut={datos?.rut ?? ""}
        direccion={datos?.direccion ?? ""}
        telefono={datos?.telefono ?? ""}
        logo={datos?.logo ?? null}
      />

      <div className="mt-6">
        <PanelDatos correo={sesion.user.email} />
      </div>

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
