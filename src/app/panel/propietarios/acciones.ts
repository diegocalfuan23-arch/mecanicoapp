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
      numero: cliente.numero,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion,
      comuna: cliente.comuna,
      ciudad: cliente.ciudad,
      esEmpresa: cliente.esEmpresa,
      empresa: cliente.empresa,
      empresaRut: cliente.empresaRut,
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
  email?: string;
  direccion?: string;
  comuna?: string;
  ciudad?: string;
  esEmpresa?: boolean;
  empresa?: string;
  empresaRut?: string;
  notas?: string;
  trato: string;
  formaPago?: string;
};

/**
 * Correlativo de cliente por taller (Cliente #1, #2...), para
 * identificarlo rápido de memoria. Compartido con vehiculos/acciones.ts,
 * que también puede crear un cliente al vuelo desde la ficha del auto.
 */
export async function siguienteNumeroCliente(tallerId: string) {
  const [{ ultimo }] = await db
    .select({ ultimo: sql<number>`coalesce(max(${cliente.numero}), 0)`.mapWith(Number) })
    .from(cliente)
    .where(eq(cliente.tallerId, tallerId));
  return ultimo + 1;
}

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
    numero: await siguienteNumeroCliente(tallerId),
    nombre,
    telefono: datos.telefono?.trim() || null,
    email: datos.email?.trim() || null,
    direccion: datos.direccion?.trim() || null,
    comuna: datos.comuna?.trim() || null,
    ciudad: datos.ciudad?.trim() || null,
    esEmpresa: datos.esEmpresa ?? false,
    empresa: datos.empresa?.trim() || null,
    empresaRut: datos.empresaRut?.trim() || null,
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
      email: datos.email?.trim() || null,
      direccion: datos.direccion?.trim() || null,
      comuna: datos.comuna?.trim() || null,
      ciudad: datos.ciudad?.trim() || null,
      esEmpresa: datos.esEmpresa ?? false,
      empresa: datos.empresa?.trim() || null,
      empresaRut: datos.empresaRut?.trim() || null,
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
