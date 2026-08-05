import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
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
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <MenuMovil />
            <Link href="/panel" className="text-lg font-semibold tracking-tight">
              Mecanico<span className="text-primary">App</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:block">
              {taller ?? sesion.user.name}
            </span>
            <BotonSalir />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
