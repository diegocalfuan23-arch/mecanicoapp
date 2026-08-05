"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { vehiculo, cliente } from "@/db/schema";

function id() {
  return crypto.randomUUID();
}

async function tallerActual() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) throw new Error("Sin sesión");
  return sesion.user.id;
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
  ejes?: string;
  procedencia?: string;
  propietarioNombre?: string;
  propietarioTelefono?: string;
  copropietario?: string;
  copropietarioTelefono?: string;
  primeraVez: boolean;
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
      ejes: vehiculo.ejes,
      procedencia: vehiculo.procedencia,
      copropietario: vehiculo.copropietario,
      primeraVez: vehiculo.primeraVez,
      propietario: cliente.nombre,
      propietarioTelefono: cliente.telefono,
    })
    .from(vehiculo)
    .leftJoin(cliente, eq(vehiculo.propietarioId, cliente.id))
    .where(eq(vehiculo.tallerId, tallerId))
    .orderBy(desc(vehiculo.createdAt));
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

    if (existente.length) {
      propietarioId = existente[0].id;
    } else {
      propietarioId = id();
      await db.insert(cliente).values({
        id: propietarioId,
        tallerId,
        nombre,
        telefono: datos.propietarioTelefono?.trim() || null,
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
    ejes: datos.ejes ? Number(datos.ejes) : null,
    procedencia: datos.procedencia || null,
    propietarioId,
    copropietario: datos.copropietario?.trim() || null,
    copropietarioTelefono: datos.copropietarioTelefono?.trim() || null,
    primeraVez: datos.primeraVez,
    notas: datos.notas?.trim() || null,
  });

  revalidatePath("/panel/vehiculos");
  return { ok: true };
}
