import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, and, ne, desc, count, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { vehiculo, cliente, trabajo, abono } from "@/db/schema";
import { tallerActual, puedeVerPagos } from "@/lib/taller";
import { pesos } from "@/lib/formato";
import { ESTADOS } from "./ordenes/estados";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CarFrontIcon,
  UserGroupIcon,
  Wallet01Icon,
  HelpCircleIcon,
} from "@hugeicons/core-free-icons";

// Un color pastel distinto por tarjeta, como la referencia (Bujía) —
// azul/verde/ámbar para diferenciarlas de un vistazo, no el mismo
// tono repetido para todo.
const COLOR_ICONO: Record<string, string> = {
  azul: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  verde: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  ambar: "bg-acento/15 text-acento",
};

function nombreEstado(valor: string) {
  return ESTADOS.find((e) => e.valor === valor)?.texto ?? valor;
}

export default async function Panel() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) redirect("/entrar");

  // Antes usaba sesion.user.id directo: un ayudante vería el taller
  // vacío (el suyo propio) en vez del taller real al que pertenece.
  const tallerId = await tallerActual();
  // El dueño puede ocultarle los montos a un ayudante puntual (pedido
  // real de Carserv) — sin esto, aunque no pueda entrar a Pagos,
  // igual vería cuánto deben los clientes acá en Inicio.
  const vePagos = await puedeVerPagos();

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
      vePagos
        ? db
            .select({
              monto:
                sql<number>`coalesce(sum(${trabajo.total} - ${trabajo.abonado}), 0)`.mapWith(
                  Number
                ),
            })
            .from(trabajo)
            .where(
              and(
                eq(trabajo.tallerId, tallerId),
                ne(trabajo.estadoPago, "pagado")
              )
            )
        : [{ monto: 0 }],
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
      vePagos
        ? db
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
            .limit(4)
        : [],
    ]);

  const tarjetas = [
    {
      href: "/panel/vehiculos",
      titulo: "Vehículos",
      ayuda: "Autos registrados en tu taller.",
      valor: String(autos.total),
      pie: autos.total === 0 ? "Registra el primero" : "Ver todos",
      icono: CarFrontIcon,
      color: COLOR_ICONO.azul,
    },
    {
      href: "/panel/propietarios",
      titulo: "Propietarios",
      ayuda: "Clientes dueños de esos vehículos.",
      valor: String(duenos.total),
      pie: duenos.total === 0 ? "Registra el primero" : "Ver todos",
      icono: UserGroupIcon,
      color: COLOR_ICONO.verde,
    },
    ...(vePagos
      ? [
          {
            href: "/panel/pagos",
            titulo: "Te deben",
            ayuda: "Suma de lo pendiente en trabajos fiados o abonados.",
            valor: pesos(deuda.monto),
            pie: deuda.monto === 0 ? "Todo al día" : "Ver los pagos",
            alerta: deuda.monto > 0,
            icono: Wallet01Icon,
            color: COLOR_ICONO.ambar,
          },
        ]
      : []),
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
            className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
          >
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
                {t.titulo}
                <span title={t.ayuda} role="img" aria-label={t.ayuda}>
                  <HugeiconsIcon
                    icon={HelpCircleIcon}
                    className="size-3.5 shrink-0"
                    aria-hidden
                  />
                </span>
              </span>
              <p
                className={`mt-2 text-2xl font-bold tracking-tight ${t.alerta ? "text-acento" : ""}`}
              >
                {t.valor}
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground">{t.pie}</p>
            </div>
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${t.color}`}
            >
              <HugeiconsIcon icon={t.icono} className="size-4.5" />
            </div>
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

        {vePagos && (
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
        )}
      </div>
    </>
  );
}
