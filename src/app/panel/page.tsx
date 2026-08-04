import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BotonSalir } from "./boton-salir";

export default async function Panel() {
  const sesion = await auth.api.getSession({ headers: await headers() });

  if (!sesion) redirect("/entrar");

  const taller = (sesion.user as { taller?: string }).taller;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">
            Mecanico<span className="text-primary">App</span>
          </span>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:block">
              {taller ?? sesion.user.name}
            </span>
            <BotonSalir />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">
          Hola, {sesion.user.name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Acá va a estar el historial por patente, los fiados y el stock.
        </p>
      </main>
    </div>
  );
}
