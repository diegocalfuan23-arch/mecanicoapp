/**
 * Catálogo fijo de servicios tipo checklist, al estilo de la orden de
 * trabajo de Automotora del Sur — Plan Serviteca (pedido por Senna).
 * Cada servicio tiene su código, igual que en el papel: se marca al
 * cerrar la orden y queda impreso como checklist, aparte del texto
 * libre de "Qué se hizo".
 */
export const GRUPOS_SERVICIOS = [
  {
    grupo: "Mecánica",
    items: [
      { id: "cambio_aceite_motor", codigo: "1", etiqueta: "Cambio de aceite motor" },
      { id: "cambio_aceite_caja_manual", codigo: "2", etiqueta: "Cambio de aceite caja/cambio" },
      { id: "cambio_aceite_caja_auto", codigo: "3", etiqueta: "Cambio aceite caja automática" },
      { id: "cambio_aceite_diferencial", codigo: "4", etiqueta: "Cambio aceite diferencial" },
      { id: "cambio_filtro_aceite", codigo: "5", etiqueta: "Cambio filtro de aceite" },
      { id: "engrase", codigo: "6", etiqueta: "Engrase" },
      { id: "revision_niveles", codigo: "7", etiqueta: "Revisión de niveles" },
      { id: "afinamiento_mayor", codigo: "8", etiqueta: "Afinamiento mayor" },
      { id: "diagnostico_picompra", codigo: "9", etiqueta: "Diagnóstico pre-compra" },
    ],
  },
  {
    grupo: "Lavado y carrocería",
    items: [
      { id: "lavado_ext_motor", codigo: "10", etiqueta: "Lavado ext. y motor" },
      { id: "lavado_chassis", codigo: "11", etiqueta: "Lavado chassis" },
      { id: "lavado_tapiceria", codigo: "12", etiqueta: "Lavado tapicería" },
      { id: "sellado_carroceria", codigo: "13", etiqueta: "Sellado carrocería" },
      { id: "ajuste_embrague", codigo: "14", etiqueta: "Ajuste embrague" },
    ],
  },
  {
    grupo: "Revisión y frenos",
    items: [
      { id: "limpieza_ajuste_frenos", codigo: "15", etiqueta: "Limpieza/ajuste frenos" },
      { id: "enfocar_luces", codigo: "16", etiqueta: "Enfocar luces" },
      { id: "alinear_tren_delantero", codigo: "17", etiqueta: "Alinear tren delantero" },
      { id: "ajustar_direccion", codigo: "18", etiqueta: "Ajustar dirección" },
      { id: "balanceo", codigo: "19", etiqueta: "Balanceo (1-2-3-4-5)" },
      { id: "rotacion_ruedas", codigo: "20", etiqueta: "Rotación de ruedas" },
      { id: "engrase_rod_delant", codigo: "21", etiqueta: "Engrase rod. delanteros" },
    ],
  },
] as const;

export type ServicioCatalogo = {
  id: string;
  codigo: string;
  etiqueta: string;
};

export const SERVICIOS_CATALOGO: ServicioCatalogo[] = GRUPOS_SERVICIOS.flatMap(
  (g): ServicioCatalogo[] => [...g.items]
);
