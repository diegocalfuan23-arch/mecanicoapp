"use server";

import { revalidatePath } from "next/cache";
import { eq, and, ne, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { diagnostico, pasoDiagnostico, trabajo, vehiculo } from "@/db/schema";
import { tallerActual, tienePlan } from "@/lib/taller";

function id() {
  return crypto.randomUUID();
}

export type PasoCotizado = {
  texto: string;
  hecho: boolean;
};

/** Diagnósticos pendientes primero, luego el resto, más nuevos primero. */
export async function listarDiagnosticos() {
  const tallerId = await tallerActual();

  return db
    .select({
      id: diagnostico.id,
      numero: diagnostico.numero,
      patente: diagnostico.patente,
      clienteNombre: diagnostico.clienteNombre,
      tecnicoNombre: diagnostico.tecnicoNombre,
      estado: diagnostico.estado,
      fecha: diagnostico.fecha,
    })
    .from(diagnostico)
    .where(eq(diagnostico.tallerId, tallerId))
    .orderBy(
      sql`case when ${diagnostico.estado} = 'pendiente' then 0 else 1 end`,
      desc(diagnostico.fecha)
    );
}

export async function obtenerDiagnostico(diagnosticoId: string) {
  const tallerId = await tallerActual();

  const [datos] = await db
    .select()
    .from(diagnostico)
    .where(and(eq(diagnostico.id, diagnosticoId), eq(diagnostico.tallerId, tallerId)))
    .limit(1);

  if (!datos) return null;

  const pasos = await db
    .select({
      id: pasoDiagnostico.id,
      texto: pasoDiagnostico.texto,
      hecho: pasoDiagnostico.hecho,
    })
    .from(pasoDiagnostico)
    .where(eq(pasoDiagnostico.diagnosticoId, diagnosticoId))
    .orderBy(pasoDiagnostico.orden);

  return { ...datos, pasos };
}

export async function crearDiagnostico(datos: {
  patente: string;
  clienteNombre?: string;
  clienteTelefono?: string;
  tecnicoId?: string;
  tecnicoNombre?: string;
  falla?: string;
  procedimiento?: string;
  fotos?: string[];
  videos?: string[];
  documentos?: string[];
  pasos?: PasoCotizado[];
}) {
  if (!(await tienePlan("impresionOrden"))) {
    return { error: "Esta función es del Plan Serviteca." };
  }

  const tallerId = await tallerActual();
  const patente = datos.patente.trim().toUpperCase();
  if (!patente) return { error: "Escribe la patente." };

  const [{ ultimo }] = await db
    .select({
      ultimo: sql<number>`coalesce(max(${diagnostico.numero}), 0)`.mapWith(Number),
    })
    .from(diagnostico)
    .where(eq(diagnostico.tallerId, tallerId));

  const diagnosticoId = id();

  await db.insert(diagnostico).values({
    id: diagnosticoId,
    tallerId,
    numero: ultimo + 1,
    patente,
    clienteNombre: datos.clienteNombre?.trim() || null,
    clienteTelefono: datos.clienteTelefono?.trim() || null,
    // Mutuamente excluyentes: un técnico con cuenta (id) o un nombre
    // libre para quien no la tiene, nunca ambos.
    tecnicoId: datos.tecnicoId || null,
    tecnicoNombre: datos.tecnicoId ? null : datos.tecnicoNombre?.trim() || null,
    falla: datos.falla?.trim() || null,
    procedimiento: datos.procedimiento?.trim() || null,
    fotos: datos.fotos ?? [],
    videos: datos.videos ?? [],
    documentos: datos.documentos ?? [],
    estado: "pendiente",
  });

  const pasos = (datos.pasos ?? []).filter((p) => p.texto.trim());
  if (pasos.length) {
    await db.insert(pasoDiagnostico).values(
      pasos.map((p, i) => ({
        id: id(),
        diagnosticoId,
        texto: p.texto.trim(),
        hecho: p.hecho,
        orden: i,
      }))
    );
  }

  revalidatePath("/panel/diagnosticos");
  return { ok: true, numero: ultimo + 1, id: diagnosticoId };
}

export async function alternarPaso(pasoId: string, hecho: boolean) {
  await db.update(pasoDiagnostico).set({ hecho }).where(eq(pasoDiagnostico.id, pasoId));
  revalidatePath("/panel/diagnosticos");
  return { ok: true };
}

/** Asocia el diagnóstico a una Orden ya existente — no genera una nueva. */
export async function vincularDiagnostico(diagnosticoId: string, trabajoId: string) {
  const tallerId = await tallerActual();

  const [duenoTrabajo] = await db
    .select({ id: trabajo.id })
    .from(trabajo)
    .where(and(eq(trabajo.id, trabajoId), eq(trabajo.tallerId, tallerId)))
    .limit(1);

  if (!duenoTrabajo) return { error: "No se encontró esa orden." };

  await db
    .update(diagnostico)
    .set({ estado: "vinculado", trabajoId, updatedAt: new Date() })
    .where(and(eq(diagnostico.id, diagnosticoId), eq(diagnostico.tallerId, tallerId)));

  revalidatePath("/panel/diagnosticos");
  return { ok: true };
}

/**
 * Órdenes abiertas para elegir a cuál vincular un diagnóstico — las
 * de la misma patente primero (lo más probable que se busque), el
 * resto después. Liviano a propósito: solo lo que necesita el
 * selector, no toda la ficha que usa la lista de Órdenes.
 */
export async function ordenesParaVincular(patente: string) {
  const tallerId = await tallerActual();
  const limpia = patente.trim().toUpperCase();

  const filas = await db
    .select({
      id: trabajo.id,
      numero: trabajo.numero,
      patente: vehiculo.patente,
    })
    .from(trabajo)
    .innerJoin(vehiculo, eq(trabajo.vehiculoId, vehiculo.id))
    .where(and(eq(trabajo.tallerId, tallerId), ne(trabajo.estado, "entregado")))
    .orderBy(desc(trabajo.numero));

  return filas.sort((a, b) => {
    const aCoincide = a.patente === limpia ? 0 : 1;
    const bCoincide = b.patente === limpia ? 0 : 1;
    return aCoincide - bCoincide;
  });
}
