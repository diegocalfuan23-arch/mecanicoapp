"use server";

import { revalidatePath } from "next/cache";
import { eq, and, ne, sql, desc, gte } from "drizzle-orm";
import { db } from "@/db";
import { trabajo, vehiculo, cliente, abono } from "@/db/schema";
import { tallerActual } from "@/lib/taller";

/** Trabajos con saldo pendiente: los fiados y los abonados a medias. */
export async function listarDeudas() {
  const tallerId = await tallerActual();

  return db
    .select({
      id: trabajo.id,
      descripcion: trabajo.descripcion,
      total: trabajo.total,
      abonado: trabajo.abonado,
      estadoPago: trabajo.estadoPago,
      fecha: trabajo.fecha,
      patente: vehiculo.patente,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      propietario: cliente.nombre,
      telefono: cliente.telefono,
    })
    .from(trabajo)
    .innerJoin(vehiculo, eq(trabajo.vehiculoId, vehiculo.id))
    .leftJoin(cliente, eq(vehiculo.propietarioId, cliente.id))
    .where(and(eq(trabajo.tallerId, tallerId), ne(trabajo.estadoPago, "pagado")))
    .orderBy(trabajo.fecha);
}

export async function resumenDeuda() {
  const tallerId = await tallerActual();

  const [fila] = await db
    .select({
      pendiente: sql<number>`coalesce(sum(${trabajo.total} - ${trabajo.abonado}), 0)`.mapWith(
        Number
      ),
      cuantos: sql<number>`count(*)`.mapWith(Number),
    })
    .from(trabajo)
    .where(and(eq(trabajo.tallerId, tallerId), ne(trabajo.estadoPago, "pagado")));

  return fila;
}

/** Cada cobro que entró, del más nuevo al más viejo. */
export async function listarCobros() {
  const tallerId = await tallerActual();

  return db
    .select({
      id: abono.id,
      monto: abono.monto,
      fecha: abono.fecha,
      descripcion: trabajo.descripcion,
      patente: vehiculo.patente,
      propietario: cliente.nombre,
    })
    .from(abono)
    .innerJoin(trabajo, eq(abono.trabajoId, trabajo.id))
    .innerJoin(vehiculo, eq(trabajo.vehiculoId, vehiculo.id))
    .leftJoin(cliente, eq(vehiculo.propietarioId, cliente.id))
    .where(eq(trabajo.tallerId, tallerId))
    .orderBy(desc(abono.fecha))
    .limit(100);
}

/** Cuánto entró en el mes corriente. */
export async function cobradoDelMes() {
  const tallerId = await tallerActual();
  const ahora = new Date();
  const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

  const [fila] = await db
    .select({
      monto: sql<number>`coalesce(sum(${abono.monto}), 0)`.mapWith(Number),
      cuantos: sql<number>`count(*)`.mapWith(Number),
    })
    .from(abono)
    .innerJoin(trabajo, eq(abono.trabajoId, trabajo.id))
    .where(and(eq(trabajo.tallerId, tallerId), gte(abono.fecha, inicio)));

  return fila;
}

export async function registrarAbono(trabajoId: string, monto: number) {
  const tallerId = await tallerActual();

  const [actual] = await db
    .select({
      total: trabajo.total,
      abonado: trabajo.abonado,
    })
    .from(trabajo)
    .where(and(eq(trabajo.id, trabajoId), eq(trabajo.tallerId, tallerId)))
    .limit(1);

  if (!actual) return { error: "No se encontró ese trabajo." };

  const saldo = actual.total - actual.abonado;
  if (monto <= 0) return { error: "El monto debe ser mayor a cero." };
  if (monto > saldo) {
    return { error: `El saldo es ${saldo.toLocaleString("es-CL")}. No puede abonar más.` };
  }

  const nuevoAbonado = actual.abonado + monto;
  const saldado = nuevoAbonado >= actual.total;

  await db.insert(abono).values({
    id: crypto.randomUUID(),
    trabajoId,
    monto,
  });

  await db
    .update(trabajo)
    .set({
      abonado: nuevoAbonado,
      estadoPago: saldado ? "pagado" : "abonado",
      fechaPago: saldado ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(trabajo.id, trabajoId));

  revalidatePath("/panel/pagos");
  revalidatePath("/panel");
  return { ok: true, saldado };
}

/** Marca el trabajo como pagado por completo. */
export async function saldarTrabajo(trabajoId: string) {
  const tallerId = await tallerActual();

  const [actual] = await db
    .select({ total: trabajo.total, abonado: trabajo.abonado })
    .from(trabajo)
    .where(and(eq(trabajo.id, trabajoId), eq(trabajo.tallerId, tallerId)))
    .limit(1);

  if (!actual) return { error: "No se encontró ese trabajo." };

  const resto = actual.total - actual.abonado;
  if (resto > 0) {
    await db.insert(abono).values({
      id: crypto.randomUUID(),
      trabajoId,
      monto: resto,
    });
  }

  await db
    .update(trabajo)
    .set({
      abonado: actual.total,
      estadoPago: "pagado",
      fechaPago: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(trabajo.id, trabajoId));

  revalidatePath("/panel/pagos");
  revalidatePath("/panel");
  return { ok: true };
}

export async function historialAbonos(trabajoId: string) {
  return db
    .select({ id: abono.id, monto: abono.monto, fecha: abono.fecha })
    .from(abono)
    .where(eq(abono.trabajoId, trabajoId))
    .orderBy(desc(abono.fecha));
}
