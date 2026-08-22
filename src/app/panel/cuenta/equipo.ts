"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user, miembroTaller } from "@/db/schema";
import { tallerActual } from "@/lib/taller";

export async function listarEquipo() {
  const tallerId = await tallerActual();

  return db
    .select({
      id: miembroTaller.id,
      nombre: user.name,
      correo: user.email,
      createdAt: miembroTaller.createdAt,
    })
    .from(miembroTaller)
    .innerJoin(user, eq(miembroTaller.userId, user.id))
    .where(eq(miembroTaller.tallerId, tallerId));
}

export async function agregarAyudante(datos: {
  nombre: string;
  correo: string;
  clave: string;
}) {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) throw new Error("Sin sesión");

  const tallerId = await tallerActual();

  // Un ayudante no puede agregar más ayudantes: solo el dueño, que es
  // el único caso donde tallerActual() coincide con su propio id.
  if (tallerId !== sesion.user.id) {
    return { error: "Solo el dueño del taller puede agregar ayudantes." };
  }

  const nombre = datos.nombre.trim();
  const correo = datos.correo.trim();

  if (!nombre || !correo || datos.clave.length < 8) {
    return { error: "Revisa los datos: nombre, correo y clave de 8+ caracteres." };
  }

  const creado = await auth.api.signUpEmail({
    body: { name: nombre, email: correo, password: datos.clave },
  });

  if (!creado?.user) {
    return { error: "No se pudo crear la cuenta. ¿El correo ya existe?" };
  }

  await db.insert(miembroTaller).values({
    id: crypto.randomUUID(),
    tallerId,
    userId: creado.user.id,
    rol: "ayudante",
  });

  revalidatePath("/panel/cuenta");
  return { ok: true };
}

export async function quitarAyudante(miembroId: string) {
  const tallerId = await tallerActual();

  await db
    .delete(miembroTaller)
    .where(and(eq(miembroTaller.id, miembroId), eq(miembroTaller.tallerId, tallerId)));

  revalidatePath("/panel/cuenta");
}
