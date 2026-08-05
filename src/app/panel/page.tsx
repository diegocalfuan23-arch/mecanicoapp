import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { vehiculo } from "@/db/schema";

export default async function Panel() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) redirect("/entrar");

  const [{ total }] = await db
    .select({ total: count() })
    .from(vehiculo)
    .where(eq(vehiculo.tallerId, sesion.user.id));

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        Hola, {sesion.user.name.split(" ")[0]}
      </h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/panel/vehiculos"
          className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
        >
          <span className="text-[13px] tracking-wide text-muted-foreground uppercase">
            Vehículos
          </span>
          <p className="mt-2 text-3xl font-semibold">{total}</p>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {total === 0 ? "Registra el primero" : "Ver todos"}
          </p>
        </Link>
      </div>
    </>
  );
}
