import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user, miembroTaller } from "@/db/schema";

/**
 * Los planes reales, en orden de tamaño de taller — pensados en
 * Tío Lalo/Pipe (taller), Senna (serviteca, con equipo e inventario)
 * y cadenas (empresarial, a medida, sin validar todavía). "prueba" es
 * el valor por defecto de toda cuenta nueva: no bloquea nada, solo
 * marca que aún no se decidió un plan real.
 *
 * Sin UI todavía — se activa a mano en la base por ahora. El punto es
 * tener la función lista para cuando algún taller (Senna primero)
 * empiece a pagar, sin tener que construir esto recién en ese momento.
 */
export const PLANES = ["prueba", "taller", "serviteca", "empresarial"] as const;
export type Plan = (typeof PLANES)[number];

/** Qué funciones desbloquea cada plan. "prueba" y "taller" ven lo mismo. */
export const FUNCIONES_POR_PLAN: Record<Plan, { inventario: boolean; impresionOrden: boolean }> = {
  prueba: { inventario: false, impresionOrden: false },
  taller: { inventario: false, impresionOrden: false },
  serviteca: { inventario: true, impresionOrden: true },
  empresarial: { inventario: true, impresionOrden: true },
};

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

/**
 * El plan del taller actual (dueño o ayudante, ya resuelto por
 * tallerActual()). Sin UI que lo cambie todavía — se edita a mano
 * en la base (columna user.plan) hasta que exista un flujo de cobro
 * real. No usar esto para nada visible aún: solo para tener la
 * lectura lista.
 */
export async function planActual(): Promise<Plan> {
  const tallerId = await tallerActual();

  const [fila] = await db
    .select({ plan: user.plan })
    .from(user)
    .where(eq(user.id, tallerId))
    .limit(1);

  const plan = fila?.plan;
  return (PLANES as readonly string[]).includes(plan ?? "")
    ? (plan as Plan)
    : "prueba";
}

/** Si el plan actual desbloquea una función dada. */
export async function tienePlan(
  funcion: keyof (typeof FUNCIONES_POR_PLAN)["prueba"]
) {
  const plan = await planActual();
  return FUNCIONES_POR_PLAN[plan][funcion];
}

/**
 * Si el usuario de la sesión actual puede ver Pagos y los precios de
 * costo/venta del inventario — pedido real (Carserv): el dueño del
 * taller decide, ayudante por ayudante, quién ve esa información.
 * El dueño siempre puede: solo un ayudante puede tener esto apagado.
 */
export async function puedeVerPagos() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) return false;

  const [miembro] = await db
    .select({ vePagos: miembroTaller.vePagos })
    .from(miembroTaller)
    .where(eq(miembroTaller.userId, sesion.user.id))
    .limit(1);

  // Sin fila en miembroTaller: es el dueño, ve todo.
  return miembro?.vePagos ?? true;
}
