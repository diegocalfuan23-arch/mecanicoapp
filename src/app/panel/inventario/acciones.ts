"use server";

import { revalidatePath } from "next/cache";
import { eq, and, asc } from "drizzle-orm";
import { db } from "@/db";
import { parte } from "@/db/schema";
import { tallerActual } from "@/lib/taller";

export async function listarInventario() {
  const tallerId = await tallerActual();

  return db
    .select({
      id: parte.id,
      nombre: parte.nombre,
      codigo: parte.codigo,
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
  stock: string;
  stockMinimo: string;
  costo: string;
  precio: string;
}) {
  const tallerId = await tallerActual();
  const nombre = datos.nombre.trim();

  if (!nombre) return { error: "Escribe el nombre del insumo." };

  await db.insert(parte).values({
    id: crypto.randomUUID(),
    tallerId,
    nombre,
    codigo: datos.codigo.trim() || null,
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
    stock: string;
    stockMinimo: string;
    costo: string;
    precio: string;
  }
) {
  const tallerId = await tallerActual();
  const nombre = datos.nombre.trim();

  if (!nombre) return { error: "Escribe el nombre del insumo." };

  await db
    .update(parte)
    .set({
      nombre,
      codigo: datos.codigo.trim() || null,
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
  const tallerId = await tallerActual();

  await db
    .delete(parte)
    .where(and(eq(parte.id, insumoId), eq(parte.tallerId, tallerId)));

  revalidatePath("/panel/inventario");
}
