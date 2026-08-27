/**
 * Zonas del auto y tipos de daño, compartidas entre el diagrama
 * interactivo (al abrir la orden) y la vista estática de la orden
 * impresa — Plan Serviteca. Dos vistas, como en la orden de recepción
 * en papel: superior (planta) y lateral (perfil), para poder marcar
 * daños en el costado que la vista de arriba no cubre bien.
 */
/**
 * Coordenadas ajustadas al viewBox real de public/diagrama/auto-superior.svg
 * (0 0 358.85 789.36) — ilustración de OpenClipart ("top view car" por
 * jonadem, dominio público), no un dibujo propio.
 */
export const ZONAS_SUPERIOR = [
  { id: "capot", etiqueta: "Capó", etiquetaCorta: "Capó", x: 60, y: 30, w: 240, h: 250 },
  { id: "techo", etiqueta: "Techo", etiquetaCorta: "Techo", x: 60, y: 388, w: 240, h: 140 },
  { id: "maletero", etiqueta: "Maletero", etiquetaCorta: "Maletero", x: 60, y: 528, w: 240, h: 250 },
  { id: "puerta_del_izq", etiqueta: "Puerta del. izq.", etiquetaCorta: "Del. izq.", x: 4, y: 388, w: 62, h: 70 },
  { id: "puerta_tras_izq", etiqueta: "Puerta tras. izq.", etiquetaCorta: "Tras. izq.", x: 4, y: 458, w: 62, h: 70 },
  { id: "puerta_del_der", etiqueta: "Puerta del. der.", etiquetaCorta: "Del. der.", x: 293, y: 388, w: 62, h: 70 },
  { id: "puerta_tras_der", etiqueta: "Puerta tras. der.", etiquetaCorta: "Tras. der.", x: 293, y: 458, w: 62, h: 70 },
] as const;

/**
 * Vista lateral (perfil), lado izquierdo del auto — el papel de
 * recepción suele marcar un solo costado y se asume simétrico salvo
 * que se aclare en observaciones. Coordenadas ajustadas al viewBox
 * real de public/diagrama/auto-lateral.svg (0 0 841.9 269.3) —
 * ilustración de OpenClipart ("Skoda Superb sedan side view" por
 * molumen, dominio público).
 */
export const ZONAS_LATERAL = [
  { id: "paragolpe_del", etiqueta: "Paragolpe delantero", etiquetaCorta: "Parag. del.", x: 0, y: 90, w: 85, h: 155 },
  { id: "capot_lateral", etiqueta: "Capó (lateral)", etiquetaCorta: "Capó", x: 85, y: 70, w: 195, h: 130 },
  { id: "puerta_del_lateral", etiqueta: "Puerta delantera", etiquetaCorta: "Puerta del.", x: 280, y: 45, w: 165, h: 175 },
  { id: "puerta_tras_lateral", etiqueta: "Puerta trasera", etiquetaCorta: "Puerta tras.", x: 445, y: 45, w: 155, h: 175 },
  { id: "maletero_lateral", etiqueta: "Maletero (lateral)", etiquetaCorta: "Maletero", x: 600, y: 70, w: 180, h: 130 },
  { id: "paragolpe_tras", etiqueta: "Paragolpe trasero", etiquetaCorta: "Parag. tras.", x: 780, y: 90, w: 62, h: 155 },
  { id: "techo_lateral", etiqueta: "Techo (lateral)", etiquetaCorta: "Techo", x: 280, y: 10, w: 320, h: 40 },
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
