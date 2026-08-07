"use server";

import { headers } from "next/headers";
import { eq, and, or, ne, ilike, desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { vehiculo, cliente, trabajo, user } from "@/db/schema";

async function tallerActual() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) throw new Error("Sin sesión");
  return sesion.user.id;
}

export type ResultadoBusqueda = {
  id: string;
  patente: string;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  color: string | null;
  propietario: string | null;
  visitas: number;
  /** false = vehículo de otro taller, encontrado por patente exacta. */
  propio: boolean;
};

/** Busca por patente, VIN, marca, modelo o nombre del dueño. */
export async function buscarVehiculos(
  consulta: string
): Promise<ResultadoBusqueda[]> {
  const tallerId = await tallerActual();
  const q = consulta.trim();
  if (!q) return [];

  const patron = `%${q}%`;

  const propios = await db
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

  // Búsqueda cruzada entre talleres: solo si la consulta luce como
  // patente completa (no una búsqueda amplia por marca/modelo), para no
  // exponer listas de vehículos ajenos con términos genéricos.
  const patenteLimpia = q.toUpperCase().replace(/[\s-]/g, "");
  let ajenos: ResultadoBusqueda[] = [];

  if (patenteLimpia.length >= 5) {
    ajenos = await db
      .select({
        id: vehiculo.id,
        patente: vehiculo.patente,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        anio: vehiculo.anio,
        color: vehiculo.color,
        propietario: cliente.nombre,
        visitas: sql<number>`count(${trabajo.id})`.mapWith(Number),
        propio: sql<boolean>`false`,
      })
      .from(vehiculo)
      .leftJoin(cliente, eq(vehiculo.propietarioId, cliente.id))
      .leftJoin(trabajo, eq(trabajo.vehiculoId, vehiculo.id))
      .where(
        and(
          ne(vehiculo.tallerId, tallerId),
          sql`upper(replace(replace(${vehiculo.patente}, ' ', ''), '-', '')) = ${patenteLimpia}`
        )
      )
      .groupBy(vehiculo.id, cliente.nombre)
      .limit(5);
  }

  return [
    ...propios.map((v) => ({ ...v, propio: true })),
    ...ajenos,
  ].slice(0, 20);
}

/**
 * Ficha completa del vehículo. Ya no filtra por tallerId: es lo que
 * habilita ver el historial de un vehículo de otro taller. El control de
 * qué se expone pasa a `verMontos` — sin autorización del dueño se ven
 * fecha, síntoma, descripción y qué se cambió, pero nunca montos ni el
 * estado de pago.
 */
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
      compartirMontos: vehiculo.compartirMontos,
      propietario: cliente.nombre,
      telefono: cliente.telefono,
      esPropio: sql<boolean>`${vehiculo.tallerId} = ${tallerId}`,
    })
    .from(vehiculo)
    .leftJoin(cliente, eq(vehiculo.propietarioId, cliente.id))
    .where(eq(vehiculo.id, vehiculoId))
    .limit(1);

  if (!datos) return null;

  const verMontos = datos.esPropio || datos.compartirMontos;

  const trabajos = await db
    .select({
      id: trabajo.id,
      numero: trabajo.numero,
      sintoma: trabajo.sintoma,
      descripcion: trabajo.descripcion,
      kilometraje: trabajo.kilometraje,
      estado: trabajo.estado,
      fecha: trabajo.fecha,
      tallerNombre: user.taller,
      esPropio: sql<boolean>`${trabajo.tallerId} = ${tallerId}`,
      estadoPago: verMontos ? trabajo.estadoPago : sql<string | null>`null`,
      manoObra: verMontos ? trabajo.manoObra : sql<number | null>`null`,
      repuestos: verMontos ? trabajo.repuestos : sql<number | null>`null`,
      cargoTraslado: verMontos
        ? trabajo.cargoTraslado
        : sql<number | null>`null`,
      total: verMontos ? trabajo.total : sql<number | null>`null`,
      abonado: verMontos ? trabajo.abonado : sql<number | null>`null`,
    })
    .from(trabajo)
    .leftJoin(user, eq(trabajo.tallerId, user.id))
    .where(eq(trabajo.vehiculoId, vehiculoId))
    .orderBy(desc(trabajo.fecha));

  const gastado = verMontos
    ? trabajos.reduce((suma, t) => suma + (t.total ?? 0), 0)
    : null;
  const debe = verMontos
    ? trabajos.reduce(
        (suma, t) =>
          suma + (t.estadoPago !== "pagado" ? (t.total ?? 0) - (t.abonado ?? 0) : 0),
        0
      )
    : null;

  return { datos, trabajos, gastado, debe, verMontos, esPropio: datos.esPropio };
}
