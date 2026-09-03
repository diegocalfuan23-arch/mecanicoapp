"use server";

import { headers } from "next/headers";
import { randomUUID } from "crypto";
import { eq, and, or, ne, ilike, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { vehiculo, cliente, trabajo, user, busquedaPatente } from "@/db/schema";
import { tallerActual } from "@/lib/taller";
import { auth } from "@/lib/auth";

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

  // Cada palabra debe aparecer en algún campo, no la frase completa en
  // uno solo: así "nissan qashqai" encuentra el auto con marca Nissan y
  // modelo Qashqai, que con un solo ilike de la frase entera no calzaba.
  const palabras = q.split(/\s+/).filter(Boolean).slice(0, 5);
  const calza = (palabra: string) => {
    const patron = `%${palabra}%`;
    return or(
      ilike(vehiculo.patente, patron),
      ilike(vehiculo.vin, patron),
      ilike(vehiculo.marca, patron),
      ilike(vehiculo.modelo, patron),
      ilike(vehiculo.color, patron),
      ilike(vehiculo.tipo, patron),
      ilike(cliente.nombre, patron)
    );
  };

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
    .where(and(eq(vehiculo.tallerId, tallerId), ...palabras.map(calza)))
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
          // Sin el consentimiento del dueño el auto no aparece siquiera
          // en la búsqueda de otro taller.
          eq(vehiculo.comparteHistorial, true),
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
 * Ficha completa del vehículo. No filtra por tallerId: es lo que habilita
 * ver el historial de un vehículo de otro taller.
 *
 * Dos reglas distintas protegen cosas distintas:
 * - El dueño del auto debe haber autorizado que se comparta (ley 21.719,
 *   él es el titular de los datos aunque el usuario sea el taller).
 * - Lo que cobró otro taller es secreto siempre, eso protege al taller.
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
      propietario: cliente.nombre,
      telefono: cliente.telefono,
      comparteHistorial: vehiculo.comparteHistorial,
      esPropio: sql<boolean>`${vehiculo.tallerId} = ${tallerId}`,
    })
    .from(vehiculo)
    .leftJoin(cliente, eq(vehiculo.propietarioId, cliente.id))
    .where(eq(vehiculo.id, vehiculoId))
    .limit(1);

  if (!datos) return null;

  // Sin consentimiento del dueño, un taller ajeno no ve nada de este
  // auto — ni con el enlace directo. Se responde igual que si no
  // existiera, para no revelar que la ficha está ahí.
  if (!datos.esPropio && !datos.comparteHistorial) return null;

  // Los montos son solo del taller dueño de la ficha.
  const verMontos = datos.esPropio;

  const trabajos = await db
    .select({
      id: trabajo.id,
      numero: trabajo.numero,
      sintoma: trabajo.sintoma,
      descripcion: trabajo.descripcion,
      kilometraje: trabajo.kilometraje,
      estado: trabajo.estado,
      fecha: trabajo.fecha,
      fotos: trabajo.fotos,
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

/**
 * Historial de búsquedas: personal de cada mecánico, no del taller —
 * un ayudante y el dueño buscan cosas distintas día a día. Por eso
 * guarda sesion.user.id directo, no tallerActual() (que junta a todos
 * los miembros del mismo taller bajo un solo id).
 */
export async function guardarBusquedaPatente(patente: string) {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) return;

  const limpia = patente.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!limpia) return;

  await db.insert(busquedaPatente).values({
    id: randomUUID(),
    userId: sesion.user.id,
    patente: limpia,
  });
}

/** Últimas patentes que este mecánico buscó, sin repetir. */
export async function busquedasRecientes(): Promise<string[]> {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) return [];

  const filas = await db
    .select({ patente: busquedaPatente.patente })
    .from(busquedaPatente)
    .where(eq(busquedaPatente.userId, sesion.user.id))
    .orderBy(desc(busquedaPatente.buscadoEn))
    .limit(20);

  const vistas = new Set<string>();
  const unicas: string[] = [];
  for (const { patente } of filas) {
    if (vistas.has(patente)) continue;
    vistas.add(patente);
    unicas.push(patente);
    if (unicas.length === 6) break;
  }
  return unicas;
}
