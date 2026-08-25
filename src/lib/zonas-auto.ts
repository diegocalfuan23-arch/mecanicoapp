/**
 * Zonas del auto (vista superior) y tipos de daño, compartidas entre el
 * diagrama interactivo (al abrir la orden) y la vista estática de la
 * orden impresa — Plan Serviteca.
 */
export const ZONAS_AUTO = [
  { id: "capot", etiqueta: "Capó", x: 30, y: 8, w: 60, h: 40 },
  { id: "techo", etiqueta: "Techo", x: 30, y: 62, w: 60, h: 76 },
  { id: "maletero", etiqueta: "Maletero", x: 30, y: 152, w: 60, h: 40 },
  { id: "puerta_del_izq", etiqueta: "Puerta del. izq.", x: 8, y: 62, w: 22, h: 38 },
  { id: "puerta_tras_izq", etiqueta: "Puerta tras. izq.", x: 8, y: 100, w: 22, h: 38 },
  { id: "puerta_del_der", etiqueta: "Puerta del. der.", x: 90, y: 62, w: 22, h: 38 },
  { id: "puerta_tras_der", etiqueta: "Puerta tras. der.", x: 90, y: 100, w: 22, h: 38 },
] as const;

export const TIPOS_DANO = [
  { id: "abolladura", letra: "X", etiqueta: "Abolladura" },
  { id: "rayadura", letra: "O", etiqueta: "Rayadura" },
  { id: "quebrado", letra: "D", etiqueta: "Quebrado" },
] as const;

export type MarcaDano = { zona: string; tipo: string };

export function marcasDesdeDanos(danos: string[]): MarcaDano[] {
  return danos
    .map((d) => {
      const [zona, tipo] = d.split(":");
      return zona && tipo ? { zona, tipo } : null;
    })
    .filter((m): m is MarcaDano => m !== null);
}

export function danosDesdeMarcas(marcas: MarcaDano[]): string[] {
  return marcas.map((m) => `${m.zona}:${m.tipo}`);
}
