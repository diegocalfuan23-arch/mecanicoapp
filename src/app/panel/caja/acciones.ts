"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, sql, gte, lt, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  abono,
  trabajo,
  venta,
  movimientoCaja,
  cierreCaja,
  user,
} from "@/db/schema";
import { tallerActual, tienePlan } from "@/lib/taller";
import { auth } from "@/lib/auth";

// Chile no tiene un offset fijo (cambia con el horario de verano), así
// que en vez de un número fijo se pregunta a Intl cuál es el offset
// real para esa fecha específica.
function offsetChile(fecha: Date) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Santiago",
    timeZoneName: "shortOffset",
  }).formatToParts(fecha);
  const desplazamiento = partes.find((p) => p.type === "timeZoneName")?.value ?? "GMT-4";
  const coincide = desplazamiento.match(/GMT([+-]\d+)/);
  return coincide ? Number(coincide[1]) : -4;
}

/**
 * `fecha` llega como una fecha "pura" (YYYY-MM-DD, sin hora) desde el
 * selector — ya sea vía new Date(fechaIso) desde la página, que
 * JavaScript interpreta como medianoche UTC. Acá se corrige a
 * medianoche/fin de día en hora de Chile, no en UTC ni en la zona del
 * proceso donde corre el servidor (Vercel corre en UTC).
 */
function inicioDia(fecha: Date) {
  const offset = offsetChile(fecha);
  const soloFecha = fecha.toISOString().slice(0, 10);
  return new Date(`${soloFecha}T00:00:00${offset >= 0 ? "+" : "-"}${String(Math.abs(offset)).padStart(2, "0")}:00`);
}

function finDia(fecha: Date) {
  const offset = offsetChile(fecha);
  const soloFecha = fecha.toISOString().slice(0, 10);
  return new Date(`${soloFecha}T23:59:59.999${offset >= 0 ? "+" : "-"}${String(Math.abs(offset)).padStart(2, "0")}:00`);
}

/**
 * Cuánto entró en Órdenes (abono) + Ventas POS (venta pagada) el día
 * dado — mismo criterio que cobradoDelMes en Pagos, solo que acotado
 * a un día en vez de al mes.
 */
async function ingresosAutomaticosDelDia(tallerId: string, fecha: Date) {
  const desde = inicioDia(fecha);
  const hasta = finDia(fecha);

  const [deOrdenes] = await db
    .select({
      monto: sql<number>`coalesce(sum(${abono.monto}), 0)`.mapWith(Number),
    })
    .from(abono)
    .innerJoin(trabajo, eq(abono.trabajoId, trabajo.id))
    .where(
      and(
        eq(trabajo.tallerId, tallerId),
        gte(abono.fecha, desde),
        lt(abono.fecha, hasta)
      )
    );

  const [deVentas] = await db
    .select({
      monto: sql<number>`coalesce(sum(${venta.total}), 0)`.mapWith(Number),
    })
    .from(venta)
    .where(
      and(
        eq(venta.tallerId, tallerId),
        eq(venta.estado, "pagada"),
        gte(venta.fecha, desde),
        lt(venta.fecha, hasta)
      )
    );

  return deOrdenes.monto + deVentas.monto;
}

/**
 * Suma neta (ingresos - egresos) de movimientos manuales de caja en
 * un rango — se usa tanto para el día actual como para el disponible
 * anterior (todo lo que pasó antes de hoy, desde el último cierre).
 */
async function netoMovimientosManuales(
  tallerId: string,
  desde: Date,
  hasta: Date
) {
  const [fila] = await db
    .select({
      neto: sql<number>`coalesce(sum(
        case when ${movimientoCaja.tipo} = 'ingreso'
        then ${movimientoCaja.monto} else -${movimientoCaja.monto} end
      ), 0)`.mapWith(Number),
    })
    .from(movimientoCaja)
    .where(
      and(
        eq(movimientoCaja.tallerId, tallerId),
        gte(movimientoCaja.fecha, desde),
        lt(movimientoCaja.fecha, hasta)
      )
    );
  return fila.neto;
}

/**
 * El disponible anterior no recalcula desde el principio de los
 * tiempos: busca el cierre más reciente ANTES del día pedido y suma
 * lo que entró/salió desde ese cierre hasta el día pedido. Sin ningún
 * cierre previo, es $0 — sin un cierre real no hay forma confiable de
 * saber cuánto había disponible antes, y recorrer día por día desde
 * el origen colgaba la página (miles de queries hasta 1970).
 */
