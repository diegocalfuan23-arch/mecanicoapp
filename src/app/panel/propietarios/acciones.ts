"use server";

import { revalidatePath } from "next/cache";
import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "@/db";
import { cliente, vehiculo, trabajo } from "@/db/schema";
import { tallerActual } from "@/lib/taller";

export async function listarPropietarios() {
  const tallerId = await tallerActual();

  // Cuántos autos tiene y cuánto debe en total
  return db
    .select({
      id: cliente.id,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      notas: cliente.notas,
      trato: cliente.trato,
      formaPago: cliente.formaPago,
      autos: sql<number>`count(distinct ${vehiculo.id})`.mapWith(Number),
      deuda: sql<number>`coalesce(sum(
        case when ${trabajo.estadoPago} <> 'pagado'
        then ${trabajo.total} - ${trabajo.abonado} else 0 end
      ), 0)`.mapWith(Number),
      // Quién es cliente y quién vino una vez no hay que marcarlo a
      // mano: las visitas ya lo dicen.
      visitas: sql<number>`count(${trabajo.id})`.mapWith(Number),
      gastado: sql<number>`coalesce(sum(${trabajo.total}), 0)`.mapWith(Number),
      ultimaVisita: sql<Date | null>`max(${trabajo.fecha})`,
    })
    .from(cliente)
    .leftJoin(vehiculo, eq(vehiculo.propietarioId, cliente.id))
    .leftJoin(trabajo, eq(trabajo.vehiculoId, vehiculo.id))
    .where(eq(cliente.tallerId, tallerId))
    .groupBy(cliente.id)
    // Los que más vuelven arriba: son los que el taller quiere tener a
    // mano, no los últimos que se registraron.
    .orderBy(desc(sql`count(${trabajo.id})`), desc(cliente.createdAt));
}

export type DatosPropietario = {
  nombre: string;
  telefono?: string;
  notas?: string;
  trato: string;
  formaPago?: string;
};

export async function guardarPropietario(datos: DatosPropietario) {
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
    trato: datos.trato || "normal",
    formaPago: datos.formaPago?.trim() || null,
  });

  revalidatePath("/panel/propietarios");
  return { ok: true };
}

export async function actualizarPropietario(
  clienteId: string,
  datos: DatosPropietario
) {
  const tallerId = await tallerActual();
  const nombre = datos.nombre.trim();

  const [suyo] = await db
    .select({ id: cliente.id })
    .from(cliente)
    .where(and(eq(cliente.id, clienteId), eq(cliente.tallerId, tallerId)))
    .limit(1);

  if (!suyo) return { error: "No se encontró ese propietario." };

  const repetido = await db
    .select({ id: cliente.id })
    .from(cliente)
    .where(and(eq(cliente.tallerId, tallerId), eq(cliente.nombre, nombre)))
    .limit(2);

  if (repetido.some((c) => c.id !== clienteId)) {
    return { error: `${nombre} ya está registrado en otra ficha.` };
  }

  await db
    .update(cliente)
    .set({
      nombre,
      telefono: datos.telefono?.trim() || null,
      notas: datos.notas?.trim() || null,
      trato: datos.trato || "normal",
      formaPago: datos.formaPago?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(cliente.id, clienteId));

  revalidatePath("/panel/propietarios");
  revalidatePath("/panel/historial");
  return { ok: true };
}
