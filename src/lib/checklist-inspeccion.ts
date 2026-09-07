/**
 * Ítems fijos del checklist de Inspección pre-compra — a diferencia
 * del checklist libre de Diagnósticos, acá la lista es la misma para
 * todos los talleres (mismo criterio que la referencia de Bujía), así
 * que vive en código, no en la base de datos. `clave` es estable: no
 * cambiarla una vez guardada una inspección real, o las respuestas
 * viejas quedan huérfanas.
 */

export type OpcionEquipamiento = "Sí" | "No" | "N/A";
export type OpcionDetalle = "Buena" | "Regular" | "Mala" | "N/A";

export const OPCIONES_EQUIPAMIENTO: OpcionEquipamiento[] = ["Sí", "No", "N/A"];
export const OPCIONES_DETALLE: OpcionDetalle[] = [
  "Buena",
  "Regular",
  "Mala",
  "N/A",
];

/** El ícono de alerta se enciende con estas respuestas. */
export function requiereAlerta(valor: string) {
  return valor === "No" || valor === "Regular" || valor === "Mala";
}

export const COMBUSTIBLES = ["Bencina", "Diésel", "Híbrido", "Eléctrico", "GLP/GNC"];
export const TRANSMISIONES = ["Manual", "Automática", "CVT", "Semiautomática"];
export const TRACCIONES = ["4x2", "4x4", "AWD"];
export const VIGENCIAS_DOCUMENTO = ["Al día", "Vencido", "No presenta"];

export type ItemChecklist = { clave: string; etiqueta: string };
export type SeccionChecklist = {
  titulo: string;
  tipo: "equipamiento" | "detalle";
  items: ItemChecklist[];
};

export const EQUIPAMIENTO: ItemChecklist[] = [
  { clave: "aire_acondicionado", etiqueta: "Aire Acondicionado" },
  { clave: "climatizador", etiqueta: "Climatizador" },
  { clave: "vidrios_electricos", etiqueta: "Vidrios Eléctricos" },
  { clave: "espejos_electricos", etiqueta: "Espejos Eléctricos" },
  { clave: "cierre_centralizado", etiqueta: "Cierre Centralizado" },
  { clave: "tapiz_cuero", etiqueta: "Tapiz Cuero" },
  { clave: "radio_multimedia", etiqueta: "Radio Multimedia" },
  { clave: "bluetooth", etiqueta: "Bluetooth" },
  { clave: "control_crucero", etiqueta: "Control Crucero" },
  { clave: "volante_ajustable", etiqueta: "Volante Ajustable" },
  { clave: "isofix", etiqueta: "Isofix" },
  { clave: "frenos_abs", etiqueta: "Frenos ABS" },
  { clave: "airbag", etiqueta: "Airbag" },
  { clave: "control_estabilidad", etiqueta: "Control de Estabilidad" },
  { clave: "control_traccion", etiqueta: "Control de Tracción" },
  { clave: "sensor_estacionamiento", etiqueta: "Sensor de Estacionamiento" },
  { clave: "camara_retroceso_equip", etiqueta: "Camara de retroceso" },
  { clave: "duplicado_llave", etiqueta: "Duplicado de llave" },
  { clave: "antena", etiqueta: "Antena" },
  { clave: "llave_seguridad_rueda", etiqueta: "Llave de Seguridad Rueda" },
  { clave: "herramientas", etiqueta: "Herramientas" },
  { clave: "rueda_repuesto", etiqueta: "Rueda de Repuesto" },
  { clave: "kit_emergencia", etiqueta: "Kit de Emergencia" },
  { clave: "manual_usuario", etiqueta: "Manual de Usuario" },
  { clave: "extintor", etiqueta: "Extintor" },
];

