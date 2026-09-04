"use server";

import { revalidatePath } from "next/cache";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  presupuesto,
  itemPresupuesto,
  vehiculo,
  cliente,
  trabajo,
  parteUsada,
} from "@/db/schema";
import { tallerActual, tienePlan } from "@/lib/taller";
import { siguienteNumeroCliente } from "@/app/panel/propietarios/acciones";

function id() {
  return crypto.randomUUID();
}

export type ItemCotizado = {
  nombre: string;
  cantidad: string;
  precio: string;
};

/** Presupuestos pendientes primero, luego el resto, más nuevos primero. */
export async function listarPresupuestos() {
  const tallerId = await tallerActual();

  const filas = await db
    .select({
      id: presupuesto.id,
      numero: presupuesto.numero,
      patente: presupuesto.patente,
      clienteNombre: presupuesto.clienteNombre,
      estado: presupuesto.estado,
      fecha: presupuesto.fecha,
      total: sql<number>`coalesce(sum(${itemPresupuesto.cantidad} * ${itemPresupuesto.precioUnitario}), 0)`.mapWith(
        Number
      ),
    })
    .from(presupuesto)
    .leftJoin(itemPresupuesto, eq(itemPresupuesto.presupuestoId, presupuesto.id))
    .where(eq(presupuesto.tallerId, tallerId))
    .groupBy(presupuesto.id)
    .orderBy(
      sql`case when ${presupuesto.estado} = 'pendiente' then 0 else 1 end`,
      desc(presupuesto.fecha)
    );

  return filas;
}

export async function obtenerPresupuesto(presupuestoId: string) {
  const tallerId = await tallerActual();

  const [datos] = await db
    .select()
    .from(presupuesto)
    .where(and(eq(presupuesto.id, presupuestoId), eq(presupuesto.tallerId, tallerId)))
    .limit(1);

  if (!datos) return null;

  const items = await db
    .select({
      id: itemPresupuesto.id,
      nombre: itemPresupuesto.nombre,
      cantidad: itemPresupuesto.cantidad,
      precioUnitario: itemPresupuesto.precioUnitario,
    })
    .from(itemPresupuesto)
    .where(eq(itemPresupuesto.presupuestoId, presupuestoId));

  return { ...datos, items };
}

export async function crearPresupuesto(datos: {
  patente: string;
  clienteNombre?: string;
  clienteTelefono?: string;
  sintoma?: string;
  diagnostico?: string;
  items?: ItemCotizado[];
}) {
  if (!(await tienePlan("impresionOrden"))) {
    return { error: "Esta función es del Plan Serviteca." };
  }

  const tallerId = await tallerActual();
  const patente = datos.patente.trim().toUpperCase();
  if (!patente) return { error: "Escribe la patente." };

  const [{ ultimo }] = await db
    .select({
      ultimo: sql<number>`coalesce(max(${presupuesto.numero}), 0)`.mapWith(Number),
    })
    .from(presupuesto)
    .where(eq(presupuesto.tallerId, tallerId));

  const presupuestoId = id();

  await db.insert(presupuesto).values({
    id: presupuestoId,
    tallerId,
    numero: ultimo + 1,
    patente,
    clienteNombre: datos.clienteNombre?.trim() || null,
    clienteTelefono: datos.clienteTelefono?.trim() || null,
    sintoma: datos.sintoma?.trim() || null,
    diagnostico: datos.diagnostico?.trim() || null,
    estado: "pendiente",
  });

  const items = (datos.items ?? []).filter((i) => i.nombre.trim());
  if (items.length) {
    await db.insert(itemPresupuesto).values(
      items.map((i) => ({
        id: id(),
        presupuestoId,
        nombre: i.nombre.trim(),
        cantidad: Number(i.cantidad) || 1,
        precioUnitario: Number(i.precio) || 0,
      }))
    );
  }

  revalidatePath("/panel/presupuestos");
  return { ok: true, numero: ultimo + 1 };
}

