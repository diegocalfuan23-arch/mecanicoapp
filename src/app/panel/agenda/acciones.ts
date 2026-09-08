"use server";

import { revalidatePath } from "next/cache";
import { eq, and, gte, lt, asc } from "drizzle-orm";
import { db } from "@/db";
import { cita, cliente, vehiculo, itemServicio, user, miembroTaller } from "@/db/schema";
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

export type Modalidad = "en_taller" | "domicilio" | "retiro_vehiculo";

export type CitaMes = {
  id: string;
  clienteNombre: string | null;
  patente: string | null;
  contactoNombre: string | null;
  titulo: string | null;
  motivo: string;
  servicioTexto: string | null;
  servicioNombre: string | null;
  mecanicoTexto: string | null;
  mecanicoNombre: string | null;
  modalidad: Modalidad;
  fecha: Date;
  fechaFin: Date | null;
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
      titulo: cita.titulo,
      motivo: cita.motivo,
      servicioTexto: cita.servicioTexto,
      servicioNombre: itemServicio.nombre,
      mecanicoTexto: cita.mecanicoTexto,
      mecanicoNombre: user.name,
      modalidad: cita.modalidad,
      fecha: cita.fecha,
      fechaFin: cita.fechaFin,
      estado: cita.estado,
    })
    .from(cita)
    .leftJoin(cliente, eq(cita.clienteId, cliente.id))
    .leftJoin(vehiculo, eq(cita.vehiculoId, vehiculo.id))
    .leftJoin(itemServicio, eq(cita.servicioId, itemServicio.id))
    .leftJoin(user, eq(cita.mecanicoId, user.id))
    .where(
      and(eq(cita.tallerId, tallerId), gte(cita.fecha, desde), lt(cita.fecha, hasta))
    )
    .orderBy(asc(cita.fecha));

  return filas as CitaMes[];
}

/** Miembros del equipo del taller — para el dropdown de mecánico/técnico. */
export async function listarEquipoParaCita() {
  if (!(await tienePlan("impresionOrden"))) return [];

  const tallerId = await tallerActual();

  return db
    .select({ id: user.id, nombre: user.name })
    .from(miembroTaller)
    .innerJoin(user, eq(miembroTaller.userId, user.id))
    .where(eq(miembroTaller.tallerId, tallerId))
    .orderBy(asc(user.name));
}

/** Catálogo de servicios (item_servicio, tipo "servicio") — para el dropdown de Tipo de servicio. */
export async function listarServiciosParaCita() {
  if (!(await tienePlan("impresionOrden"))) return [];

  const tallerId = await tallerActual();

  return db
    .select({ id: itemServicio.id, nombre: itemServicio.nombre })
    .from(itemServicio)
    .where(and(eq(itemServicio.tallerId, tallerId), eq(itemServicio.tipo, "servicio")))
    .orderBy(asc(itemServicio.nombre));
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
  titulo?: string;
  motivo: string;
  servicioId?: string;
  servicioTexto?: string;
  mecanicoId?: string;
  mecanicoTexto?: string;
  modalidad?: Modalidad;
  fechaIso: string;
  hora: string;
  horaFin?: string;
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

  let fechaFin: Date | null = null;
  if (datos.horaFin) {
    fechaFin = new Date(`${datos.fechaIso}T${datos.horaFin}:00`);
    if (Number.isNaN(fechaFin.getTime())) {
      return { error: "Hora de fin inválida." };
    }
    if (fechaFin <= fecha) {
      return { error: "La hora de fin debe ser después del inicio." };
    }
  }

  await db.insert(cita).values({
    id: id(),
    tallerId,
    clienteId: datos.clienteId || null,
    vehiculoId: datos.vehiculoId || null,
    contactoNombre: datos.contactoNombre?.trim() || null,
    contactoTelefono: datos.contactoTelefono?.trim() || null,
    titulo: datos.titulo?.trim() || null,
    motivo: datos.motivo.trim(),
    servicioId: datos.servicioId || null,
    servicioTexto: datos.servicioId ? null : datos.servicioTexto?.trim() || null,
    mecanicoId: datos.mecanicoId || null,
    mecanicoTexto: datos.mecanicoId ? null : datos.mecanicoTexto?.trim() || null,
    modalidad: datos.modalidad || "en_taller",
    fecha,
    fechaFin,
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
