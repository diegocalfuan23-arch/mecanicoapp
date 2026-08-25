/**
 * Accesorios que se revisan al recibir el auto — Plan Serviteca. Un
 * elemento presente en trabajo.accesorios significa "sí lo trae"; su
 * ausencia significa "no lo trae", sin necesitar un tercer estado.
 */
export const ACCESORIOS_AUTO = [
  { id: "rueda_repuesto", etiqueta: "Rueda de repuesto" },
  { id: "gata", etiqueta: "Gata" },
  { id: "triangulos", etiqueta: "Triángulos" },
  { id: "herramientas", etiqueta: "Herramientas" },
  { id: "extintor", etiqueta: "Extintor" },
  { id: "botiquin", etiqueta: "Botiquín" },
  { id: "vidrios", etiqueta: "Vidrios sin daño" },
  { id: "espejos", etiqueta: "Espejos" },
  { id: "focos", etiqueta: "Focos y luces" },
  { id: "plumillas", etiqueta: "Plumillas" },
] as const;

export const NIVELES_COMBUSTIBLE = [
  { id: "vacio", etiqueta: "Vacío" },
  { id: "1/4", etiqueta: "1/4" },
  { id: "1/2", etiqueta: "1/2" },
  { id: "3/4", etiqueta: "3/4" },
  { id: "lleno", etiqueta: "Lleno" },
] as const;
