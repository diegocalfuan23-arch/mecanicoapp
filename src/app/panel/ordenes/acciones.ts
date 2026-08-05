"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { trabajo, vehiculo, cliente } from "@/db/schema";

async function tallerActual() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) throw new Error("Sin sesión");
  return sesion.user.id;
}

export async function listarOrdenes() {
  const tallerId = await tallerActual();

  return db
    .select({
      id: trabajo.id,
      numero: trabajo.numero,
      sintoma: trabajo.sintoma,
      descripcion: trabajo.descripcion,
      kilometraje: trabajo.kilometraje,
      estado: trabajo.estado,
      estadoPago: trabajo.estadoPago,
      total: trabajo.total,
      abonado: trabajo.abonado,
      fecha: trabajo.fecha,
      fechaEntrega: trabajo.fechaEntrega,
      patente: vehiculo.patente,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      propietario: cliente.nombre,
      telefono: cliente.telefono,
    })
    .from(trabajo)
    .innerJoin(vehiculo, eq(trabajo.vehiculoId, vehiculo.id))
    .leftJoin(cliente, eq(vehiculo.propietarioId, cliente.id))
    .where(eq(trabajo.tallerId, tallerId))
    .orderBy(desc(trabajo.numero));
}

/** Los vehículos disponibles para abrir una orden. */
export async function listarVehiculosParaOrden() {
  const tallerId = await tallerActual();

  return db
    .select({
      id: vehiculo.id,
      patente: vehiculo.patente,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      propietario: cliente.nombre,
    })
    .from(vehiculo)
    .leftJoin(cliente, eq(vehiculo.propietarioId, cliente.id))
    .where(eq(vehiculo.tallerId, tallerId))
    .orderBy(vehiculo.patente);
}

export async function abrirOrden(datos: {
  vehiculoId: string;
  kilometraje?: string;
  sintoma?: string;
}) {
  const tallerId = await tallerActual();

  if (!datos.vehiculoId) {
    return { error: "Elige un vehículo." };
  }

  // Correlativo por taller
  const [{ ultimo }] = await db
    .select({ ultimo: sql<number>`coalesce(max(${trabajo.numero}), 0)`.mapWith(Number) })
    .from(trabajo)
    .where(eq(trabajo.tallerId, tallerId));

  await db.insert(trabajo).values({
    id: crypto.randomUUID(),
    tallerId,
    vehiculoId: datos.vehiculoId,
    numero: ultimo + 1,
    sintoma: datos.sintoma?.trim() || null,
    kilometraje: datos.kilometraje ? Number(datos.kilometraje) : null,
    estado: "ingresado",
  });

  revalidatePath("/panel/ordenes");
  revalidatePath("/panel");
  return { ok: true, numero: ultimo + 1 };
}

export async function cambiarEstado(ordenId: string, estado: string) {
  const tallerId = await tallerActual();

  await db
    .update(trabajo)
    .set({
      estado,
      fechaEntrega: estado === "entregado" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(trabajo.id, ordenId), eq(trabajo.tallerId, tallerId)));

  revalidatePath("/panel/ordenes");
  return { ok: true };
}

/** Se completa cuando el trabajo ya está hecho: qué se hizo y cuánto salió. */
export async function cerrarOrden(datos: {
  ordenId: string;
  descripcion: string;
  manoObra: string;
  repuestos: string;
  estadoPago: string;
}) {
  const tallerId = await tallerActual();

  const manoObra = Number(datos.manoObra) || 0;
  const repuestos = Number(datos.repuestos) || 0;
  const total = manoObra + repuestos;

  if (!datos.descripcion.trim()) {
    return { error: "Escribe qué se hizo." };
  }

  await db
    .update(trabajo)
    .set({
      descripcion: datos.descripcion.trim(),
      manoObra,
      repuestos,
      total,
      estadoPago: datos.estadoPago,
      abonado: datos.estadoPago === "pagado" ? total : 0,
      fechaPago: datos.estadoPago === "pagado" ? new Date() : null,
      estado: "terminado",
      updatedAt: new Date(),
    })
    .where(and(eq(trabajo.id, datos.ordenId), eq(trabajo.tallerId, tallerId)));

  revalidatePath("/panel/ordenes");
  revalidatePath("/panel/pagos");
  revalidatePath("/panel");
  return { ok: true };
}
