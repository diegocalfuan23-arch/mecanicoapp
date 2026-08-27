"use server";

import { revalidatePath } from "next/cache";
import { eq, and, asc, desc } from "drizzle-orm";
import { db } from "@/db";
import { servicioTaller, parte } from "@/db/schema";
import { tallerActual, tienePlan } from "@/lib/taller";

/**
 * Vacío si el taller no tiene Plan Serviteca — así cualquier pantalla
 * que la use deja de mostrar algo automáticamente, sin tener que
 * acordarse de chequear el plan en cada lugar por separado.
 */
export async function listarServicios() {
  if (!(await tienePlan("impresionOrden"))) return [];

  const tallerId = await tallerActual();

  return db
    .select({
      id: servicioTaller.id,
      grupo: servicioTaller.grupo,
      codigo: servicioTaller.codigo,
      etiqueta: servicioTaller.etiqueta,
      orden: servicioTaller.orden,
      parteId: servicioTaller.parteId,
      parteNombre: parte.nombre,
    })
    .from(servicioTaller)
    .leftJoin(parte, eq(servicioTaller.parteId, parte.id))
    .where(eq(servicioTaller.tallerId, tallerId))
    .orderBy(asc(servicioTaller.orden));
}

export async function crearServicio(datos: {
  grupo: string;
  codigo: string;
  etiqueta: string;
  parteId: string | null;
}) {
  if (!(await tienePlan("impresionOrden"))) {
    return { error: "Los servicios no están disponibles en tu plan." };
  }

  const tallerId = await tallerActual();
  const grupo = datos.grupo.trim();
  const etiqueta = datos.etiqueta.trim();

  if (!grupo) return { error: "Escribe el nombre del grupo." };
  if (!etiqueta) return { error: "Escribe el nombre del servicio." };

  const [{ maximo } = { maximo: -1 }] = await db
    .select({ maximo: servicioTaller.orden })
    .from(servicioTaller)
    .where(eq(servicioTaller.tallerId, tallerId))
    .orderBy(desc(servicioTaller.orden))
    .limit(1);

  const nuevo = {
    id: crypto.randomUUID(),
    tallerId,
    grupo,
    codigo: datos.codigo.trim(),
    etiqueta,
    parteId: datos.parteId,
    orden: (maximo ?? -1) + 1,
  };

  await db.insert(servicioTaller).values(nuevo);

  revalidatePath("/panel/servicios");
  revalidatePath("/panel/ordenes");
  return { ok: true, item: nuevo };
}

export async function editarServicio(
  id: string,
  datos: {
    grupo: string;
    codigo: string;
    etiqueta: string;
    parteId: string | null;
  }
) {
  if (!(await tienePlan("impresionOrden"))) {
    return { error: "Los servicios no están disponibles en tu plan." };
  }

  const tallerId = await tallerActual();
  const grupo = datos.grupo.trim();
  const etiqueta = datos.etiqueta.trim();

  if (!grupo) return { error: "Escribe el nombre del grupo." };
  if (!etiqueta) return { error: "Escribe el nombre del servicio." };

  await db
    .update(servicioTaller)
    .set({
      grupo,
      codigo: datos.codigo.trim(),
      etiqueta,
      parteId: datos.parteId,
    })
    .where(and(eq(servicioTaller.id, id), eq(servicioTaller.tallerId, tallerId)));

  revalidatePath("/panel/servicios");
  revalidatePath("/panel/ordenes");
  return { ok: true };
}

export async function eliminarServicio(id: string) {
  if (!(await tienePlan("impresionOrden"))) return;

  const tallerId = await tallerActual();

  await db
    .delete(servicioTaller)
    .where(and(eq(servicioTaller.id, id), eq(servicioTaller.tallerId, tallerId)));

  revalidatePath("/panel/servicios");
  revalidatePath("/panel/ordenes");
}
