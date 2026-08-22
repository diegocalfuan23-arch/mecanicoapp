import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, and, ne, desc, count, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { vehiculo, cliente, trabajo, abono } from "@/db/schema";
import { tallerActual } from "@/lib/taller";
import { pesos } from "@/lib/formato";
import { ESTADOS } from "./ordenes/estados";

function nombreEstado(valor: string) {
  return ESTADOS.find((e) => e.valor === valor)?.texto ?? valor;
}

export default async function Panel() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) redirect("/entrar");

  // Antes usaba sesion.user.id directo: un ayudante vería el taller
  // vacío (el suyo propio) en vez del taller real al que pertenece.
  const tallerId = await tallerActual();

  const [[autos], [duenos], [deuda], ordenesRecientes, pagosRecientes] =
    await Promise.all([
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
      db
        .select({
          id: trabajo.id,
          numero: trabajo.numero,
          estado: trabajo.estado,
          patente: vehiculo.patente,
          marca: vehiculo.marca,
          modelo: vehiculo.modelo,
          fecha: trabajo.fecha,
        })
        .from(trabajo)
        .innerJoin(vehiculo, eq(trabajo.vehiculoId, vehiculo.id))
        .where(eq(trabajo.tallerId, tallerId))
        .orderBy(desc(trabajo.numero))
        .limit(4),
      db
        .select({
          id: abono.id,
          monto: abono.monto,
          fecha: abono.fecha,
          patente: vehiculo.patente,
          propietario: cliente.nombre,
        })
        .from(abono)
        .innerJoin(trabajo, eq(abono.trabajoId, trabajo.id))
        .innerJoin(vehiculo, eq(trabajo.vehiculoId, vehiculo.id))
        .leftJoin(cliente, eq(vehiculo.propietarioId, cliente.id))
        .where(eq(trabajo.tallerId, tallerId))
        .orderBy(desc(abono.fecha))
        .limit(4),
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
      pie: deuda.monto === 0 ? "Todo al día" : "Ver los pagos",
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

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[15px] font-medium">Órdenes recientes</h2>
            <Link
              href="/panel/ordenes"
              className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Ver todas
            </Link>
          </div>

          {ordenesRecientes.length === 0 ? (
            <p className="mt-4 text-[14px] text-muted-foreground">
              Todavía no hay órdenes de trabajo.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-1">
              {ordenesRecientes.map((o) => (
                <li key={o.id}>
                  <Link
                    href="/panel/ordenes"
                    className="-mx-2 flex items-center justify-between gap-4 rounded-lg px-2 py-2 transition-colors hover:bg-background"
                  >
                    <div className="min-w-0">
                      <span className="font-mono text-[13px] text-muted-foreground">
                        OT-{o.numero}
                      </span>{" "}
                      <span className="font-mono font-medium">
                        {o.patente}
                      </span>
                      {o.marca && (
                        <span className="text-[14px] text-muted-foreground">
                          {" "}
                          {o.marca} {o.modelo}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-foreground/10 px-2 py-1 text-[12px] font-medium">
                      {nombreEstado(o.estado)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-[15px] font-medium">Pagos recientes</h2>
            <Link
              href="/panel/pagos"
              className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Ver todos
            </Link>
          </div>

          {pagosRecientes.length === 0 ? (
            <p className="mt-4 text-[14px] text-muted-foreground">
              Todavía no se ha registrado ningún cobro.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-1">
              {pagosRecientes.map((p) => (
                <li key={p.id}>
                  <Link
                    href="/panel/pagos"
                    className="-mx-2 flex items-center justify-between gap-4 rounded-lg px-2 py-2 transition-colors hover:bg-background"
                  >
                    <div className="min-w-0">
                      <span className="font-mono font-medium">
                        {p.patente}
                      </span>
                      <span className="text-[14px] text-muted-foreground">
                        {" "}
                        {p.propietario ?? "Sin dueño registrado"}
                      </span>
                    </div>
                    <span className="shrink-0 font-medium">
                      {pesos(p.monto)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
