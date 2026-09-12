"use server";

import { headers } from "next/headers";
import { eq, inArray } from "drizzle-orm";
import { UTApi } from "uploadthing/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { tallerActual } from "@/lib/taller";
import {
  user,
  cliente,
  vehiculo,
  trabajo,
  abono,
  conversacion,
  mensaje,
  miembroTaller,
} from "@/db/schema";

async function sesionActual() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) throw new Error("Sin sesión");
  return sesion;
}

/**
 * Datos del taller para el encabezado de la orden de trabajo impresa
 * (Plan Serviteca) — nombre, RUT, dirección y teléfono del negocio.
 * Solo el dueño los edita — son identidad legal del negocio, no algo
 * que un ayudante (jefe_taller, mecánico o rol a medida) deba tocar,
 * sea cual sea su plan. El gate visual en page.tsx no basta: una
 * server action es invocable directo sin pasar por la UI.
 */
export async function guardarDatosTaller(datos: {
  taller: string;
  rut: string;
  direccion: string;
  telefono: string;
  logo?: string;
}) {
  const sesion = await sesionActual();
  const tallerId = await tallerActual();
  if (tallerId !== sesion.user.id) {
    throw new Error("Solo el dueño del taller puede editar estos datos.");
  }

  await db
    .update(user)
    .set({
      taller: datos.taller.trim() || null,
      rut: datos.rut.trim() || null,
      direccion: datos.direccion.trim() || null,
      telefono: datos.telefono.trim() || null,
      ...(datos.logo !== undefined ? { image: datos.logo || null } : {}),
    })
    .where(eq(user.id, tallerId));
}

/**
 * Derecho de acceso y portabilidad (ley 21.719): todo lo que la app
 * guarda del taller, en un JSON que se puede descargar y llevar.
 */
/**
 * Trae el taller real, no sesion.user.id directo: para un ayudante
 * eso exportaría una cuenta prácticamente vacía en vez de los datos
 * reales del taller donde trabaja.
 */
export async function exportarMisDatos() {
  await sesionActual();
  const tallerId = await tallerActual();

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
 *
 * Solo el dueño: para un ayudante su user.id no es el taller, así que
 * esto de nada le serviría para "borrar el taller" (el texto de la UI
 * es específicamente sobre eso) — su equivalente es salirDelEquipo().
 */
export async function eliminarMiCuenta(correoEscrito: string) {
  const sesion = await sesionActual();
  const tallerId = await tallerActual();
  if (tallerId !== sesion.user.id) {
    return { error: "Los ayudantes no pueden eliminar el taller — usa \"Salir del equipo\"." };
  }

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

/**
 * Equivalente a "eliminar cuenta" para un ayudante: deja de tener
 * acceso al taller, pero su cuenta de usuario sigue existiendo (podría
 * unirse a otro taller después). No borra nada del taller — a
 * diferencia de eliminarMiCuenta(), esto nunca toca vehículos,
 * clientes ni órdenes.
 */
export async function salirDelEquipo() {
  const sesion = await sesionActual();
  const tallerId = await tallerActual();
  if (tallerId === sesion.user.id) {
    return { error: "El dueño no puede salir de su propio taller." };
  }

  await db.delete(miembroTaller).where(eq(miembroTaller.userId, sesion.user.id));
  return { ok: true };
}
