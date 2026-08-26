/**
 * Accesorios que se revisan al recibir el auto — Plan Serviteca. Un
 * elemento presente en trabajo.accesorios significa "sí lo trae"; su
 * ausencia significa "no lo trae", sin necesitar un tercer estado.
 *
 * Dinámicos según vehiculo.tipo: no todos los vehículos traen lo
 * mismo — una moto no tiene vidrios ni triángulos, un camión no tiene
 * encendedor de cigarro de serie. `tipos: null` significa "aplica a
 * cualquier tipo" (ej. botiquín, extintor).
 */
const MOTO = ["Moto"];
const SIN_CABINA_CERRADA = ["Moto"];

export const ACCESORIOS_AUTO = [
  { id: "rueda_repuesto", etiqueta: "Rueda de repuesto", tipos: null },
  { id: "gata", etiqueta: "Gata", tipos: null },
  { id: "triangulos", etiqueta: "Triángulos", tipos: excluir(SIN_CABINA_CERRADA) },
  { id: "herramientas", etiqueta: "Herramientas", tipos: null },
  { id: "extintor", etiqueta: "Extintor", tipos: null },
  { id: "botiquin", etiqueta: "Botiquín", tipos: null },
  { id: "vidrios", etiqueta: "Vidrios sin daño", tipos: excluir(MOTO) },
  { id: "espejos", etiqueta: "Espejos", tipos: null },
  { id: "focos", etiqueta: "Focos y luces", tipos: null },
  { id: "plumillas", etiqueta: "Plumillas", tipos: excluir(MOTO) },
  { id: "encendedor", etiqueta: "Encendedor", tipos: excluir(SIN_CABINA_CERRADA) },
  { id: "pisos", etiqueta: "Pisos / alfombras", tipos: excluir(SIN_CABINA_CERRADA) },
] as const;

/** Marca "aplica a todos menos estos tipos" sin tener que listar el resto. */
function excluir(tipos: string[]) {
  return { excepto: tipos };
}

/** Los accesorios que corresponde revisar para un tipo de vehículo dado. */
export function accesoriosParaTipo(tipo: string | null | undefined) {
  return ACCESORIOS_AUTO.filter((a) => {
    if (a.tipos === null) return true;
    return !tipo || !a.tipos.excepto.includes(tipo);
  });
}

export const NIVELES_COMBUSTIBLE = [
  { id: "vacio", etiqueta: "Vacío" },
  { id: "1/4", etiqueta: "1/4" },
  { id: "1/2", etiqueta: "1/2" },
  { id: "3/4", etiqueta: "3/4" },
  { id: "lleno", etiqueta: "Lleno" },
] as const;
