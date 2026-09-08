"use server";

import { revalidatePath } from "next/cache";
import { eq, and, gte, lt, asc } from "drizzle-orm";
import { db } from "@/db";
import { cita, cliente, vehiculo } from "@/db/schema";
import { tallerActual, tienePlan } from "@/lib/taller";

function id() {
  return crypto.randomUUID();
}

export type EstadoCita =
  | "agendada"
  | "confirmada"
  | "completada"
  | "no_presento"
  | "cancelada";

export type CitaMes = {
  id: string;
  clienteNombre: string | null;
  patente: string | null;
  contactoNombre: string | null;
  motivo: string;
  fecha: Date;
  estado: EstadoCita;
};

async function listarCitasEntre(desde: Date, hasta: Date) {
  if (!(await tienePlan("impresionOrden"))) return [];

  const tallerId = await tallerActual();

  const filas = await db
    .select({
      id: cita.id,
      clienteNombre: cliente.nombre,
      patente: vehiculo.patente,
      contactoNombre: cita.contactoNombre,
      motivo: cita.motivo,
      fecha: cita.fecha,
      estado: cita.estado,
    })
    .from(cita)
    .leftJoin(cliente, eq(cita.clienteId, cliente.id))
    .leftJoin(vehiculo, eq(cita.vehiculoId, vehiculo.id))
    .where(
      and(eq(cita.tallerId, tallerId), gte(cita.fecha, desde), lt(cita.fecha, hasta))
    )
    .orderBy(asc(cita.fecha));

  return filas as CitaMes[];
}

/**
 * Todas las citas del mes que cubre `fechaIso` (cualquier día de ese
 * mes) — la vista de calendario mensual pinta el mes completo de una vez.
 */
export async function listarCitasDelMes(fechaIso: string) {
  const fecha = new Date(`${fechaIso}T00:00:00`);
  const desde = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
  const hasta = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 1);
  return listarCitasEntre(desde, hasta);
}

/**
 * Todas las citas de los 7 días que empiezan en `lunesIso` — la vista
 * semanal puede cruzar el límite de un mes, así que no le sirve
 * listarCitasDelMes.
 */
export async function listarCitasDeSemana(lunesIso: string) {
  const desde = new Date(`${lunesIso}T00:00:00`);
  const hasta = new Date(desde.getTime() + 7 * 24 * 60 * 60 * 1000);
  return listarCitasEntre(desde, hasta);
}

/** Citas de un solo día — usado por la vista diaria. */
export async function listarCitasDeDia(diaIso: string) {
  const desde = new Date(`${diaIso}T00:00:00`);
  const hasta = new Date(desde.getTime() + 24 * 60 * 60 * 1000);
  return listarCitasEntre(desde, hasta);
}

export async function crearCita(datos: {
  clienteId?: string;
  vehiculoId?: string;
  contactoNombre?: string;
  contactoTelefono?: string;
  motivo: string;
  fechaIso: string;
  hora: string;
}) {
  if (!(await tienePlan("impresionOrden"))) {
    return { error: "Esta función es del Plan Serviteca." };
  }

  const tallerId = await tallerActual();

  if (!datos.motivo.trim()) {
    return { error: "Escribe el motivo de la cita." };
  }
  if (!datos.fechaIso || !datos.hora) {
    return { error: "Elige fecha y hora." };
  }

  const fecha = new Date(`${datos.fechaIso}T${datos.hora}:00`);
  if (Number.isNaN(fecha.getTime())) {
    return { error: "Fecha u hora inválida." };
  }

  await db.insert(cita).values({
    id: id(),
    tallerId,
    clienteId: datos.clienteId || null,
    vehiculoId: datos.vehiculoId || null,
    contactoNombre: datos.contactoNombre?.trim() || null,
    contactoTelefono: datos.contactoTelefono?.trim() || null,
    motivo: datos.motivo.trim(),
    fecha,
  });

  revalidatePath("/panel/agenda");
  return { ok: true };
}

export async function cambiarEstadoCita(citaId: string, estado: EstadoCita) {
  if (!(await tienePlan("impresionOrden"))) {
    return { error: "Esta función es del Plan Serviteca." };
  }

  const tallerId = await tallerActual();

  const [existe] = await db
    .select({ id: cita.id })
    .from(cita)
    .where(and(eq(cita.id, citaId), eq(cita.tallerId, tallerId)))
    .limit(1);

  if (!existe) return { error: "Cita no encontrada." };

  await db
    .update(cita)
    .set({ estado, updatedAt: new Date() })
    .where(eq(cita.id, citaId));

  revalidatePath("/panel/agenda");
  return { ok: true };
}

export async function eliminarCita(citaId: string) {
  if (!(await tienePlan("impresionOrden"))) {
    return { error: "Esta función es del Plan Serviteca." };
  }

  const tallerId = await tallerActual();

  await db.delete(cita).where(and(eq(cita.id, citaId), eq(cita.tallerId, tallerId)));

  revalidatePath("/panel/agenda");
  return { ok: true };
}
