"use server";

import { revalidatePath } from "next/cache";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { inspeccion, itemInspeccion, cliente, vehiculo } from "@/db/schema";
import { tallerActual, tienePlan } from "@/lib/taller";

function id() {
  return crypto.randomUUID();
}

export type ItemChecklistValor = {
  seccion: string;
  clave: string;
  valor: string;
};

export async function listarInspecciones() {
  const tallerId = await tallerActual();

  return db
    .select({
      id: inspeccion.id,
      numero: inspeccion.numero,
      clienteNombre: cliente.nombre,
      patente: vehiculo.patente,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      fecha: inspeccion.fecha,
    })
    .from(inspeccion)
    .leftJoin(cliente, eq(inspeccion.clienteId, cliente.id))
    .leftJoin(vehiculo, eq(inspeccion.vehiculoId, vehiculo.id))
    .where(eq(inspeccion.tallerId, tallerId))
    .orderBy(desc(inspeccion.fecha));
}

export async function obtenerInspeccion(inspeccionId: string) {
  const tallerId = await tallerActual();

  const [datos] = await db
    .select({
      id: inspeccion.id,
      numero: inspeccion.numero,
      clienteId: inspeccion.clienteId,
      clienteNombre: cliente.nombre,
      clienteTelefono: cliente.telefono,
      vehiculoId: inspeccion.vehiculoId,
      patente: vehiculo.patente,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      combustible: inspeccion.combustible,
      kilometraje: inspeccion.kilometraje,
      transmision: inspeccion.transmision,
      traccion: inspeccion.traccion,
      permisoCirculacion: inspeccion.permisoCirculacion,
      revisionTecnica: inspeccion.revisionTecnica,
      seguroObligatorio: inspeccion.seguroObligatorio,
      otrosEquipamientos: inspeccion.otrosEquipamientos,
      fotos: inspeccion.fotos,
      videos: inspeccion.videos,
      documentos: inspeccion.documentos,
      observaciones: inspeccion.observaciones,
      conclusiones: inspeccion.conclusiones,
      contactoNombre: inspeccion.contactoNombre,
      contactoDireccion: inspeccion.contactoDireccion,
      fechaInspeccion: inspeccion.fechaInspeccion,
      fecha: inspeccion.fecha,
    })
    .from(inspeccion)
    .leftJoin(cliente, eq(inspeccion.clienteId, cliente.id))
    .leftJoin(vehiculo, eq(inspeccion.vehiculoId, vehiculo.id))
    .where(and(eq(inspeccion.id, inspeccionId), eq(inspeccion.tallerId, tallerId)))
    .limit(1);

  if (!datos) return null;

  const items = await db
    .select({
      seccion: itemInspeccion.seccion,
      clave: itemInspeccion.clave,
      valor: itemInspeccion.valor,
    })
    .from(itemInspeccion)
    .where(eq(itemInspeccion.inspeccionId, inspeccionId));

  return { ...datos, items };
}

export async function crearInspeccion(datos: {
  clienteId?: string;
  vehiculoId?: string;
  combustible?: string;
  kilometraje?: string;
  transmision?: string;
  traccion?: string;
  permisoCirculacion?: string;
  revisionTecnica?: string;
  seguroObligatorio?: string;
  otrosEquipamientos?: string;
  fotos?: string[];
  videos?: string[];
  documentos?: string[];
  observaciones?: string;
  conclusiones?: string;
  contactoNombre?: string;
  contactoDireccion?: string;
  fechaInspeccion?: string;
  items?: ItemChecklistValor[];
}) {
  if (!(await tienePlan("impresionOrden"))) {
    return { error: "Esta función es del Plan Serviteca." };
  }

  const tallerId = await tallerActual();

  const [{ ultimo }] = await db
    .select({
      ultimo: sql<number>`coalesce(max(${inspeccion.numero}), 0)`.mapWith(Number),
    })
    .from(inspeccion)
    .where(eq(inspeccion.tallerId, tallerId));

  const inspeccionId = id();

  await db.insert(inspeccion).values({
    id: inspeccionId,
    tallerId,
    numero: ultimo + 1,
    clienteId: datos.clienteId || null,
    vehiculoId: datos.vehiculoId || null,
    combustible: datos.combustible || null,
    kilometraje: datos.kilometraje ? Number(datos.kilometraje) : null,
    transmision: datos.transmision || null,
    traccion: datos.traccion || null,
    permisoCirculacion: datos.permisoCirculacion || null,
    revisionTecnica: datos.revisionTecnica || null,
    seguroObligatorio: datos.seguroObligatorio || null,
    otrosEquipamientos: datos.otrosEquipamientos?.trim() || null,
    fotos: datos.fotos ?? [],
    videos: datos.videos ?? [],
    documentos: datos.documentos ?? [],
    observaciones: datos.observaciones?.trim() || null,
    conclusiones: datos.conclusiones?.trim() || null,
    contactoNombre: datos.contactoNombre?.trim() || null,
    contactoDireccion: datos.contactoDireccion?.trim() || null,
    fechaInspeccion: datos.fechaInspeccion ? new Date(datos.fechaInspeccion) : null,
  });

  const items = (datos.items ?? []).filter((i) => i.valor);
  if (items.length) {
    await db.insert(itemInspeccion).values(
      items.map((i) => ({
        id: id(),
        inspeccionId,
        seccion: i.seccion,
        clave: i.clave,
        valor: i.valor,
      }))
    );
  }

  revalidatePath("/panel/inspecciones");
  return { ok: true, numero: ultimo + 1, id: inspeccionId };
}
