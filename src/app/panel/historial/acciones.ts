"use server";

import { headers } from "next/headers";
import { eq, and, or, ilike, desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { vehiculo, cliente, trabajo } from "@/db/schema";

async function tallerActual() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) throw new Error("Sin sesión");
  return sesion.user.id;
}

/** Busca por patente, VIN, marca, modelo o nombre del dueño. */
export async function buscarVehiculos(consulta: string) {
  const tallerId = await tallerActual();
  const q = consulta.trim();
  if (!q) return [];

  const patron = `%${q}%`;

  return db
    .select({
      id: vehiculo.id,
      patente: vehiculo.patente,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      color: vehiculo.color,
      propietario: cliente.nombre,
      visitas: sql<number>`count(${trabajo.id})`.mapWith(Number),
    })
    .from(vehiculo)
    .leftJoin(cliente, eq(vehiculo.propietarioId, cliente.id))
    .leftJoin(trabajo, eq(trabajo.vehiculoId, vehiculo.id))
    .where(
      and(
        eq(vehiculo.tallerId, tallerId),
        or(
          ilike(vehiculo.patente, patron),
          ilike(vehiculo.vin, patron),
          ilike(vehiculo.marca, patron),
          ilike(vehiculo.modelo, patron),
          ilike(cliente.nombre, patron)
        )
      )
    )
    .groupBy(vehiculo.id, cliente.nombre)
    .orderBy(vehiculo.patente)
    .limit(20);
}

/** Ficha completa del vehículo con todo lo que se le ha hecho. */
export async function fichaVehiculo(vehiculoId: string) {
  const tallerId = await tallerActual();

  const [datos] = await db
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
      kilometrajeInicial: vehiculo.kilometrajeInicial,
      copropietario: vehiculo.copropietario,
      copropietarioTelefono: vehiculo.copropietarioTelefono,
      notas: vehiculo.notas,
      propietario: cliente.nombre,
      telefono: cliente.telefono,
    })
    .from(vehiculo)
    .leftJoin(cliente, eq(vehiculo.propietarioId, cliente.id))
    .where(and(eq(vehiculo.id, vehiculoId), eq(vehiculo.tallerId, tallerId)))
    .limit(1);

  if (!datos) return null;

  const trabajos = await db
    .select({
      id: trabajo.id,
      numero: trabajo.numero,
      sintoma: trabajo.sintoma,
      descripcion: trabajo.descripcion,
      kilometraje: trabajo.kilometraje,
      estado: trabajo.estado,
      estadoPago: trabajo.estadoPago,
      manoObra: trabajo.manoObra,
      repuestos: trabajo.repuestos,
      cargoTraslado: trabajo.cargoTraslado,
      total: trabajo.total,
      abonado: trabajo.abonado,
      fecha: trabajo.fecha,
    })
    .from(trabajo)
    .where(eq(trabajo.vehiculoId, vehiculoId))
    .orderBy(desc(trabajo.fecha));

  const gastado = trabajos.reduce((suma, t) => suma + t.total, 0);
  const debe = trabajos.reduce(
    (suma, t) => suma + (t.estadoPago !== "pagado" ? t.total - t.abonado : 0),
    0
  );

  return { datos, trabajos, gastado, debe };
}
