"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, gt, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  user,
  account,
  miembroTaller,
  invitacionTaller,
  rolPersonalizado,
} from "@/db/schema";
import {
  tallerActual,
  rolActual,
  tienePlan,
  MODULOS_PERSONALIZABLES,
  type Rol,
} from "@/lib/taller";
import { enviarInvitacionEquipo } from "@/lib/correo";
import { hashPassword } from "@better-auth/utils/password";

const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

export async function listarEquipo() {
  const tallerId = await tallerActual();

  return db
    .select({
      id: miembroTaller.id,
      nombre: user.name,
      correo: user.email,
      rol: miembroTaller.rol,
      vePagos: miembroTaller.vePagos,
      rolPersonalizadoId: miembroTaller.rolPersonalizadoId,
      rolPersonalizadoNombre: rolPersonalizado.nombre,
      createdAt: miembroTaller.createdAt,
    })
    .from(miembroTaller)
    .innerJoin(user, eq(miembroTaller.userId, user.id))
    .leftJoin(
      rolPersonalizado,
      eq(miembroTaller.rolPersonalizadoId, rolPersonalizado.id)
    )
    .where(eq(miembroTaller.tallerId, tallerId));
}

/**
 * Roles a medida del taller — Plan Empresarial. Vacío en cualquier
 * otro plan: ni siquiera se molesta en consultar la tabla.
 */
export async function listarRolesPersonalizados() {
  if (!(await tienePlan("rolesPersonalizados"))) return [];

  const tallerId = await tallerActual();

  return db
    .select({
      id: rolPersonalizado.id,
      nombre: rolPersonalizado.nombre,
      permisos: rolPersonalizado.permisos,
    })
    .from(rolPersonalizado)
    .where(eq(rolPersonalizado.tallerId, tallerId));
}

/** Solo dueño y jefe_taller crean/editan/eliminan roles a medida. */
async function puedeGestionarRoles() {
  const rol = await rolActual();
  return (
    (rol === "dueno" || rol === "jefe_taller") &&
    (await tienePlan("rolesPersonalizados"))
  );
}

function permisosValidos(permisos: Record<string, boolean>) {
  const limpio: Record<string, boolean> = {};
  for (const modulo of MODULOS_PERSONALIZABLES) {
    if (permisos[modulo] === true) limpio[modulo] = true;
  }
  return limpio;
}

export async function crearRolPersonalizado(datos: {
  nombre: string;
  permisos: Record<string, boolean>;
}) {
  if (!(await puedeGestionarRoles())) {
    return { error: "No tienes permiso para crear roles." };
  }

  const nombre = datos.nombre.trim();
  if (!nombre) return { error: "Escribe un nombre para el rol." };

  const tallerId = await tallerActual();

  await db.insert(rolPersonalizado).values({
    id: crypto.randomUUID(),
    tallerId,
    nombre,
    permisos: permisosValidos(datos.permisos),
  });

  revalidatePath("/panel/equipo");
  return { ok: true };
}

export async function actualizarRolPersonalizado(
  rolId: string,
  datos: { nombre: string; permisos: Record<string, boolean> }
) {
  if (!(await puedeGestionarRoles())) {
    return { error: "No tienes permiso para editar roles." };
  }

  const nombre = datos.nombre.trim();
  if (!nombre) return { error: "Escribe un nombre para el rol." };

  const tallerId = await tallerActual();

  await db
    .update(rolPersonalizado)
    .set({ nombre, permisos: permisosValidos(datos.permisos) })
    .where(
      and(eq(rolPersonalizado.id, rolId), eq(rolPersonalizado.tallerId, tallerId))
    );

  revalidatePath("/panel/equipo");
  return { ok: true };
}

/**
 * Borrar un rol no elimina a quienes lo tienen asignado — solo se
 * quedan sin rol personalizado (rolPersonalizadoId vuelve a null por
 * el ON DELETE SET NULL de la FK) y caen de vuelta a las reglas
 * clásicas de mecanico, para no dejar a nadie con una sesión rota.
 */
export async function eliminarRolPersonalizado(rolId: string) {
  if (!(await puedeGestionarRoles())) return;

  const tallerId = await tallerActual();

  await db
    .delete(rolPersonalizado)
    .where(
      and(eq(rolPersonalizado.id, rolId), eq(rolPersonalizado.tallerId, tallerId))
    );

  revalidatePath("/panel/equipo");
}

export async function listarInvitacionesPendientes() {
  const tallerId = await tallerActual();

  return db
    .select({
      id: invitacionTaller.id,
      nombre: invitacionTaller.nombre,
      email: invitacionTaller.email,
      rol: invitacionTaller.rol,
      expiraEn: invitacionTaller.expiraEn,
    })
    .from(invitacionTaller)
    .where(
      and(
        eq(invitacionTaller.tallerId, tallerId),
        isNull(invitacionTaller.usadaEn),
        gt(invitacionTaller.expiraEn, new Date())
      )
    );
}

