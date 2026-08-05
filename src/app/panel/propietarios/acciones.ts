"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, sql, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { cliente, vehiculo, trabajo } from "@/db/schema";

async function tallerActual() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) throw new Error("Sin sesión");
  return sesion.user.id;
}

export async function listarPropietarios() {
  const tallerId = await tallerActual();

  // Cuántos autos tiene y cuánto debe en total
  return db
    .select({
      id: cliente.id,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      notas: cliente.notas,
      autos: sql<number>`count(distinct ${vehiculo.id})`.mapWith(Number),
      deuda: sql<number>`coalesce(sum(
        case when ${trabajo.estadoPago} <> 'pagado'
        then ${trabajo.total} - ${trabajo.abonado} else 0 end
      ), 0)`.mapWith(Number),
    })
    .from(cliente)
    .leftJoin(vehiculo, eq(vehiculo.propietarioId, cliente.id))
    .leftJoin(trabajo, eq(trabajo.vehiculoId, vehiculo.id))
    .where(eq(cliente.tallerId, tallerId))
    .groupBy(cliente.id)
    .orderBy(desc(cliente.createdAt));
}

export async function guardarPropietario(datos: {
  nombre: string;
  telefono?: string;
  notas?: string;
}) {
  const tallerId = await tallerActual();
  const nombre = datos.nombre.trim();

  const yaExiste = await db
    .select({ id: cliente.id })
    .from(cliente)
    .where(and(eq(cliente.tallerId, tallerId), eq(cliente.nombre, nombre)))
    .limit(1);

  if (yaExiste.length) {
    return { error: `${nombre} ya está registrado.` };
  }

  await db.insert(cliente).values({
    id: crypto.randomUUID(),
    tallerId,
    nombre,
    telefono: datos.telefono?.trim() || null,
    notas: datos.notas?.trim() || null,
  });

  revalidatePath("/panel/propietarios");
  return { ok: true };
}
