"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user, account, miembroTaller } from "@/db/schema";
import { tallerActual } from "@/lib/taller";
import { hashPassword } from "@better-auth/utils/password";

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

  const existente = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, correo))
    .limit(1);

  if (existente.length) {
    return { error: "Ya existe una cuenta con ese correo." };
  }

  // No se usa auth.api.signUpEmail: ese endpoint deja al dueño con la
  // sesión del ayudante recién creado (Better Auth hace login
  // automático al registrar, y nextCookies() aplica esa cookie nueva
  // sin distinguir quién llamó al endpoint). Se crea la cuenta directo
  // en la base, con el mismo hash que usa Better Auth por dentro.
  const nuevoId = crypto.randomUUID();
  const hash = await hashPassword(datos.clave);

  await db.insert(user).values({
    id: nuevoId,
    name: nombre,
    email: correo,
    emailVerified: false,
  });

  await db.insert(account).values({
    id: crypto.randomUUID(),
    userId: nuevoId,
    providerId: "credential",
    accountId: nuevoId,
    password: hash,
  });

  await db.insert(miembroTaller).values({
    id: crypto.randomUUID(),
    tallerId,
    userId: nuevoId,
    rol: "ayudante",
  });

  revalidatePath("/panel/equipo");
  return { ok: true };
}

export async function quitarAyudante(miembroId: string) {
  const tallerId = await tallerActual();

  await db
    .delete(miembroTaller)
    .where(and(eq(miembroTaller.id, miembroId), eq(miembroTaller.tallerId, tallerId)));

  revalidatePath("/panel/equipo");
}
