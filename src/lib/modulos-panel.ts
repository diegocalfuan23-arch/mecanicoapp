/**
 * Módulos del sidebar que un rol personalizado puede habilitar o no —
 * misma clave que el `href` de cada ítem en navegacion.tsx. Vive
 * aparte de lib/taller.ts (que depende de next/headers, solo válido
 * en Server Components) porque también lo importan Client Components
 * como equipo/tabla.tsx para armar el formulario de permisos.
 */
export const MODULOS_PERSONALIZABLES = [
  "/panel/agenda",
  "/panel/historial",
  "/panel/diagnosticos",
  "/panel/inspecciones",
  "/panel/presupuestos",
  "/panel/ordenes",
  "/panel/ventas",
  "/panel/vehiculos",
  "/panel/propietarios",
  "/panel/inventario",
  "/panel/servicios",
  "/panel/compras",
  "/panel/equipo",
  "/panel/pagos",
  "/panel/caja",
] as const;
export type ModuloPersonalizable = (typeof MODULOS_PERSONALIZABLES)[number];

export const ETIQUETA_MODULO: Record<ModuloPersonalizable, string> = {
  "/panel/agenda": "Agenda",
  "/panel/historial": "Buscar patente",
  "/panel/diagnosticos": "Diagnósticos",
  "/panel/inspecciones": "Inspecciones",
  "/panel/presupuestos": "Presupuestos",
  "/panel/ordenes": "Órdenes",
  "/panel/ventas": "Ventas POS",
  "/panel/vehiculos": "Vehículos",
  "/panel/propietarios": "Propietarios",
  "/panel/inventario": "Inventario",
  "/panel/servicios": "Servicios",
  "/panel/compras": "Compras",
  "/panel/equipo": "Equipo",
  "/panel/pagos": "Pagos",
  "/panel/caja": "Caja",
};

/**
 * Qué módulos puede ofrecer la matriz de un rol personalizado en cada
 * plan — no tiene sentido dejar marcar "Inventario" en Plan Taller,
 * ese módulo ni siquiera existe ahí (ver el filtro por plan en
 * navegacion.tsx). Prueba/Taller usan la lista corta que Diego pidió
 * (Órdenes, Vehículos, Propietarios, Buscar patente, Pagos — los
 * únicos módulos reales de esos dos planes); Serviteca y Empresarial
 * ofrecen todo.
 */
export const MODULOS_POR_PLAN: Record<
  "prueba" | "taller" | "serviteca" | "empresarial",
  readonly ModuloPersonalizable[]
> = {
  prueba: [
    "/panel/ordenes",
    "/panel/vehiculos",
    "/panel/propietarios",
    "/panel/historial",
    "/panel/pagos",
  ],
  taller: [
    "/panel/ordenes",
    "/panel/vehiculos",
    "/panel/propietarios",
    "/panel/historial",
    "/panel/pagos",
  ],
  serviteca: MODULOS_PERSONALIZABLES,
  empresarial: MODULOS_PERSONALIZABLES,
};