/**
 * Solo dueño y jefe_taller pueden gestionar Equipo, y un jefe_taller
 * nunca puede tocar a otro jefe_taller (ni asignar ese rol) — eso
 * queda reservado al dueño, para que un jefe_taller no pueda apilar
 * más jefes por su cuenta.
 */
async function puedeGestionar(rolObjetivo: Rol) {
  const rol = await rolActual();
  if (rol === "dueno") return true;
  if (rol === "jefe_taller") return rolObjetivo === "mecanico";
  return false;
}

export async function crearInvitacion(datos: {
  nombre: string;
  correo: string;
  rol: Rol;
  /** Solo Plan Empresarial — manda sobre `rol` si viene seteado. */
  rolPersonalizadoId?: string | null;
}) {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) throw new Error("Sin sesión");

  const tallerId = await tallerActual();
  const nombre = datos.nombre.trim();
  const correo = datos.correo.trim().toLowerCase();
  const rol = datos.rol === "jefe_taller" ? "jefe_taller" : "mecanico";

  // Un rol personalizado siempre pasa por gestión de Equipo (dueño o
  // jefe_taller) — no hereda el chequeo jefe_taller-nunca-crea-jefes,
  // que solo aplica a los dos roles clásicos.
  let rolPersonalizadoId: string | null = null;
  if (datos.rolPersonalizadoId) {
    if (!(await puedeGestionarRoles())) {
      return { error: "No tienes permiso para asignar roles a medida." };
    }
    const [fila] = await db
      .select({ id: rolPersonalizado.id })
      .from(rolPersonalizado)
      .where(
        and(
          eq(rolPersonalizado.id, datos.rolPersonalizadoId),
          eq(rolPersonalizado.tallerId, tallerId)
        )
      )
      .limit(1);
    if (!fila) return { error: "Ese rol ya no existe." };
    rolPersonalizadoId = fila.id;
  } else if (!(await puedeGestionar(rol))) {
    return {
      error:
        rol === "jefe_taller"
          ? "Solo el dueño del taller puede nombrar jefes de taller."
          : "No tienes permiso para invitar gente al equipo.",
    };
  }

  if (!nombre || !correo) {
    return { error: "Escribe el nombre y el correo." };
  }

  const existente = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, correo))
    .limit(1);

  if (existente.length) {
    return { error: "Ya existe una cuenta con ese correo." };
  }

  const [tallerFila] = await db
    .select({ nombre: user.name })
    .from(user)
    .where(eq(user.id, tallerId))
    .limit(1);

  const id = crypto.randomUUID();
  const token = crypto.randomUUID();

  await db.insert(invitacionTaller).values({
    id,
    token,
    tallerId,
    invitadoPorId: sesion.user.id,
    email: correo,
    nombre,
    rol,
    rolPersonalizadoId,
    expiraEn: new Date(Date.now() + SIETE_DIAS_MS),
  });

  const url = `${process.env.NEXT_PUBLIC_URL ?? "https://mecanicoapp.com"}/invitacion/${token}`;

  try {
    await enviarInvitacionEquipo({
      para: correo,
      nombre,
      taller: tallerFila?.nombre ?? "Tu taller",
      url,
    });
  } catch {
    // El correo pudo fallar (proveedor caído, dominio no verificado),
    // pero la invitación ya quedó creada — el link se puede compartir
    // igual a mano, no hace falta abortar todo el alta por esto.
  }

  revalidatePath("/panel/equipo");
  return { ok: true, url };
}

export async function cancelarInvitacion(invitacionId: string) {
  const tallerId = await tallerActual();

  await db
    .delete(invitacionTaller)
    .where(
      and(
        eq(invitacionTaller.id, invitacionId),
        eq(invitacionTaller.tallerId, tallerId)
      )
    );

  revalidatePath("/panel/equipo");
}

/**
 * Datos públicos de una invitación válida — usado por la página
 * /invitacion/[token], antes de que exista sesión.
 */
export async function obtenerInvitacion(token: string) {
  const [inv] = await db
    .select({
      nombre: invitacionTaller.nombre,
      email: invitacionTaller.email,
      rol: invitacionTaller.rol,
      rolPersonalizadoId: invitacionTaller.rolPersonalizadoId,
      rolPersonalizadoNombre: rolPersonalizado.nombre,
      expiraEn: invitacionTaller.expiraEn,
      usadaEn: invitacionTaller.usadaEn,
      tallerNombre: user.name,
    })
    .from(invitacionTaller)
    .innerJoin(user, eq(invitacionTaller.tallerId, user.id))
    .leftJoin(
      rolPersonalizado,
      eq(invitacionTaller.rolPersonalizadoId, rolPersonalizado.id)
    )
    .where(eq(invitacionTaller.token, token))
    .limit(1);

  if (!inv) return { error: "Esta invitación no existe." };
  if (inv.usadaEn) return { error: "Esta invitación ya se usó." };
  if (inv.expiraEn < new Date()) return { error: "Esta invitación venció." };

  return { ok: true as const, invitacion: inv };
}