async function disponibleAnterior(tallerId: string, fecha: Date) {
  const desdeDia = inicioDia(fecha);

  const [ultimoCierre] = await db
    .select({ fecha: cierreCaja.fecha, disponible: cierreCaja.disponible })
    .from(cierreCaja)
    .where(and(eq(cierreCaja.tallerId, tallerId), lt(cierreCaja.fecha, desdeDia)))
    .orderBy(desc(cierreCaja.fecha))
    .limit(1);

  if (!ultimoCierre) return 0;

  // Todo lo que entró/salió entre el último cierre (exclusive) y el
  // inicio del día pedido, sin volver a contar el propio día de cierre.
  const desdeSiguiente = new Date(
    new Date(ultimoCierre.fecha).getTime() + 24 * 60 * 60 * 1000
  );

  let acumulado = ultimoCierre.disponible;
  const cursor = new Date(desdeSiguiente);
  while (cursor < desdeDia) {
    const finCursor = finDia(cursor);
    acumulado += await ingresosAutomaticosDelDia(tallerId, cursor);
    acumulado += await netoMovimientosManuales(
      tallerId,
      inicioDia(cursor),
      finCursor
    );
    cursor.setDate(cursor.getDate() + 1);
  }

  return acumulado;
}

export async function resumenDia(fechaIso: string) {
  if (!(await tienePlan("impresionOrden"))) {
    return { error: "Esta función es del Plan Serviteca." };
  }

  const tallerId = await tallerActual();
  const fecha = new Date(fechaIso);

  const [ingresosAuto, netoManual, anterior] = await Promise.all([
    ingresosAutomaticosDelDia(tallerId, fecha),
    netoMovimientosManuales(tallerId, inicioDia(fecha), finDia(fecha)),
    disponibleAnterior(tallerId, fecha),
  ]);

  const ingresosManuales = netoManual > 0 ? netoManual : 0;
  const egresosManuales = netoManual < 0 ? -netoManual : 0;
  const totalIngresos = ingresosAuto + ingresosManuales;
  const totalEgresos = egresosManuales;

  const [cierre] = await db
    .select({
      comentario: cierreCaja.comentario,
      cerradoPor: user.name,
    })
    .from(cierreCaja)
    .innerJoin(user, eq(cierreCaja.cerradoPorId, user.id))
    .where(
      and(
        eq(cierreCaja.tallerId, tallerId),
        gte(cierreCaja.fecha, inicioDia(fecha)),
        lt(cierreCaja.fecha, finDia(fecha))
      )
    )
    .limit(1);

  return {
    ok: true as const,
    disponibleAnterior: anterior,
    totalIngresos,
    totalEgresos,
    disponibleDelDia: anterior + totalIngresos - totalEgresos,
    cerrado: !!cierre,
    cerradoPor: cierre?.cerradoPor ?? null,
    comentarioCierre: cierre?.comentario ?? null,
  };
}

export type MovimientoDia = {
  id: string;
  tipo: "ingreso" | "egreso";
  monto: number;
  descripcion: string;
  referencia: string | null;
  origen: "orden" | "venta" | "compra" | "manual";
  fecha: Date;
};

