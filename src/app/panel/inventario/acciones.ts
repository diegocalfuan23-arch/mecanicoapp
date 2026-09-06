"use server";

import { revalidatePath } from "next/cache";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import { parte, itemServicio } from "@/db/schema";
import { tallerActual, tienePlan } from "@/lib/taller";

export type TipoItemServicio = "servicio" | "mano_obra";

/**
 * Vacío si el taller no tiene el Plan Serviteca — así cualquier
 * pantalla que la use (Inventario, o las sugerencias al cerrar una
 * orden) deja de mostrar algo automáticamente, sin tener que
 * acordarse de chequear el plan en cada lugar por separado.
 */
export async function listarInventario() {
  if (!(await tienePlan("inventario"))) return [];

  const tallerId = await tallerActual();

  return db
    .select({
      id: parte.id,
      nombre: parte.nombre,
      codigo: parte.codigo,
      marca: parte.marca,
      stock: parte.stock,
      stockMinimo: parte.stockMinimo,
      costo: parte.costo,
      precio: parte.precio,
    })
    .from(parte)
    .where(eq(parte.tallerId, tallerId))
    .orderBy(asc(parte.nombre));
}

export async function guardarInsumo(datos: {
  nombre: string;
  codigo: string;
  marca: string;
  stock: string;
  stockMinimo: string;
  costo: string;
  precio: string;
}) {
  if (!(await tienePlan("inventario"))) {
    return { error: "El inventario no está disponible en tu plan." };
  }

  const tallerId = await tallerActual();
  const nombre = datos.nombre.trim();

  if (!nombre) return { error: "Escribe el nombre del insumo." };

  await db.insert(parte).values({
    id: crypto.randomUUID(),
    tallerId,
    nombre,
    codigo: datos.codigo.trim() || null,
    marca: datos.marca.trim() || null,
    stock: Number(datos.stock) || 0,
    stockMinimo: Number(datos.stockMinimo) || 0,
    costo: Number(datos.costo) || 0,
    precio: Number(datos.precio) || 0,
  });

  revalidatePath("/panel/inventario");
  return { ok: true };
}

export async function actualizarInsumo(
  insumoId: string,
  datos: {
    nombre: string;
    codigo: string;
    marca: string;
    stock: string;
    stockMinimo: string;
    costo: string;
    precio: string;
  }
) {
  if (!(await tienePlan("inventario"))) {
    return { error: "El inventario no está disponible en tu plan." };
  }

  const tallerId = await tallerActual();
  const nombre = datos.nombre.trim();

  if (!nombre) return { error: "Escribe el nombre del insumo." };

  await db
    .update(parte)
    .set({
      nombre,
      codigo: datos.codigo.trim() || null,
      marca: datos.marca.trim() || null,
      stock: Number(datos.stock) || 0,
      stockMinimo: Number(datos.stockMinimo) || 0,
      costo: Number(datos.costo) || 0,
      precio: Number(datos.precio) || 0,
      updatedAt: new Date(),
    })
    .where(and(eq(parte.id, insumoId), eq(parte.tallerId, tallerId)));

  revalidatePath("/panel/inventario");
  return { ok: true };
}

export async function eliminarInsumo(insumoId: string) {
  if (!(await tienePlan("inventario"))) return;

  const tallerId = await tallerActual();

  await db
    .delete(parte)
    .where(and(eq(parte.id, insumoId), eq(parte.tallerId, tallerId)));

  revalidatePath("/panel/inventario");
}

/**
 * Servicio y mano de obra viven aparte de `parte`: no tienen stock, y
 * el precio se arma distinto según el tipo — un servicio es precio
 * fijo, la mano de obra es tarifa por hora × horas por defecto.
 */
export async function listarServicios() {
  if (!(await tienePlan("inventario"))) return [];

  const tallerId = await tallerActual();

  return db
    .select({
      id: itemServicio.id,
      tipo: itemServicio.tipo,
      nombre: itemServicio.nombre,
      descripcion: itemServicio.descripcion,
      costo: itemServicio.costo,
      precio: itemServicio.precio,
      duracionMinutos: itemServicio.duracionMinutos,
      tarifaHora: itemServicio.tarifaHora,
      horasPorDefecto: itemServicio.horasPorDefecto,
    })
    .from(itemServicio)
    .where(eq(itemServicio.tallerId, tallerId))
    .orderBy(asc(itemServicio.nombre));
}

export async function guardarServicio(datos: {
  tipo: TipoItemServicio;
  nombre: string;
  descripcion: string;
  costo: string;
  precio: string;
  duracionMinutos: string;
  tarifaHora: string;
  horasPorDefecto: string;
}) {
  if (!(await tienePlan("inventario"))) {
    return { error: "El inventario no está disponible en tu plan." };
  }

  const tallerId = await tallerActual();
  const nombre = datos.nombre.trim();

  if (!nombre) return { error: "Escribe el nombre del ítem." };

  await db.insert(itemServicio).values({
    id: crypto.randomUUID(),
    tallerId,
    tipo: datos.tipo,
    nombre,
    descripcion: datos.descripcion.trim() || null,
    costo: Number(datos.costo) || 0,
    precio: datos.tipo === "servicio" ? Number(datos.precio) || 0 : null,
    duracionMinutos:
      datos.tipo === "servicio" ? Number(datos.duracionMinutos) || null : null,
    tarifaHora:
      datos.tipo === "mano_obra" ? Number(datos.tarifaHora) || 0 : null,
    horasPorDefecto:
      datos.tipo === "mano_obra"
        ? Number(datos.horasPorDefecto) || null
        : null,
  });

  revalidatePath("/panel/inventario");
  return { ok: true };
}

export async function actualizarServicio(
  itemId: string,
  datos: {
    tipo: TipoItemServicio;
    nombre: string;
    descripcion: string;
    costo: string;
    precio: string;
    duracionMinutos: string;
    tarifaHora: string;
    horasPorDefecto: string;
  }
) {
  if (!(await tienePlan("inventario"))) {
    return { error: "El inventario no está disponible en tu plan." };
  }

  const tallerId = await tallerActual();
  const nombre = datos.nombre.trim();

  if (!nombre) return { error: "Escribe el nombre del ítem." };

  await db
    .update(itemServicio)
    .set({
      tipo: datos.tipo,
      nombre,
      descripcion: datos.descripcion.trim() || null,
      costo: Number(datos.costo) || 0,
      precio: datos.tipo === "servicio" ? Number(datos.precio) || 0 : null,
      duracionMinutos:
        datos.tipo === "servicio"
          ? Number(datos.duracionMinutos) || null
          : null,
      tarifaHora:
        datos.tipo === "mano_obra" ? Number(datos.tarifaHora) || 0 : null,
      horasPorDefecto:
        datos.tipo === "mano_obra"
          ? Number(datos.horasPorDefecto) || null
          : null,
      updatedAt: new Date(),
    })
    .where(and(eq(itemServicio.id, itemId), eq(itemServicio.tallerId, tallerId)));

  revalidatePath("/panel/inventario");
  return { ok: true };
}

export async function eliminarServicio(itemId: string) {
  if (!(await tienePlan("inventario"))) return;

  const tallerId = await tallerActual();

  await db
    .delete(itemServicio)
    .where(and(eq(itemServicio.id, itemId), eq(itemServicio.tallerId, tallerId)));

  revalidatePath("/panel/inventario");
}
