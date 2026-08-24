"use server";

import { headers } from "next/headers";
import { eq, inArray } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  user,
  cliente,
  vehiculo,
  trabajo,
  abono,
  conversacion,
  mensaje,
} from "@/db/schema";

async function sesionActual() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) throw new Error("Sin sesión");
  return sesion;
}

/**
 * Datos del taller para el encabezado de la orden de trabajo impresa
 * (Plan Serviteca) — nombre, RUT, dirección y teléfono del negocio.
 */
export async function guardarDatosTaller(datos: {
  taller: string;
  rut: string;
  direccion: string;
  telefono: string;
}) {
  const sesion = await sesionActual();

  await db
    .update(user)
    .set({
      taller: datos.taller.trim() || null,
      rut: datos.rut.trim() || null,
      direccion: datos.direccion.trim() || null,
      telefono: datos.telefono.trim() || null,
    })
    .where(eq(user.id, sesion.user.id));
}

/**
 * Derecho de acceso y portabilidad (ley 21.719): todo lo que la app
 * guarda del taller, en un JSON que se puede descargar y llevar.
 */
export async function exportarMisDatos() {
  const sesion = await sesionActual();
  const tallerId = sesion.user.id;

  const [cuenta] = await db
    .select({
      nombre: user.name,
      email: user.email,
      taller: user.taller,
      telefono: user.telefono,
      plan: user.plan,
      creada: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, tallerId))
    .limit(1);

  const [clientes, vehiculos, trabajos, conversaciones] = await Promise.all([
    db.select().from(cliente).where(eq(cliente.tallerId, tallerId)),
    db.select().from(vehiculo).where(eq(vehiculo.tallerId, tallerId)),
    db.select().from(trabajo).where(eq(trabajo.tallerId, tallerId)),
    db
      .select()
      .from(conversacion)
      .where(eq(conversacion.tallerId, tallerId)),
  ]);

  // Los abonos y mensajes cuelgan de trabajos y conversaciones, no del
  // taller: se traen a partir de todos esos ids.
  const abonos = trabajos.length
    ? await db
        .select()
        .from(abono)
        .where(
          inArray(
            abono.trabajoId,
            trabajos.map((t) => t.id)
          )
        )
    : [];

  const mensajes = conversaciones.length
    ? await db
        .select()
        .from(mensaje)
        .where(
          inArray(
            mensaje.conversacionId,
            conversaciones.map((c) => c.id)
          )
        )
    : [];

  return {
    exportadoEl: new Date().toISOString(),
    cuenta,
    clientes,
    vehiculos,
    trabajos,
    abonos,
    conversaciones,
    mensajes,
  };
}

/** La URL es https://<appId>.ufs.sh/f/<key>: la key es el último tramo. */
function claveDeFoto(url: string) {
  return url.split("/").pop() ?? "";
}

/**
 * Derecho de supresión (ley 21.719). Borra el usuario; las claves
 * foráneas están en cascada, así que arrastra clientes, vehículos,
 * trabajos, abonos, conversaciones y mensajes.
 *
 * Las fotos viven fuera de la base, en UploadThing, y hay que borrarlas
 * aparte: si solo se borra la fila, el archivo queda accesible por su
 * URL y la supresión no sería real.
 *
 * Pide el correo escrito a mano: es irreversible y no puede pasar por
 * un clic accidental.
 */
export async function eliminarMiCuenta(correoEscrito: string) {
  const sesion = await sesionActual();

  if (
    correoEscrito.trim().toLowerCase() !== sesion.user.email.toLowerCase()
  ) {
    return { error: "El correo no coincide con el de tu cuenta." };
  }

  const conFotos = await db
    .select({ fotos: trabajo.fotos })
    .from(trabajo)
    .where(eq(trabajo.tallerId, sesion.user.id));

  const claves = conFotos
    .flatMap((t) => t.fotos)
    .map(claveDeFoto)
    .filter(Boolean);

  if (claves.length > 0) {
    try {
      await new UTApi().deleteFiles(claves);
    } catch {
      // Si UploadThing falla no se aborta el borrado: dejar la cuenta a
      // medio eliminar sería peor. Queda registrado para revisarlo.
      console.error(
        `No se pudieron borrar ${claves.length} fotos del taller ${sesion.user.id}`
      );
    }
  }

  await db.delete(user).where(eq(user.id, sesion.user.id));
  return { ok: true };
}
