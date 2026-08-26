/**
 * Zonas del auto y tipos de daño, compartidas entre el diagrama
 * interactivo (al abrir la orden) y la vista estática de la orden
 * impresa — Plan Serviteca. Dos vistas, como en la orden de recepción
 * en papel: superior (planta) y lateral (perfil), para poder marcar
 * daños en el costado que la vista de arriba no cubre bien.
 */
export const ZONAS_SUPERIOR = [
  { id: "capot", etiqueta: "Capó", etiquetaCorta: "Capó", x: 32, y: 6, w: 56, h: 38 },
  { id: "techo", etiqueta: "Techo", etiquetaCorta: "Techo", x: 32, y: 72, w: 56, h: 56 },
  { id: "maletero", etiqueta: "Maletero", etiquetaCorta: "Maletero", x: 32, y: 156, w: 56, h: 38 },
  { id: "puerta_del_izq", etiqueta: "Puerta del. izq.", etiquetaCorta: "Del. izq.", x: 10, y: 70, w: 20, h: 28 },
  { id: "puerta_tras_izq", etiqueta: "Puerta tras. izq.", etiquetaCorta: "Tras. izq.", x: 10, y: 100, w: 20, h: 28 },
  { id: "puerta_del_der", etiqueta: "Puerta del. der.", etiquetaCorta: "Del. der.", x: 90, y: 70, w: 20, h: 28 },
  { id: "puerta_tras_der", etiqueta: "Puerta tras. der.", etiquetaCorta: "Tras. der.", x: 90, y: 100, w: 20, h: 28 },
] as const;

/**
 * Vista lateral (perfil), lado izquierdo del auto — el papel de
 * recepción suele marcar un solo costado y se asume simétrico salvo
 * que se aclare en observaciones.
 */
export const ZONAS_LATERAL = [
  { id: "paragolpe_del", etiqueta: "Paragolpe delantero", etiquetaCorta: "Parag. del.", x: 6, y: 53, w: 20, h: 15 },
  { id: "capot_lateral", etiqueta: "Capó (lateral)", etiquetaCorta: "Capó", x: 26, y: 34, w: 36, h: 19 },
  { id: "puerta_del_lateral", etiqueta: "Puerta delantera", etiquetaCorta: "Puerta del.", x: 62, y: 31, w: 40, h: 37 },
  { id: "puerta_tras_lateral", etiqueta: "Puerta trasera", etiquetaCorta: "Puerta tras.", x: 122, y: 31, w: 36, h: 37 },
  { id: "maletero_lateral", etiqueta: "Maletero (lateral)", etiquetaCorta: "Maletero", x: 158, y: 24, w: 18, h: 26 },
  { id: "paragolpe_tras", etiqueta: "Paragolpe trasero", etiquetaCorta: "Parag. tras.", x: 176, y: 50, w: 15, h: 18 },
  { id: "techo_lateral", etiqueta: "Techo (lateral)", etiquetaCorta: "Techo", x: 70, y: 9, w: 58, h: 12 },
] as const;

export const ZONAS_AUTO = ZONAS_SUPERIOR;

export const TIPOS_DANO = [
  { id: "abolladura", letra: "X", etiqueta: "Abolladura" },
  { id: "rayadura", letra: "O", etiqueta: "Rayadura" },
  { id: "quebrado", letra: "D", etiqueta: "Quebrado" },
] as const;

export type MarcaDano = { zona: string; tipo: string; detalle?: string };

/**
 * Cada marca se guarda como "zona:tipo:detalle" en trabajo.danos. El
 * detalle va codificado (encodeURIComponent) porque es texto libre del
 * mecánico y puede traer ":" — sin codificar, un detalle como "18:00"
 * partiría el string en el lugar equivocado.
 */
export function marcasDesdeDanos(danos: string[]): MarcaDano[] {
  return danos
    .map((d): MarcaDano | null => {
      const [zona, tipo, detalle] = d.split(":");
      if (!zona || !tipo) return null;
      const marca: MarcaDano = { zona, tipo };
      if (detalle) marca.detalle = decodeURIComponent(detalle);
      return marca;
    })
    .filter((m): m is MarcaDano => m !== null);
}

export function danosDesdeMarcas(marcas: MarcaDano[]): string[] {
  return marcas.map((m) =>
    m.detalle
      ? `${m.zona}:${m.tipo}:${encodeURIComponent(m.detalle)}`
      : `${m.zona}:${m.tipo}`
  );
}
