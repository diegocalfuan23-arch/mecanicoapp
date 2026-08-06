import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, and, ne, count, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { vehiculo, cliente, trabajo } from "@/db/schema";
import { pesos } from "@/lib/formato";

export default async function Panel() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) redirect("/entrar");

  const tallerId = sesion.user.id;

  const [[autos], [duenos], [deuda]] = await Promise.all([
    db
      .select({ total: count() })
      .from(vehiculo)
      .where(eq(vehiculo.tallerId, tallerId)),
    db
      .select({ total: count() })
      .from(cliente)
      .where(eq(cliente.tallerId, tallerId)),
    db
      .select({
        monto:
          sql<number>`coalesce(sum(${trabajo.total} - ${trabajo.abonado}), 0)`.mapWith(
            Number
          ),
      })
      .from(trabajo)
      .where(
        and(eq(trabajo.tallerId, tallerId), ne(trabajo.estadoPago, "pagado"))
      ),
  ]);

  const tarjetas = [
    {
      href: "/panel/vehiculos",
      titulo: "Vehículos",
      valor: String(autos.total),
      pie: autos.total === 0 ? "Registra el primero" : "Ver todos",
    },
    {
      href: "/panel/propietarios",
      titulo: "Propietarios",
      valor: String(duenos.total),
      pie: duenos.total === 0 ? "Registra el primero" : "Ver todos",
    },
    {
      href: "/panel/pagos",
      titulo: "Te deben",
      valor: pesos(deuda.monto),
      pie: deuda.monto === 0 ? "Todo al día" : "Ver los fiados",
      alerta: deuda.monto > 0,
    },
  ];

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">
        Hola, {sesion.user.name.split(" ")[0]}
      </h1>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tarjetas.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
          >
            <span className="text-[13px] tracking-wide text-muted-foreground uppercase">
              {t.titulo}
            </span>
            <p
              className={`mt-2 text-[30px] leading-none font-bold sm:text-[40px] ${t.alerta ? "text-acento" : ""}`}
            >
              {t.valor}
            </p>
            <p className="mt-1 text-[14px] text-muted-foreground">{t.pie}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
