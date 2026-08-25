"use server";

import { revalidatePath } from "next/cache";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { vehiculo, cliente, trabajo } from "@/db/schema";
import { tallerActual } from "@/lib/taller";
import { siguienteNumeroCliente } from "@/app/panel/propietarios/acciones";

function id() {
  return crypto.randomUUID();
}

export type DatosVehiculo = {
  patente: string;
  vin?: string;
  marca?: string;
  modelo?: string;
  anio?: string;
  color?: string;
  tipo?: string;
  motor?: string;
  cilindrada?: string;
  movil?: string;
  ejes?: string;
  procedencia?: string;
  kilometrajeInicial?: string;
  propietarioNombre?: string;
  propietarioTelefono?: string;
  copropietario?: string;
  copropietarioTelefono?: string;
  primeraVez: boolean;
  comparteHistorial: boolean;
  notas?: string;
};

export async function listarVehiculos() {
  const tallerId = await tallerActual();

  return db
    .select({
      id: vehiculo.id,
      patente: vehiculo.patente,
      vin: vehiculo.vin,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      color: vehiculo.color,
      tipo: vehiculo.tipo,
      motor: vehiculo.motor,
      cilindrada: vehiculo.cilindrada,
      movil: vehiculo.movil,
      ejes: vehiculo.ejes,
      procedencia: vehiculo.procedencia,
      kilometrajeInicial: vehiculo.kilometrajeInicial,
      copropietario: vehiculo.copropietario,
      copropietarioTelefono: vehiculo.copropietarioTelefono,
      notas: vehiculo.notas,
      primeraVez: vehiculo.primeraVez,
      comparteHistorial: vehiculo.comparteHistorial,
      propietario: cliente.nombre,
      propietarioTelefono: cliente.telefono,
      propietarioEmail: cliente.email,
      propietarioDireccion: cliente.direccion,
      propietarioComuna: cliente.comuna,
      propietarioCiudad: cliente.ciudad,
      esEmpresa: cliente.esEmpresa,
      empresa: cliente.empresa,
      empresaRut: cliente.empresaRut,
    })
    .from(vehiculo)
    .leftJoin(cliente, eq(vehiculo.propietarioId, cliente.id))
    .where(eq(vehiculo.tallerId, tallerId))
    .orderBy(desc(vehiculo.createdAt));
}

