"use server";

import { revalidatePath } from "next/cache";
import { eq, and, desc } from "drizzle-orm";
import { db } from "@/db";
import { conversacion, mensaje } from "@/db/schema";
import { tallerActual } from "@/lib/taller";

export async function listarConversaciones() {
  const tallerId = await tallerActual();

  return db
    .select({
      id: conversacion.id,
      titulo: conversacion.titulo,
      updatedAt: conversacion.updatedAt,
    })
    .from(conversacion)
    .where(eq(conversacion.tallerId, tallerId))
    .orderBy(desc(conversacion.updatedAt))
    .limit(50);
}

export async function leerConversacion(conversacionId: string) {
  const tallerId = await tallerActual();

  const [duena] = await db
    .select({ id: conversacion.id })
    .from(conversacion)
    .where(
      and(
        eq(conversacion.id, conversacionId),
        eq(conversacion.tallerId, tallerId)
      )
    )
    .limit(1);

  if (!duena) return null;

  return db
    .select({ rol: mensaje.rol, texto: mensaje.texto })
    .from(mensaje)
    .where(eq(mensaje.conversacionId, conversacionId))
    .orderBy(mensaje.fecha);
}

/**
 * Guarda el par pregunta/respuesta. Si no viene conversacionId, abre una
 * conversación nueva usando la pregunta como título.
 */
export async function guardarIntercambio(datos: {
  conversacionId: string | null;
  pregunta: string;
  respuesta: string;
}) {
  const tallerId = await tallerActual();
  let id = datos.conversacionId;

  if (id) {
    const [duena] = await db
      .select({ id: conversacion.id })
      .from(conversacion)
      .where(and(eq(conversacion.id, id), eq(conversacion.tallerId, tallerId)))
      .limit(1);

    if (!duena) return { error: "No se encontró esa conversación." };

    await db
      .update(conversacion)
      .set({ updatedAt: new Date() })
      .where(eq(conversacion.id, id));
  } else {
    id = crypto.randomUUID();
    const titulo =
      datos.pregunta.length > 60
        ? `${datos.pregunta.slice(0, 60)}…`
        : datos.pregunta;

    await db.insert(conversacion).values({ id, tallerId, titulo });
  }

  await db.insert(mensaje).values([
    {
      id: crypto.randomUUID(),
      conversacionId: id,
      rol: "usuario",
      texto: datos.pregunta,
    },
    {
      id: crypto.randomUUID(),
      conversacionId: id,
      rol: "asistente",
      texto: datos.respuesta,
    },
  ]);

  revalidatePath("/panel/asistente");
  return { ok: true, conversacionId: id };
}

export async function borrarConversacion(conversacionId: string) {
  const tallerId = await tallerActual();

  await db
    .delete(conversacion)
    .where(
      and(
        eq(conversacion.id, conversacionId),
        eq(conversacion.tallerId, tallerId)
      )
    );

  revalidatePath("/panel/asistente");
  return { ok: true };
}