export const SECCIONES_DETALLE: SeccionChecklist[] = [
  {
    titulo: "Tren motriz",
    tipo: "detalle",
    items: [
      { clave: "neumaticos", etiqueta: "Neumáticos" },
      { clave: "llantas", etiqueta: "Llantas" },
      { clave: "amortiguadores", etiqueta: "Amortiguadores" },
      { clave: "frenos_delanteros", etiqueta: "Frenos Delanteros" },
      { clave: "frenos_traseros", etiqueta: "Frenos Traseros" },
      { clave: "liquido_frenos", etiqueta: "Liquido de Frenos" },
      { clave: "fugas_liquido_frenos", etiqueta: "Fugas de Liquido de Frenos" },
      { clave: "caja_direccion", etiqueta: "Caja de Dirección" },
      { clave: "bandejas_homocineticas", etiqueta: "Bandejas/Homocinéticas" },
    ],
  },
  {
    titulo: "Motor",
    tipo: "detalle",
    items: [
      { clave: "ruidos_motor", etiqueta: "Ruidos del Motor" },
      { clave: "ruidos_caja_cambios", etiqueta: "Ruidos de la Caja de Cambios" },
      { clave: "fugas_aceite", etiqueta: "Fugas de Aceite" },
      { clave: "correa_auxiliar", etiqueta: "Correa Auxiliar" },
      { clave: "aceite_motor", etiqueta: "Aceite del Motor" },
      { clave: "liquido_refrigerante", etiqueta: "Liquido Refrigerante" },
      { clave: "humo_escape", etiqueta: "Humo en el Escape" },
      { clave: "soporte_motor", etiqueta: "Soporte del Motor" },
    ],
  },
  {
    titulo: "Exterior",
    tipo: "detalle",
    items: [
      { clave: "puerta_del_izq", etiqueta: "Puerta Delantera Izquierda" },
      { clave: "puerta_tra_izq", etiqueta: "Puerta Trasera Izquierda" },
      { clave: "lateral_izq", etiqueta: "Lateral Izquierdo" },
      { clave: "espejo_izq", etiqueta: "Espejo Izquierdo" },
      { clave: "puerta_del_der", etiqueta: "Puerta Delantera Derecha" },
      { clave: "puerta_tra_der", etiqueta: "Puerta Trasera Derecha" },
      { clave: "lateral_der", etiqueta: "Lateral Derecho" },
      { clave: "espejo_der", etiqueta: "Espejo Derecho" },
      { clave: "parachoques_trasero", etiqueta: "Parachoques Trasero" },
      { clave: "lateral_trasero", etiqueta: "Lateral Trasero" },
      { clave: "luces_traseras", etiqueta: "Luces Traseras" },
      { clave: "parachoques_delantero", etiqueta: "Parachoques Delantero" },
      { clave: "frontal_capot", etiqueta: "Frontal/Capot" },
      { clave: "luces_delanteras", etiqueta: "Luces Delanteras" },
      { clave: "techo_sunroof_barras", etiqueta: "Techo/Sunroof/Barras" },
      { clave: "antena_ext", etiqueta: "Antena" },
      { clave: "vidrios_ext", etiqueta: "Vidrios" },
      { clave: "luces_complementarias", etiqueta: "Luces Complementarias" },
      { clave: "emblemas_molduras", etiqueta: "Emblemas y Molduras" },
      { clave: "pintura", etiqueta: "Pintura" },
    ],
  },
  {
    titulo: "Interior",
    tipo: "detalle",
    items: [
      { clave: "estado_llave", etiqueta: "Estado de la Llave" },
      { clave: "encendido_motor", etiqueta: "Encendido del Motor" },
      { clave: "testigos_tablero", etiqueta: "Testigos del Tablero" },
      { clave: "comportamiento_ralenti", etiqueta: "Comportamiento en Ralenti" },
      { clave: "pedal_freno", etiqueta: "Pedal de Freno" },
      { clave: "pedal_aceleracion", etiqueta: "Pedal de Aceleración" },
      { clave: "pedal_embrague", etiqueta: "Pedal de Embrague" },
      { clave: "cierre_centralizado_int", etiqueta: "Cierre Centralizado" },
      { clave: "alzavidrios", etiqueta: "Alzavidrios" },
      { clave: "espejos_int", etiqueta: "Espejos" },
      { clave: "grabado_vidrios", etiqueta: "Grabado de Vidrio" },
      { clave: "luces_interior", etiqueta: "Luces Interior" },
      { clave: "comandos_volante", etiqueta: "Comandos del Volante" },
      { clave: "luces_senalizadores", etiqueta: "Luces/Señalizadores" },
      { clave: "limpiaparabrisas", etiqueta: "Limpiaparabrisas" },
      { clave: "multimedia_radio", etiqueta: "Multimedia y Radio" },
      { clave: "sonido", etiqueta: "Sonido" },
      { clave: "sensores", etiqueta: "Sensores" },
      { clave: "camara_retroceso_int", etiqueta: "Cámara Retroceso" },
      { clave: "tapiceria_asientos", etiqueta: "Tapiceria de Asientos" },
      { clave: "tapiceria_habitaculo", etiqueta: "Tapiceria de Habitáculo" },
      { clave: "ajustes_asiento", etiqueta: "Ajustes de Asiento" },
      { clave: "cinturones_seguridad", etiqueta: "Cinturones de Seguridad" },
      { clave: "estado_guantera", etiqueta: "Estado de la Guantera" },
      { clave: "estado_maletero", etiqueta: "Estado del Maletero" },
      { clave: "neumatico_repuesto", etiqueta: "Neumático de Repuesto" },
      { clave: "herramientas_vehiculo", etiqueta: "Herramientas del Vehículo" },
      { clave: "elementos_seguridad", etiqueta: "Elementos de Seguridad" },
    ],
  },
  {
    titulo: "Otros",
    tipo: "detalle",
    items: [
      { clave: "resultado_scanner", etiqueta: "Resultado Scanner" },
      { clave: "funcion_alarma_cierre", etiqueta: "Función de Alarma y Cierre Centralizado" },
      { clave: "estado_bateria_apagado", etiqueta: "Estado de la Batería (Apagado)" },
      { clave: "estado_bateria_encendido", etiqueta: "Estado de la Batería (Encendido)" },
      { clave: "alternador", etiqueta: "Alternador" },
      { clave: "kilometraje_verificado", etiqueta: "Kilometraje Verificado" },
    ],
  },
  {
    titulo: "Prueba en ruta",
    tipo: "detalle",
    items: [
      { clave: "alineacion", etiqueta: "Alineación" },
      { clave: "comportamiento_caja_cambios", etiqueta: "Comportamiento y Ruidos de la Caja de Cambios" },
      { clave: "embrague", etiqueta: "Embrague" },
      { clave: "comportamiento_direccion", etiqueta: "Comportamiento y Ruidos en la Dirección" },
      { clave: "frenos_ruta", etiqueta: "Frenos" },
      { clave: "temperatura_motor", etiqueta: "Temperatura del Motor" },
      { clave: "comportamiento_ruidos_motor", etiqueta: "Comportamiento y Ruidos del Motor" },
      { clave: "testigos_tablero_ruta", etiqueta: "Testigos en el Tablero" },
      { clave: "velocidad_crucero", etiqueta: "Velocidad Crucero" },
      { clave: "comportamiento_suspension", etiqueta: "Comportamiento de la Suspensión" },
      { clave: "funcionamiento_4x4", etiqueta: "Funcionamiento 4×4" },
      { clave: "funcionamiento_turbo", etiqueta: "Funcionamiento del Turbo" },
      { clave: "ruidos_habitaculo", etiqueta: "Ruidos Dentro del Habitáculo" },
    ],
  },
];