/** Encuentra el vehículo por patente en este taller, o lo crea con lo poco que se sabe. */
async function vehiculoParaPatente(
  tallerId: string,
  patente: string,
  clienteNombre: string | null,
  clienteTelefono: string | null
) {
  const [existente] = await db
    .select({ id: vehiculo.id })
    .from(vehiculo)
    .where(and(eq(vehiculo.tallerId, tallerId), eq(vehiculo.patente, patente)))
    .limit(1);

  if (existente) return existente.id;

  let propietarioId: string | null = null;
  if (clienteNombre) {
    const [existenteCliente] = await db
      .select({ id: cliente.id })
      .from(cliente)
      .where(and(eq(cliente.tallerId, tallerId), eq(cliente.nombre, clienteNombre)))
      .limit(1);

    if (existenteCliente) {
      propietarioId = existenteCliente.id;
    } else {
      propietarioId = id();
      await db.insert(cliente).values({
        id: propietarioId,
        tallerId,
        numero: await siguienteNumeroCliente(tallerId),
        nombre: clienteNombre,
        telefono: clienteTelefono,
      });
    }
  }

  const vehiculoId = id();
  await db.insert(vehiculo).values({
    id: vehiculoId,
    tallerId,
    patente,
    propietarioId,
    primeraVez: true,
    comparteHistorial: false,
  });

  return vehiculoId;
}

/**
 * Aprobar: genera la Orden real con lo cotizado ya precargado como
 * repuestos — el mecánico solo ajusta si algo cambió al llegar el
 * auto de verdad, no anota todo de nuevo. Si la patente no estaba
 * registrada, se registra ahora con lo poco que se sabía al cotizar.
 */
export async function aprobarPresupuesto(presupuestoId: string) {
  const tallerId = await tallerActual();

  const [datos] = await db
    .select()
    .from(presupuesto)
    .where(and(eq(presupuesto.id, presupuestoId), eq(presupuesto.tallerId, tallerId)))
    .limit(1);

  if (!datos) return { error: "No se encontró ese presupuesto." };
  if (datos.estado !== "pendiente") {
    return { error: "Este presupuesto ya fue resuelto." };
  }

  const items = await db
    .select({
      nombre: itemPresupuesto.nombre,
      cantidad: itemPresupuesto.cantidad,
      precioUnitario: itemPresupuesto.precioUnitario,
    })
    .from(itemPresupuesto)
    .where(eq(itemPresupuesto.presupuestoId, presupuestoId));

  const vehiculoId = await vehiculoParaPatente(
    tallerId,
    datos.patente,
    datos.clienteNombre,
    datos.clienteTelefono
  );

  const [{ ultimo }] = await db
    .select({ ultimo: sql<number>`coalesce(max(${trabajo.numero}), 0)`.mapWith(Number) })
    .from(trabajo)
    .where(eq(trabajo.tallerId, tallerId));

  const trabajoId = id();

  await db.insert(trabajo).values({
    id: trabajoId,
    tallerId,
    vehiculoId,
    numero: ultimo + 1,
    sintoma: datos.sintoma,
    diagnostico: datos.diagnostico,
    ordenadoPor: datos.clienteNombre,
    ordenadoPorFono: datos.clienteTelefono,
    estado: "ingresado",
  });

  if (items.length) {
    await db.insert(parteUsada).values(
      items.map((i) => ({
        id: id(),
        trabajoId,
        nombre: i.nombre,
        cantidad: i.cantidad,
        precioUnitario: i.precioUnitario,
        costoUnitario: 0,
      }))
    );
  }

  await db
    .update(presupuesto)
    .set({ estado: "aprobado", trabajoId, updatedAt: new Date() })
    .where(eq(presupuesto.id, presupuestoId));

  revalidatePath("/panel/presupuestos");
  revalidatePath("/panel/ordenes");
  return { ok: true, trabajoId };
}

export async function rechazarPresupuesto(presupuestoId: string) {
  const tallerId = await tallerActual();

  await db
    .update(presupuesto)
    .set({ estado: "rechazado", updatedAt: new Date() })
    .where(
      and(
        eq(presupuesto.id, presupuestoId),
        eq(presupuesto.tallerId, tallerId),
        eq(presupuesto.estado, "pendiente")
      )
    );

  revalidatePath("/panel/presupuestos");
  return { ok: true };
}
