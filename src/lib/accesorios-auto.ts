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

/**
 * Un accesorio que trae el auto pero no está en el catálogo fijo (ej.
 * "Cadenas de nieve") se guarda como texto libre con este prefijo, en
 * la misma columna trabajo.accesorios — sin tabla ni columna aparte.
 */
const PREFIJO_OTRO = "otro:";

export function esAccesorioLibre(valor: string) {
  return valor.startsWith(PREFIJO_OTRO);
}

export function codificarAccesorioLibre(texto: string) {
  return `${PREFIJO_OTRO}${texto.trim()}`;
}

export function textoAccesorioLibre(valor: string) {
  return valor.slice(PREFIJO_OTRO.length);
}

/** Etiqueta a mostrar para cualquier valor guardado en accesorios[]. */
export function etiquetaAccesorio(valor: string) {
  if (esAccesorioLibre(valor)) return textoAccesorioLibre(valor);
  return ACCESORIOS_AUTO.find((a) => a.id === valor)?.etiqueta ?? valor;
}

// Valores fijos de antes del slider — solo quedan para leer órdenes
// viejas que ya guardaron uno de estos, no se vuelven a escribir.
const NIVELES_COMBUSTIBLE_VIEJOS: Record<string, number> = {
  vacio: 0,
  "1/4": 25,
  "1/2": 50,
  "3/4": 75,
  lleno: 100,
};

/**
 * Convierte lo guardado en `combustible` a un porcentaje 0-100, sea
 * el string numérico que escribe el slider actual ("65") o uno de los
 * niveles fijos de antes ("1/2"). null si no hay dato o no se puede
 * interpretar.
 */
export function combustiblePorcentaje(valor: string | null): number | null {
  if (!valor) return null;
  if (valor in NIVELES_COMBUSTIBLE_VIEJOS) {
    return NIVELES_COMBUSTIBLE_VIEJOS[valor];
  }
  const n = Number(valor);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : null;
}
