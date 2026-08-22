import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { BotonInstalar } from "@/components/boton-instalar";
import { BotonSalir } from "./boton-salir";
import { Sidebar, MenuMovil } from "./navegacion";

export default async function LayoutPanel({
  children,
}: {
  children: React.ReactNode;
}) {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) redirect("/entrar");

  const taller = (sesion.user as { taller?: string }).taller;

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="shrink-0 border-b border-border">
        <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <MenuMovil />
            <Link
              href="/panel"
              className="truncate text-lg font-semibold tracking-tight"
            >
              Mecanico<span className="text-acento">App</span>
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <span className="hidden max-w-40 truncate text-sm text-muted-foreground sm:block">
              {taller ?? sesion.user.name}
            </span>
            <BotonInstalar />
            <BotonSalir />
          </div>
        </div>
      </header>

      {/* min-h-0 deja que el chat haga su propio scroll interno en vez de
          estirar la página. Las demás pantallas scrollean dentro de main. */}
      <div className="flex min-h-0 min-w-0 flex-1">
        <Sidebar />
        <main className="scroll-discreto min-w-0 flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
