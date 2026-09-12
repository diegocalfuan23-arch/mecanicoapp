import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user, miembroTaller, rolPersonalizado } from "@/db/schema";
// Re-exportado desde modulos-panel.ts (sin next/headers) para que el
// resto de este archivo siga importando todo desde un único lugar —
// pero un Client Component que solo necesite la lista de módulos debe
// importar de modulos-panel.ts directo, nunca de acá: cualquier cosa
// importada de taller.ts arrastra next/headers, que solo es válido en
// Server Components.
import {
  MODULOS_PERSONALIZABLES,
  ETIQUETA_MODULO,
  type ModuloPersonalizable,
} from "./modulos-panel";
export { MODULOS_PERSONALIZABLES, ETIQUETA_MODULO, type ModuloPersonalizable };

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

/**
 * Qué funciones desbloquea cada plan. "prueba" y "taller" ven lo
 * mismo, salvo `busquedaPatente`: se dejó abierta en todos los
 * planes (incluido prueba) porque el costo real está acotado por el
 * caché compartido en `vehiculoExterno` — solo se gasta cuota de
 * GetAPI en patentes que nadie buscó antes en toda la plataforma.
 */
export const FUNCIONES_POR_PLAN: Record<
  Plan,
  {
    inventario: boolean;
    impresionOrden: boolean;
    busquedaPatente: boolean;
    // Roles a medida con matriz de permisos por módulo — cadenas de
    // talleres con estructura más compleja (Contador, Ayudante de
    // recepción, etc.), exclusivo Empresarial.
    rolesPersonalizados: boolean;
  }
> = {
  prueba: {
    inventario: false,
    impresionOrden: false,
    busquedaPatente: true,
    rolesPersonalizados: false,
  },
  taller: {
    inventario: false,
    impresionOrden: false,
    busquedaPatente: true,
    rolesPersonalizados: false,
  },
  serviteca: {
    inventario: true,
    impresionOrden: true,
    busquedaPatente: true,
    rolesPersonalizados: false,
  },
  empresarial: {
    inventario: true,
    impresionOrden: true,
    busquedaPatente: true,
    rolesPersonalizados: true,
  },
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

export const ROLES = ["dueno", "jefe_taller", "mecanico"] as const;
export type Rol = (typeof ROLES)[number];

/**
 * El rol de la sesión actual dentro de SU taller. "dueno" es implícito
 * (sin fila en miembroTaller, ver tallerActual()) y siempre tiene el
 * control total — un jefe_taller no puede tocar a otro jefe_taller ni
 * al dueño, solo gestiona mecánicos. Un miembro con rol personalizado
 * cae igual en "mecanico" acá — este valor solo importa para el
 * layout jefe/mecánico clásico; sus permisos reales de módulo se
 * consultan aparte con permisosModulo().
 */
export async function rolActual(): Promise<Rol> {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) return "mecanico";

  const [miembro] = await db
    .select({ rol: miembroTaller.rol })
    .from(miembroTaller)
    .where(eq(miembroTaller.userId, sesion.user.id))
    .limit(1);

  if (!miembro) return "dueno";
  return miembro.rol === "jefe_taller" ? "jefe_taller" : "mecanico";
}

/**
 * Si la sesión actual tiene un rol personalizado asignado (Plan
 * Empresarial), y de ser así, su matriz de permisos por módulo. Null
 * si no aplica (dueño, jefe_taller/mecanico clásicos, o el rol
 * personalizado fue borrado y quedó sin efecto).
 */
async function permisosPersonalizadosActuales(): Promise<Record<
  string,
  boolean
> | null> {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) return null;

  const [fila] = await db
    .select({ permisos: rolPersonalizado.permisos })
    .from(miembroTaller)
    .innerJoin(
      rolPersonalizado,
      eq(miembroTaller.rolPersonalizadoId, rolPersonalizado.id)
    )
    .where(eq(miembroTaller.userId, sesion.user.id))
    .limit(1);

  return (fila?.permisos as Record<string, boolean> | undefined) ?? null;
}

/**
 * Si la sesión actual puede ver un módulo dado — punto único para
 * chequear un rol personalizado. Dueño y jefe_taller clásico siempre
 * pueden (sin egresar a la matriz); un mecánico clásico sigue las
 * reglas fijas de siempre (se resuelven en los `puedeVer*` de abajo,
 * que llaman a esta función solo cuando hay rol personalizado). Un
 * módulo ausente del jsonb de permisos se trata como no habilitado.
 */
export async function puedeVerModulo(modulo: ModuloPersonalizable) {
  const permisos = await permisosPersonalizadosActuales();
  if (!permisos) return null; // No aplica rol personalizado — seguir con la regla clásica.
  return permisos[modulo] === true;
}

/**
 * Si el usuario de la sesión actual puede ver Pagos y los precios de
 * costo/venta del inventario. Dueño y jefe_taller siempre pueden; un
 * mecánico con rol personalizado sigue su matriz; el resto depende de
 * vePagos — override manual pedido real (Carserv): el dueño decide,
 * persona por persona, sin tener que ascenderla de rol solo para
 * darle acceso a Pagos.
 */
export async function puedeVerPagos() {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) return false;

  const [miembro] = await db
    .select({
      rol: miembroTaller.rol,
      vePagos: miembroTaller.vePagos,
      rolPersonalizadoId: miembroTaller.rolPersonalizadoId,
    })
    .from(miembroTaller)
    .where(eq(miembroTaller.userId, sesion.user.id))
    .limit(1);

  // Sin fila en miembroTaller: es el dueño, ve todo.
  if (!miembro) return true;
  if (miembro.rolPersonalizadoId) {
    const veModulo = await puedeVerModulo("/panel/pagos");
    return veModulo ?? false;
  }
  if (miembro.rol === "jefe_taller") return true;
  return miembro.vePagos;
}

/**
 * Equipo (invitar/quitar gente, cambiar roles) — dueño y jefe_taller
 * siempre; un rol personalizado depende de su matriz. Un jefe_taller
 * que entra a Equipo solo puede gestionar mecánicos, nunca a otro
 * jefe_taller ni al dueño (se valida en las acciones de
 * equipo/acciones.ts, no acá).
 */
export async function puedeVerEquipo() {
  const veModulo = await puedeVerModulo("/panel/equipo");
  if (veModulo !== null) return veModulo;
  const rol = await rolActual();
  return rol === "dueno" || rol === "jefe_taller";
}

/** Inventario y Servicios: dueño y jefe_taller ven costos/catálogo; un rol personalizado sigue su matriz. */
export async function puedeVerInventario() {
  const veModulo = await puedeVerModulo("/panel/inventario");
  if (veModulo !== null) return veModulo;
  const rol = await rolActual();
  return rol === "dueno" || rol === "jefe_taller";
}

/**
 * Para el sidebar: si la sesión actual tiene un rol personalizado
 * (Plan Empresarial), su matriz completa de módulos — undefined si no
 * aplica (dueño, jefe_taller/mecanico clásicos, o sin rol asignado),
 * que es la señal para que navegacion.tsx no cambie nada del
 * comportamiento clásico. Se trae una sola vez (no módulo por módulo)
 * para no multiplicar queries en cada carga del panel.
 */
export async function modulosDeRolPersonalizado(): Promise<
  Record<string, boolean> | undefined
> {
  const permisos = await permisosPersonalizadosActuales();
  if (!permisos) return undefined;

  const resultado: Record<string, boolean> = {};
  for (const modulo of MODULOS_PERSONALIZABLES) {
    resultado[modulo] = permisos[modulo] === true;
  }
  return resultado;
}
