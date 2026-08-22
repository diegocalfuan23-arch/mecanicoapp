import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { miembroTaller } from "@/db/schema";

/**
 * El taller sobre el que trabaja la sesión actual: el propio usuario
 * si es dueño, o el taller al que pertenece si es un ayudante. Todas
 * las acciones del panel filtran por este id, no por sesion.user.id
 * directo — así un ayudante ve y edita los mismos datos que el dueño.
 */
export async function tallerActual() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) throw new Error("Sin sesión");

  const [miembro] = await db
    .select({ tallerId: miembroTaller.tallerId })
    .from(miembroTaller)
    .where(eq(miembroTaller.userId, sesion.user.id))
    .limit(1);

  return miembro?.tallerId ?? sesion.user.id;
}