export async function actualizarVehiculo(
  vehiculoId: string,
  datos: DatosVehiculo
) {
  const tallerId = await tallerActual();
  const patente = datos.patente.trim().toUpperCase();

  const [actual] = await db
    .select({ id: vehiculo.id })
    .from(vehiculo)
    .where(and(eq(vehiculo.id, vehiculoId), eq(vehiculo.tallerId, tallerId)))
    .limit(1);

  if (!actual) return { error: "No se encontró ese vehículo." };

  // Otra ficha del taller ya puede tener esa patente.
  const repetida = await db
    .select({ id: vehiculo.id })
    .from(vehiculo)
    .where(and(eq(vehiculo.tallerId, tallerId), eq(vehiculo.patente, patente)))
    .limit(2);

  if (repetida.some((v) => v.id !== vehiculoId)) {
    return { error: `La patente ${patente} ya está en otra ficha.` };
  }

  let propietarioId: string | null = null;
  const nombre = datos.propietarioNombre?.trim();

  if (nombre) {
    const existente = await db
      .select({ id: cliente.id })
      .from(cliente)
      .where(and(eq(cliente.tallerId, tallerId), eq(cliente.nombre, nombre)))
      .limit(1);

    // Solo el teléfono se toca desde acá: email/dirección/empresa son
    // datos del cliente que se editan en Propietarios, para no
    // pisarlos sin querer si este formulario no los muestra.
    const datosCliente = {
      telefono: datos.propietarioTelefono?.trim() || null,
    };

    if (existente.length) {
      propietarioId = existente[0].id;
      await db
        .update(cliente)
        .set({ ...datosCliente, updatedAt: new Date() })
        .where(eq(cliente.id, propietarioId));
    } else {
      propietarioId = id();
      await db.insert(cliente).values({
        id: propietarioId,
        tallerId,
        numero: await siguienteNumeroCliente(tallerId),
        nombre,
        ...datosCliente,
      });
    }
  }

  await db
    .update(vehiculo)
    .set({
      patente,
      vin: datos.vin?.trim().toUpperCase() || null,
      marca: datos.marca?.trim() || null,
      modelo: datos.modelo?.trim() || null,
      anio: datos.anio ? Number(datos.anio) : null,
      color: datos.color?.trim() || null,
      tipo: datos.tipo || null,
      motor: datos.motor?.trim() || null,
      cilindrada: datos.cilindrada?.trim() || null,
      movil: datos.movil?.trim() || null,
      ejes: datos.ejes ? Number(datos.ejes) : null,
      procedencia: datos.procedencia || null,
      kilometrajeInicial: datos.kilometrajeInicial
        ? Number(datos.kilometrajeInicial)
        : null,
      propietarioId,
      copropietario: datos.copropietario?.trim() || null,
      copropietarioTelefono: datos.copropietarioTelefono?.trim() || null,
      primeraVez: datos.primeraVez,
      comparteHistorial: datos.comparteHistorial,
      consentimientoFecha: datos.comparteHistorial ? new Date() : null,
      notas: datos.notas?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(vehiculo.id, vehiculoId));

  revalidatePath("/panel/vehiculos");
  revalidatePath("/panel/historial");
  return { ok: true };
}

/**
 * Borrar arrastra las ordenes en cascada, asi que un vehiculo con
 * historial no se elimina: ese historial es el corazon de la app.
 */
export async function eliminarVehiculo(vehiculoId: string) {
  const tallerId = await tallerActual();

  const [actual] = await db
    .select({ patente: vehiculo.patente })
    .from(vehiculo)
    .where(and(eq(vehiculo.id, vehiculoId), eq(vehiculo.tallerId, tallerId)))
    .limit(1);

  if (!actual) return { error: "No se encontró ese vehículo." };

  const [conteo] = await db
    .select({ cuantos: sql<number>`count(*)`.mapWith(Number) })
    .from(trabajo)
    .where(eq(trabajo.vehiculoId, vehiculoId));

  if (conteo.cuantos > 0) {
    return {
      error: `${actual.patente} tiene ${conteo.cuantos} ${
        conteo.cuantos === 1 ? "trabajo registrado" : "trabajos registrados"
      }. Si lo borras se pierde su historial.`,
    };
  }

  await db.delete(vehiculo).where(eq(vehiculo.id, vehiculoId));

  revalidatePath("/panel/vehiculos");
  revalidatePath("/panel/historial");
  return { ok: true };
}

export async function guardarVehiculo(datos: DatosVehiculo) {
  const tallerId = await tallerActual();
  const patente = datos.patente.trim().toUpperCase();

  const yaExiste = await db
    .select({ id: vehiculo.id })
    .from(vehiculo)
    .where(and(eq(vehiculo.tallerId, tallerId), eq(vehiculo.patente, patente)))
    .limit(1);

  if (yaExiste.length) {
    return { error: `La patente ${patente} ya está registrada.` };
  }

  // El propietario tiene ficha propia: se reutiliza si ya existe por nombre.
  let propietarioId: string | null = null;
  const nombre = datos.propietarioNombre?.trim();

  if (nombre) {
    const existente = await db
      .select({ id: cliente.id })
      .from(cliente)
      .where(and(eq(cliente.tallerId, tallerId), eq(cliente.nombre, nombre)))
      .limit(1);

    // Solo el teléfono se toca desde acá: email/dirección/empresa son
    // datos del cliente que se editan en Propietarios, para no
    // pisarlos sin querer si este formulario no los muestra.
    const datosCliente = {
      telefono: datos.propietarioTelefono?.trim() || null,
    };

    if (existente.length) {
      propietarioId = existente[0].id;
      await db
        .update(cliente)
        .set({ ...datosCliente, updatedAt: new Date() })
        .where(eq(cliente.id, propietarioId));
    } else {
      propietarioId = id();
      await db.insert(cliente).values({
        id: propietarioId,
        tallerId,
        numero: await siguienteNumeroCliente(tallerId),
        nombre,
        ...datosCliente,
      });
    }
  }

  await db.insert(vehiculo).values({
    id: id(),
    tallerId,
    patente,
    vin: datos.vin?.trim().toUpperCase() || null,
    marca: datos.marca?.trim() || null,
    modelo: datos.modelo?.trim() || null,
    anio: datos.anio ? Number(datos.anio) : null,
    color: datos.color?.trim() || null,
    tipo: datos.tipo || null,
    motor: datos.motor?.trim() || null,
    cilindrada: datos.cilindrada?.trim() || null,
    movil: datos.movil?.trim() || null,
    ejes: datos.ejes ? Number(datos.ejes) : null,
    procedencia: datos.procedencia || null,
    kilometrajeInicial: datos.kilometrajeInicial
      ? Number(datos.kilometrajeInicial)
      : null,
    propietarioId,
    copropietario: datos.copropietario?.trim() || null,
    copropietarioTelefono: datos.copropietarioTelefono?.trim() || null,
    primeraVez: datos.primeraVez,
    comparteHistorial: datos.comparteHistorial,
    consentimientoFecha: datos.comparteHistorial ? new Date() : null,
    notas: datos.notas?.trim() || null,
  });

  revalidatePath("/panel/vehiculos");
  return { ok: true };
}
