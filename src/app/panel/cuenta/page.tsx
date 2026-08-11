import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { PanelDatos } from "./panel-datos";

export default async function Cuenta() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) redirect("/entrar");

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Mi cuenta</h1>
        <p className="mt-2 text-muted-foreground">
          {sesion.user.email}
        </p>
      </div>

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
