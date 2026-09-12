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