export async function listarMovimientosDia(fechaIso: string) {
  if (!(await tienePlan("impresionOrden"))) return [];

  const tallerId = await tallerActual();
  const fecha = new Date(fechaIso);
  const desde = inicioDia(fecha);
  const hasta = finDia(fecha);

  const deOrdenes = await db
    .select({
      id: abono.id,
      monto: abono.monto,
      descripcion: trabajo.descripcion,
      fecha: abono.fecha,
    })
    .from(abono)
    .innerJoin(trabajo, eq(abono.trabajoId, trabajo.id))
    .where(
      and(
        eq(trabajo.tallerId, tallerId),
        gte(abono.fecha, desde),
        lt(abono.fecha, hasta)
      )
    );

  const deVentas = await db
    .select({
      id: venta.id,
      monto: venta.total,
      numero: venta.numero,
      fecha: venta.fecha,
    })
    .from(venta)
    .where(
      and(
        eq(venta.tallerId, tallerId),
        eq(venta.estado, "pagada"),
        gte(venta.fecha, desde),
        lt(venta.fecha, hasta)
      )
    );

  const manuales = await db
    .select({
      id: movimientoCaja.id,
      tipo: movimientoCaja.tipo,
      monto: movimientoCaja.monto,
      descripcion: movimientoCaja.descripcion,
      referencia: movimientoCaja.referencia,
      categoria: movimientoCaja.categoria,
      fecha: movimientoCaja.fecha,
    })
    .from(movimientoCaja)
    .where(
      and(
        eq(movimientoCaja.tallerId, tallerId),
        gte(movimientoCaja.fecha, desde),
        lt(movimientoCaja.fecha, hasta)
      )
    );

  const items: MovimientoDia[] = [
    ...deOrdenes.map((a) => ({
      id: a.id,
      tipo: "ingreso" as const,
      monto: a.monto,
      descripcion: a.descripcion || "Abono de orden",
      referencia: null,
      origen: "orden" as const,
      fecha: a.fecha,
    })),
    ...deVentas.map((v) => ({
      id: v.id,
      tipo: "ingreso" as const,
      monto: v.monto,
      descripcion: `Venta V-${v.numero}`,
      referencia: null,
      origen: "venta" as const,
      fecha: v.fecha,
    })),
    ...manuales.map((m) => ({
      id: m.id,
      tipo: m.tipo as "ingreso" | "egreso",
      monto: m.monto,
      descripcion: m.descripcion,
      referencia: m.referencia,
      origen: (m.categoria === "compra" ? "compra" : "manual") as "compra" | "manual",
      fecha: m.fecha,
    })),
  ];

  return items.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
}

export async function registrarMovimiento(datos: {
  tipo: "ingreso" | "egreso";
  monto: number;
  descripcion: string;
  referencia?: string;
  fechaIso?: string;
  categoria?: string;
  medioPago?: string;
  notas?: string;
}) {
  if (!(await tienePlan("impresionOrden"))) {
    return { error: "Esta función es del Plan Serviteca." };
  }

  const tallerId = await tallerActual();

  if (!datos.descripcion.trim()) {
    return { error: "Escribe una descripción." };
  }
  if (!datos.monto || datos.monto <= 0) {
    return { error: "El monto debe ser mayor a cero." };
  }

  const fecha = datos.fechaIso ? new Date(`${datos.fechaIso}T12:00:00`) : new Date();
  if (Number.isNaN(fecha.getTime())) {
    return { error: "Fecha inválida." };
  }

  await db.insert(movimientoCaja).values({
    id: crypto.randomUUID(),
    tallerId,
    tipo: datos.tipo,
    monto: Math.round(datos.monto),
    descripcion: datos.descripcion.trim(),
    referencia: datos.referencia?.trim() || null,
    categoria: datos.categoria?.trim() || null,
    medioPago: datos.medioPago?.trim() || null,
    notas: datos.notas?.trim() || null,
    fecha,
  });

  revalidatePath("/panel/caja");
  return { ok: true };
}

export async function cerrarCaja(fechaIso: string, comentario?: string) {
  if (!(await tienePlan("impresionOrden"))) {
    return { error: "Esta función es del Plan Serviteca." };
  }

  const tallerId = await tallerActual();
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) return { error: "Sin sesión." };

  const fecha = new Date(fechaIso);
  const desde = inicioDia(fecha);
  const hasta = finDia(fecha);

  const [yaExiste] = await db
    .select({ id: cierreCaja.id })
    .from(cierreCaja)
    .where(
      and(
        eq(cierreCaja.tallerId, tallerId),
        gte(cierreCaja.fecha, desde),
        lt(cierreCaja.fecha, hasta)
      )
    )
    .limit(1);

  if (yaExiste) return { error: "Ese día ya tiene la caja cerrada." };

  const resumen = await resumenDia(fechaIso);
  if (!resumen.ok) return { error: resumen.error };

  await db.insert(cierreCaja).values({
    id: crypto.randomUUID(),
    tallerId,
    fecha: desde,
    disponible: resumen.disponibleDelDia,
    comentario: comentario?.trim() || null,
    cerradoPorId: sesion.user.id,
  });

  revalidatePath("/panel/caja");
  return { ok: true };
}
