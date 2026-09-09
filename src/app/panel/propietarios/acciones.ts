"use server";

import { revalidatePath } from "next/cache";
import { eq, and, sql, desc, asc } from "drizzle-orm";
import { db } from "@/db";
import { cliente, vehiculo, trabajo, venta, cita } from "@/db/schema";
import { tallerActual } from "@/lib/taller";

/**
 * Versión liviana de listarPropietarios, sin los joins de autos/deuda —
 * para selectores (ej. Ventas POS) que solo necesitan buscar y mostrar
 * al cliente, no su historial completo.
 */
export async function listarClientesParaSelector() {
  const tallerId = await tallerActual();

  return db
    .select({
      id: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      rut: cliente.rut,
      telefono: cliente.telefono,
      email: cliente.email,
    })
    .from(cliente)
    .where(eq(cliente.tallerId, tallerId))
    .orderBy(asc(cliente.nombre));
}

export async function listarPropietarios() {
  const tallerId = await tallerActual();

  // Cuántos autos tiene y cuánto debe en total
  return db
    .select({
      id: cliente.id,
      numero: cliente.numero,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      rut: cliente.rut,
      documentoAlternativo: cliente.documentoAlternativo,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion,
      direccionDepto: cliente.direccionDepto,
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
  apellido?: string;
  rut?: string;
  documentoAlternativo?: boolean;
  telefono?: string;
  email?: string;
  direccion?: string;
  direccionDepto?: string;
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

  const id = crypto.randomUUID();

  await db.insert(cliente).values({
    id,
    tallerId,
    numero: await siguienteNumeroCliente(tallerId),
    nombre,
    apellido: datos.apellido?.trim() || null,
    rut: datos.rut?.trim() || null,
    documentoAlternativo: datos.documentoAlternativo ?? false,
    telefono: datos.telefono?.trim() || null,
    email: datos.email?.trim() || null,
    direccion: datos.direccion?.trim() || null,
    direccionDepto: datos.direccionDepto?.trim() || null,
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
  return { ok: true, id };
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
      apellido: datos.apellido?.trim() || null,
      rut: datos.rut?.trim() || null,
      documentoAlternativo: datos.documentoAlternativo ?? false,
      telefono: datos.telefono?.trim() || null,
      email: datos.email?.trim() || null,
      direccion: datos.direccion?.trim() || null,
      direccionDepto: datos.direccionDepto?.trim() || null,
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

export async function actualizarRatingNps(
  clienteId: string,
  datos: { rating?: number | null; nps?: number | null }
) {
  const tallerId = await tallerActual();

  const [suyo] = await db
    .select({ id: cliente.id })
    .from(cliente)
    .where(and(eq(cliente.id, clienteId), eq(cliente.tallerId, tallerId)))
    .limit(1);

  if (!suyo) return { error: "No se encontró ese cliente." };

  await db
    .update(cliente)
    .set({
      rating: datos.rating ?? null,
      nps: datos.nps ?? null,
      updatedAt: new Date(),
    })
    .where(eq(cliente.id, clienteId));

  revalidatePath("/panel/propietarios");
  revalidatePath(`/panel/propietarios/${clienteId}`);
  return { ok: true };
}

export type ClienteCRM = {
  id: string;
  numero: number;
  nombre: string;
  apellido: string | null;
  rut: string | null;
  telefono: string | null;
  email: string | null;
  rating: number | null;
  nps: number | null;
  ultimoContacto: Date | null;
  ordenes: number;
  presupuestos: number;
  ventas: number;
  citas: number;
  vehiculos: number;
};

/**
 * Vista consolidada para el CRM — cruza al cliente con lo que ya
 * existe en Órdenes, Ventas, Citas y Vehículos. "Presupuestos" queda
 * en 0 siempre: a diferencia de venta/cita, presupuesto no tiene
 * clienteId (solo patente/nombre/teléfono como texto libre, igual
 * que Diagnósticos), así que no hay cruce confiable por ahora.
 */
export async function listarClientesCRM() {
  const tallerId = await tallerActual();

  const filas = await db
    .select({
      id: cliente.id,
      numero: cliente.numero,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      rut: cliente.rut,
      telefono: cliente.telefono,
      email: cliente.email,
      rating: cliente.rating,
      nps: cliente.nps,
      ordenes: sql<number>`count(distinct ${trabajo.id})`.mapWith(Number),
      vehiculos: sql<number>`count(distinct ${vehiculo.id})`.mapWith(Number),
      ventas: sql<number>`count(distinct ${venta.id})`.mapWith(Number),
      citas: sql<number>`count(distinct ${cita.id})`.mapWith(Number),
      ultimoContacto: sql<Date | null>`greatest(
        max(${trabajo.fecha}), max(${venta.fecha}), max(${cita.fecha})
      )`,
    })
    .from(cliente)
    .leftJoin(vehiculo, eq(vehiculo.propietarioId, cliente.id))
    .leftJoin(trabajo, eq(trabajo.vehiculoId, vehiculo.id))
    .leftJoin(venta, eq(venta.clienteId, cliente.id))
    .leftJoin(cita, eq(cita.clienteId, cliente.id))
    .where(eq(cliente.tallerId, tallerId))
    .groupBy(cliente.id)
    .orderBy(asc(cliente.nombre));

  return filas.map((f) => ({ ...f, presupuestos: 0 })) as ClienteCRM[];
}

export type ClienteCRMDetalle = ClienteCRM & {
  direccion: string | null;
  notas: string | null;
  updatedAt: Date;
  ordenesDetalle: { id: string; numero: number; fecha: Date; total: number }[];
  ventasDetalle: { id: string; numero: number; fecha: Date; total: number }[];
  citasDetalle: {
    id: string;
    fecha: Date;
    motivo: string;
    estado: string;
  }[];
  vehiculosDetalle: {
    id: string;
    patente: string;
    marca: string | null;
    modelo: string | null;
    anio: number | null;
  }[];
};

export async function obtenerClienteCRM(clienteId: string) {
  const tallerId = await tallerActual();

  const [datos] = await db
    .select({
      id: cliente.id,
      numero: cliente.numero,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      rut: cliente.rut,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion,
      notas: cliente.notas,
      rating: cliente.rating,
      nps: cliente.nps,
      updatedAt: cliente.updatedAt,
    })
    .from(cliente)
    .where(and(eq(cliente.id, clienteId), eq(cliente.tallerId, tallerId)))
    .limit(1);

  if (!datos) return null;

  const [ordenesDetalle, ventasDetalle, citasDetalle, vehiculosDetalle] = await Promise.all([
    db
      .select({ id: trabajo.id, numero: trabajo.numero, fecha: trabajo.fecha, total: trabajo.total })
      .from(trabajo)
      .innerJoin(vehiculo, eq(trabajo.vehiculoId, vehiculo.id))
      .where(eq(vehiculo.propietarioId, clienteId))
      .orderBy(desc(trabajo.fecha)),
    db
      .select({ id: venta.id, numero: venta.numero, fecha: venta.fecha, total: venta.total })
      .from(venta)
      .where(eq(venta.clienteId, clienteId))
      .orderBy(desc(venta.fecha)),
    db
      .select({ id: cita.id, fecha: cita.fecha, motivo: cita.motivo, estado: cita.estado })
      .from(cita)
      .where(eq(cita.clienteId, clienteId))
      .orderBy(desc(cita.fecha)),
    db
      .select({
        id: vehiculo.id,
        patente: vehiculo.patente,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        anio: vehiculo.anio,
      })
      .from(vehiculo)
      .where(eq(vehiculo.propietarioId, clienteId)),
  ]);

  const ultimoContacto = [
    ordenesDetalle[0]?.fecha,
    ventasDetalle[0]?.fecha,
    citasDetalle[0]?.fecha,
  ]
    .filter((f): f is Date => !!f)
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

  return {
    ...datos,
    ultimoContacto,
    ordenes: ordenesDetalle.length,
    presupuestos: 0,
    ventas: ventasDetalle.length,
    citas: citasDetalle.length,
    vehiculos: vehiculosDetalle.length,
    ordenesDetalle,
    ventasDetalle,
    citasDetalle,
    vehiculosDetalle,
  } as ClienteCRMDetalle;
}
