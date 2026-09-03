"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";

/**
 * Solo devuelve si el correo tiene cuenta o no — pedido explícito
 * del dueño de la app para avisar al mecánico que se equivocó de
 * correo en vez de dejarlo con el mensaje ambiguo de siempre. No
 * expone nada más (ni el nombre, ni si está verificado, etc.).
 *
 * Nota de seguridad para quien retome esto: revelar si un correo
 * existe permite a cualquiera usar este formulario para averiguar
 * qué correos son clientes de la app (enumeración de usuarios) —
 * decisión consciente y aceptada, no un descuido.
 */
export async function correoTieneCuenta(correo: string) {
  const [fila] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, correo.trim().toLowerCase()))
    .limit(1);

  return !!fila;
}