/**
 * El invitado crea su propia cuenta y contraseña — reemplaza al flujo
 * anterior donde el dueño definía la clave a mano. No se usa
 * auth.api.signUpEmail: igual que en el alta antigua, dejaría la
 * sesión del navegador (que puede no ser de nadie todavía, pero mejor
 * no depender de eso) en un estado ambiguo; se crea la cuenta directo
 * con el mismo hash que usa Better Auth por dentro, y quien la crea
 * inicia sesión después por el flujo normal de login.
 */
export async function aceptarInvitacion(
  token: string,
  datos: { clave: string }
) {
  const { ok, error, invitacion } = await obtenerInvitacion(token);
  if (!ok) return { error };

  if (datos.clave.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  const [fila] = await db
    .select({ id: invitacionTaller.id, tallerId: invitacionTaller.tallerId })
    .from(invitacionTaller)
    .where(eq(invitacionTaller.token, token))
    .limit(1);

  if (!fila) return { error: "Esta invitación no existe." };

  const nuevoId = crypto.randomUUID();
  const hash = await hashPassword(datos.clave);

  await db.insert(user).values({
    id: nuevoId,
    name: invitacion.nombre,
    email: invitacion.email,
    emailVerified: true,
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
    tallerId: fila.tallerId,
    userId: nuevoId,
    rol: invitacion.rol,
    rolPersonalizadoId: invitacion.rolPersonalizadoId,
  });

  await db
    .update(invitacionTaller)
    .set({ usadaEn: new Date() })
    .where(eq(invitacionTaller.id, fila.id));

  return { ok: true as const };
}

export async function cambiarRol(miembroId: string, rol: Rol) {
  const tallerId = await tallerActual();
  const nuevoRol = rol === "jefe_taller" ? "jefe_taller" : "mecanico";

  if (!(await puedeGestionar(nuevoRol))) {
    return {
      error:
        nuevoRol === "jefe_taller"
          ? "Solo el dueño del taller puede nombrar jefes de taller."
          : "No tienes permiso para cambiar roles.",
    };
  }

  // Volver a jefe_taller/mecanico clásico deja atrás cualquier rol a
  // medida que tuviera asignado — los dos sistemas son excluyentes
  // para un mismo miembro.
  await db
    .update(miembroTaller)
    .set({ rol: nuevoRol, rolPersonalizadoId: null })
    .where(
      and(eq(miembroTaller.id, miembroId), eq(miembroTaller.tallerId, tallerId))
    );

  revalidatePath("/panel/equipo");
  return { ok: true };
}

/**
 * Asigna (o quita, con null) un rol a medida a un miembro ya
 * existente — la contraparte de cambiarRol() para el otro sistema.
 * Un jefe_taller nunca gestiona esto: roles a medida quedan
 * reservados al dueño, igual que nombrar otro jefe_taller.
 */
export async function asignarRolPersonalizado(
  miembroId: string,
  rolPersonalizadoId: string | null
) {
  if (!(await puedeGestionarRoles())) {
    return { error: "No tienes permiso para asignar roles a medida." };
  }
  const rol = await rolActual();
  if (rol !== "dueno") {
    return { error: "Solo el dueño del taller asigna roles a medida." };
  }

  const tallerId = await tallerActual();

  if (rolPersonalizadoId) {
    const [fila] = await db
      .select({ id: rolPersonalizado.id })
      .from(rolPersonalizado)
      .where(
        and(
          eq(rolPersonalizado.id, rolPersonalizadoId),
          eq(rolPersonalizado.tallerId, tallerId)
        )
      )
      .limit(1);
    if (!fila) return { error: "Ese rol ya no existe." };
  }

  await db
    .update(miembroTaller)
    .set({ rolPersonalizadoId })
    .where(
      and(eq(miembroTaller.id, miembroId), eq(miembroTaller.tallerId, tallerId))
    );

  revalidatePath("/panel/equipo");
  return { ok: true };
}

/**
 * El dueño decide, persona por persona, si ve Pagos y los precios de
 * costo/venta del inventario — pedido real de Carserv.
 */
export async function cambiarVePagos(miembroId: string, vePagos: boolean) {
  const tallerId = await tallerActual();

  await db
    .update(miembroTaller)
    .set({ vePagos })
    .where(and(eq(miembroTaller.id, miembroId), eq(miembroTaller.tallerId, tallerId)));

  revalidatePath("/panel/equipo");
}

export async function quitarMiembro(miembroId: string) {
  const tallerId = await tallerActual();

  const [miembro] = await db
    .select({ rol: miembroTaller.rol })
    .from(miembroTaller)
    .where(
      and(eq(miembroTaller.id, miembroId), eq(miembroTaller.tallerId, tallerId))
    )
    .limit(1);

  if (!miembro) return;
  if (!(await puedeGestionar(miembro.rol === "jefe_taller" ? "jefe_taller" : "mecanico"))) {
    return;
  }

  await db
    .delete(miembroTaller)
    .where(and(eq(miembroTaller.id, miembroId), eq(miembroTaller.tallerId, tallerId)));

  revalidatePath("/panel/equipo");
}
