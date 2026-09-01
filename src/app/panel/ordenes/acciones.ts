"use server";

import { revalidatePath } from "next/cache";
import { eq, and, desc, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import {
  trabajo,
  vehiculo,
  cliente,
  parteUsada,
  parte,
  abono,
  user,
  miembroTaller,
  procedimiento,
} from "@/db/schema";

const tecnico = alias(user, "tecnico");
import { tallerActual, tienePlan } from "@/lib/taller";

export async function listarOrdenes() {
  const tallerId = await tallerActual();

  return db
    .select({
      id: trabajo.id,
      numero: trabajo.numero,
      sintoma: trabajo.sintoma,
      diagnostico: trabajo.diagnostico,
      descripcion: trabajo.descripcion,
      kilometraje: trabajo.kilometraje,
      fotos: trabajo.fotos,
      estado: trabajo.estado,
      esperaDetalle: trabajo.esperaDetalle,
      estadoPago: trabajo.estadoPago,
      total: trabajo.total,
      abonado: trabajo.abonado,
      fecha: trabajo.fecha,
      fechaEntrega: trabajo.fechaEntrega,
      tecnicoId: trabajo.tecnicoId,
      tecnicoNombre: trabajo.tecnicoNombre,
      patente: vehiculo.patente,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      propietario: cliente.nombre,
      telefono: cliente.telefono,
      // No hay un "total esperado" de procedimientos por orden —
      // cada trabajo termina llevando una cantidad distinta. Este
      // conteo solo dice cuántos ya se anotaron, sin fingir que mide
      // cuánto falta.
      procedimientos: sql<number>`(
        select count(*)::int from ${procedimiento}
        where ${procedimiento.trabajoId} = ${trabajo.id}
      )`,
    })
    .from(trabajo)
    .innerJoin(vehiculo, eq(trabajo.vehiculoId, vehiculo.id))
    .leftJoin(cliente, eq(vehiculo.propietarioId, cliente.id))
    .where(eq(trabajo.tallerId, tallerId))
    .orderBy(desc(trabajo.numero));
}

/**
 * Una orden puntual por id, para la página de detalle
 * (/panel/ordenes/[id]) — misma forma que listarOrdenes(), null si
 * no existe o no es del taller actual.
 */
export async function obtenerOrden(ordenId: string) {
  const tallerId = await tallerActual();

  const [orden] = await db
    .select({
      id: trabajo.id,
      numero: trabajo.numero,
      sintoma: trabajo.sintoma,
      diagnostico: trabajo.diagnostico,
      descripcion: trabajo.descripcion,
      kilometraje: trabajo.kilometraje,
      fotos: trabajo.fotos,
      estado: trabajo.estado,
      esperaDetalle: trabajo.esperaDetalle,
      estadoPago: trabajo.estadoPago,
      manoObraFreno: trabajo.manoObraFreno,
      cargoTraslado: trabajo.cargoTraslado,
      total: trabajo.total,
      abonado: trabajo.abonado,
      fecha: trabajo.fecha,
      fechaEntrega: trabajo.fechaEntrega,
      tecnicoId: trabajo.tecnicoId,
      tecnicoNombre: trabajo.tecnicoNombre,
      patente: vehiculo.patente,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      propietario: cliente.nombre,
      telefono: cliente.telefono,
    })
    .from(trabajo)
    .innerJoin(vehiculo, eq(trabajo.vehiculoId, vehiculo.id))
    .leftJoin(cliente, eq(vehiculo.propietarioId, cliente.id))
    .where(and(eq(trabajo.id, ordenId), eq(trabajo.tallerId, tallerId)))
    .limit(1);

  return orden ?? null;
}

/**
 * Todo lo necesario para imprimir la orden de trabajo con el formato de
 * cotización/recepción de vehículos — Plan Serviteca en adelante.
 * Devuelve null si la orden no es del taller actual o si el plan no
 * incluye impresión, tratando ambos casos igual para no filtrar cuál.
 */
export async function datosParaImprimir(ordenId: string) {
  const tallerId = await tallerActual();
  if (!(await tienePlan("impresionOrden"))) return null;

  const [orden] = await db
    .select({
      id: trabajo.id,
      numero: trabajo.numero,
      ordenadoPor: trabajo.ordenadoPor,
      ordenadoPorFono: trabajo.ordenadoPorFono,
      sintoma: trabajo.sintoma,
      diagnostico: trabajo.diagnostico,
      descripcion: trabajo.descripcion,
      kilometraje: trabajo.kilometraje,
      danos: trabajo.danos,
      danoOtro: trabajo.danoOtro,
      combustible: trabajo.combustible,
      accesorios: trabajo.accesorios,
      observaciones: trabajo.observaciones,
      serviciosRealizados: trabajo.serviciosRealizados,
      manoObra: trabajo.manoObra,
      manoObraFreno: trabajo.manoObraFreno,
      repuestos: trabajo.repuestos,
      cargoTraslado: trabajo.cargoTraslado,
      iva: trabajo.iva,
      total: trabajo.total,
      abonado: trabajo.abonado,
      fecha: trabajo.fecha,
      patente: vehiculo.patente,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      tipo: vehiculo.tipo,
      anio: vehiculo.anio,
      color: vehiculo.color,
      motor: vehiculo.motor,
      cilindrada: vehiculo.cilindrada,
      vin: vehiculo.vin,
      movil: vehiculo.movil,
      propietarioNumero: cliente.numero,
      propietario: cliente.nombre,
      propietarioTelefono: cliente.telefono,
      propietarioEmail: cliente.email,
      propietarioDireccion: cliente.direccion,
      propietarioComuna: cliente.comuna,
      propietarioCiudad: cliente.ciudad,
      esEmpresa: cliente.esEmpresa,
      empresa: cliente.empresa,
      empresaRut: cliente.empresaRut,
      taller: user.taller,
      tallerLogo: user.image,
      tallerRut: user.rut,
      tallerDireccion: user.direccion,
      tallerTelefono: user.telefono,
      tallerEmail: user.email,
      // Un técnico sin cuenta no tiene fila en `tecnico` — su nombre
      // libre queda en trabajo.tecnicoNombre en su lugar.
      tecnico: sql<string | null>`coalesce(${tecnico.name}, ${trabajo.tecnicoNombre})`,
    })
    .from(trabajo)
    .innerJoin(vehiculo, eq(trabajo.vehiculoId, vehiculo.id))
    .leftJoin(cliente, eq(vehiculo.propietarioId, cliente.id))
    .innerJoin(user, eq(trabajo.tallerId, user.id))
    .leftJoin(tecnico, eq(trabajo.tecnicoId, tecnico.id))
    .where(and(eq(trabajo.id, ordenId), eq(trabajo.tallerId, tallerId)))
    .limit(1);

  if (!orden) return null;

  const piezas = await db
    .select({
      nombre: parteUsada.nombre,
      codigo: parteUsada.codigo,
      cantidad: parteUsada.cantidad,
      precioUnitario: parteUsada.precioUnitario,
    })
    .from(parteUsada)
    .where(eq(parteUsada.trabajoId, ordenId));

  return { orden, piezas };
}

/**
 * Quién puede quedar como técnico a cargo de una orden — Plan
 * Serviteca: el dueño del taller y sus ayudantes del Equipo.
 */
export async function listarTecnicos() {
  const tallerId = await tallerActual();

  const [dueno] = await db
    .select({ id: user.id, nombre: user.name })
    .from(user)
    .where(eq(user.id, tallerId))
    .limit(1);

  const ayudantes = await db
    .select({ id: user.id, nombre: user.name })
    .from(miembroTaller)
    .innerJoin(user, eq(miembroTaller.userId, user.id))
    .where(eq(miembroTaller.tallerId, tallerId));

  return dueno ? [dueno, ...ayudantes] : ayudantes;
}

/**
 * Los vehículos disponibles para abrir una orden, con el último
 * kilometraje conocido: el de la visita más reciente, o el inicial si
 * es la primera vez. Sirve para no escribirlo de cero cada vez.
 */
export async function listarVehiculosParaOrden() {
  const tallerId = await tallerActual();

  return db
    .select({
      id: vehiculo.id,
      patente: vehiculo.patente,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      tipo: vehiculo.tipo,
      anio: vehiculo.anio,
      color: vehiculo.color,
      motor: vehiculo.motor,
      cilindrada: vehiculo.cilindrada,
      vin: vehiculo.vin,
      movil: vehiculo.movil,
      propietarioId: cliente.id,
      propietarioNumero: cliente.numero,
      propietario: cliente.nombre,
      propietarioTelefono: cliente.telefono,
      propietarioEmail: cliente.email,
      propietarioDireccion: cliente.direccion,
      propietarioComuna: cliente.comuna,
      propietarioCiudad: cliente.ciudad,
      esEmpresa: cliente.esEmpresa,
      empresa: cliente.empresa,
      empresaRut: cliente.empresaRut,
      ultimoKilometraje: sql<number | null>`coalesce(
        max(${trabajo.kilometraje}),
        ${vehiculo.kilometrajeInicial}
      )`,
    })
    .from(vehiculo)
    .leftJoin(cliente, eq(vehiculo.propietarioId, cliente.id))
    .leftJoin(trabajo, eq(trabajo.vehiculoId, vehiculo.id))
    .where(eq(vehiculo.tallerId, tallerId))
    .groupBy(
      vehiculo.id,
      cliente.id,
      cliente.numero,
      cliente.nombre,
      cliente.telefono,
      cliente.email,
      cliente.direccion,
      cliente.comuna,
      cliente.ciudad,
      cliente.esEmpresa,
      cliente.empresa,
      cliente.empresaRut
    )
    .orderBy(vehiculo.patente);
}

export async function abrirOrden(datos: {
  vehiculoId: string;
  kilometraje?: string;
  sintoma?: string;
  diagnostico?: string;
  fotos?: string[];
  danos?: string[];
  danoOtro?: string;
  combustible?: string;
  accesorios?: string[];
  observaciones?: string;
  ordenadoPor?: string;
  ordenadoPorFono?: string;
  tecnicoId?: string;
  tecnicoNombre?: string;
  piezas?: RepuestoUsado[];
}) {
  const tallerId = await tallerActual();

  if (!datos.vehiculoId) {
    return { error: "Elige un vehículo." };
  }

  // Correlativo por taller
  const [{ ultimo }] = await db
    .select({ ultimo: sql<number>`coalesce(max(${trabajo.numero}), 0)`.mapWith(Number) })
    .from(trabajo)
    .where(eq(trabajo.tallerId, tallerId));

  const ordenId = crypto.randomUUID();

  await db.insert(trabajo).values({
    id: ordenId,
    tallerId,
    vehiculoId: datos.vehiculoId,
    numero: ultimo + 1,
    sintoma: datos.sintoma?.trim() || null,
    diagnostico: datos.diagnostico?.trim() || null,
    kilometraje: datos.kilometraje ? Number(datos.kilometraje) : null,
    fotos: datos.fotos ?? [],
    danos: datos.danos ?? [],
    danoOtro: datos.danoOtro?.trim() || null,
    combustible: datos.combustible || null,
    accesorios: datos.accesorios ?? [],
    observaciones: datos.observaciones?.trim() || null,
    ordenadoPor: datos.ordenadoPor?.trim() || null,
    ordenadoPorFono: datos.ordenadoPorFono?.trim() || null,
    // Mutuamente excluyentes: un técnico con cuenta (id) o un nombre
    // libre para quien no la tiene, nunca ambos.
    tecnicoId: datos.tecnicoId || null,
    tecnicoNombre: datos.tecnicoId ? null : datos.tecnicoNombre?.trim() || null,
    estado: "ingresado",
  });

  // Repuestos cotizados al abrir — sin descontar stock todavía: eso
  // solo pasa al cerrar la orden, que ya reemplaza y descuenta estas
  // mismas filas (ver cerrarOrden). Así el mecánico no anota el
  // repuesto dos veces.
  const piezas = (datos.piezas ?? []).filter((p) => p.nombre.trim());
  if (piezas.length) {
    await db.insert(parteUsada).values(
      piezas.map((p) => ({
        id: crypto.randomUUID(),
        trabajoId: ordenId,
        parteId: p.parteId || null,
        nombre: p.nombre.trim(),
        codigo: p.codigo?.trim() || null,
        cantidad: Number(p.cantidad) || 1,
        costoUnitario: Number(p.costo) || 0,
        precioUnitario: Number(p.precio) || 0,
        dondeSeCompro: p.donde.trim() || null,
      }))
    );
  }

  revalidatePath("/panel/ordenes");
  revalidatePath("/panel");
  return { ok: true, numero: ultimo + 1 };
}

/**
 * Editar una orden que sigue abierta (ingresado / en proceso), sin
 * cerrarla. Caso real: se diagnostica algo y después se encuentra un
 * problema aparte — hasta ahora no había forma de anotarlo sin
 * esperar a cerrar la orden del todo.
 */
export async function editarOrdenAbierta(
  ordenId: string,
  datos: {
    sintoma: string;
    kilometraje: string;
    diagnostico: string;
    descripcion: string;
    tecnicoId?: string;
    tecnicoNombre?: string;
    fotos?: string[];
    // Cobro parcial: antes se perdía al usar "Guardar sin cerrar" —
    // solo se guardaba de verdad al cerrar la orden con cerrarOrden().
    manoObraFreno?: string;
    cargoTraslado?: string;
    estadoPago?: string;
  }
) {
  const tallerId = await tallerActual();

  await db
    .update(trabajo)
    .set({
      sintoma: datos.sintoma.trim() || null,
      kilometraje: datos.kilometraje ? Number(datos.kilometraje) : null,
      diagnostico: datos.diagnostico.trim() || null,
      descripcion: datos.descripcion.trim() || null,
      // Mutuamente excluyentes: un técnico con cuenta (id) o un
      // nombre libre para quien no la tiene, nunca ambos.
      tecnicoId: datos.tecnicoId || null,
      tecnicoNombre: datos.tecnicoId ? null : datos.tecnicoNombre?.trim() || null,
      ...(datos.fotos !== undefined ? { fotos: datos.fotos } : {}),
      ...(datos.manoObraFreno !== undefined
        ? { manoObraFreno: Number(datos.manoObraFreno) || 0 }
        : {}),
      ...(datos.cargoTraslado !== undefined
        ? { cargoTraslado: Number(datos.cargoTraslado) || 0 }
        : {}),
      ...(datos.estadoPago !== undefined
        ? { estadoPago: datos.estadoPago }
        : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(trabajo.id, ordenId), eq(trabajo.tallerId, tallerId)));

  revalidatePath("/panel/ordenes");
  return { ok: true };
}

/** Una línea de "lo que se ha hecho" mientras la orden sigue abierta. */
export type Procedimiento = {
  id: string;
  descripcion: string;
  manoObra: number;
  repuesto: number;
  repuestoNombre: string | null;
};

/** Las líneas de procedimiento ya cargadas, para precargarlas al reabrir. */
export async function procedimientosDeOrden(
  ordenId: string
): Promise<Procedimiento[]> {
  const tallerId = await tallerActual();

  const [duena] = await db
    .select({ id: trabajo.id })
    .from(trabajo)
    .where(and(eq(trabajo.id, ordenId), eq(trabajo.tallerId, tallerId)))
    .limit(1);

  if (!duena) return [];

  return db
    .select({
      id: procedimiento.id,
      descripcion: procedimiento.descripcion,
      manoObra: procedimiento.manoObra,
      repuesto: procedimiento.repuesto,
      repuestoNombre: procedimiento.repuestoNombre,
    })
    .from(procedimiento)
    .where(eq(procedimiento.trabajoId, ordenId))
    .orderBy(procedimiento.createdAt);
}

/**
 * Una línea de "lo que se ha hecho" mientras la orden sigue abierta —
 * caso real de Tío Lalo: cambia algo (ej. "cambio de embrague"),
 * anota mano de obra + repuesto de esa línea, y ve el total
 * acumulado del cliente sin esperar a cerrar la orden.
 */
export async function agregarProcedimiento(
  ordenId: string,
  datos: {
    descripcion: string;
    manoObra: string;
    repuesto: string;
    repuestoNombre: string;
  }
) {
  const tallerId = await tallerActual();

  const [duena] = await db
    .select({ id: trabajo.id })
    .from(trabajo)
    .where(and(eq(trabajo.id, ordenId), eq(trabajo.tallerId, tallerId)))
    .limit(1);

  if (!duena) return { error: "Orden no encontrada." };
  if (!datos.descripcion.trim()) return { error: "Escribe qué se hizo." };

  const nuevo = {
    id: crypto.randomUUID(),
    trabajoId: ordenId,
    descripcion: datos.descripcion.trim(),
    manoObra: Number(datos.manoObra) || 0,
    repuesto: Number(datos.repuesto) || 0,
    repuestoNombre: datos.repuestoNombre.trim() || null,
  };

  await db.insert(procedimiento).values(nuevo);

  revalidatePath("/panel/ordenes");
  return {
    ok: true,
    item: {
      id: nuevo.id,
      descripcion: nuevo.descripcion,
      manoObra: nuevo.manoObra,
      repuesto: nuevo.repuesto,
      repuestoNombre: nuevo.repuestoNombre,
    },
  };
}

export async function quitarProcedimiento(id: string) {
  const tallerId = await tallerActual();

  // Confirma que la línea pertenece a una orden del taller actual
  // antes de borrar — procedimiento no tiene tallerId propio.
  const [linea] = await db
    .select({ trabajoId: procedimiento.trabajoId })
    .from(procedimiento)
    .where(eq(procedimiento.id, id))
    .limit(1);

  if (!linea) return;

  const [duena] = await db
    .select({ id: trabajo.id })
    .from(trabajo)
    .where(and(eq(trabajo.id, linea.trabajoId), eq(trabajo.tallerId, tallerId)))
    .limit(1);

  if (!duena) return;

  await db.delete(procedimiento).where(eq(procedimiento.id, id));

  revalidatePath("/panel/ordenes");
}

/** Corrige una línea de procedimiento ya agregada, sin borrar y recrear. */
export async function editarProcedimiento(
  id: string,
  datos: {
    descripcion: string;
    manoObra: string;
    repuesto: string;
    repuestoNombre: string;
  }
) {
  const tallerId = await tallerActual();

  const [linea] = await db
    .select({ trabajoId: procedimiento.trabajoId })
    .from(procedimiento)
    .where(eq(procedimiento.id, id))
    .limit(1);

  if (!linea) return { error: "Línea no encontrada." };

  const [duena] = await db
    .select({ id: trabajo.id })
    .from(trabajo)
    .where(and(eq(trabajo.id, linea.trabajoId), eq(trabajo.tallerId, tallerId)))
    .limit(1);

  if (!duena) return { error: "Línea no encontrada." };
  if (!datos.descripcion.trim()) return { error: "Escribe qué se hizo." };

  const cambios = {
    descripcion: datos.descripcion.trim(),
    manoObra: Number(datos.manoObra) || 0,
    repuesto: Number(datos.repuesto) || 0,
    repuestoNombre: datos.repuestoNombre.trim() || null,
  };

  await db.update(procedimiento).set(cambios).where(eq(procedimiento.id, id));

  revalidatePath("/panel/ordenes");
  return { ok: true, item: { id, ...cambios } };
}

/**
 * Reemplaza TODAS las líneas de "qué se hizo" de una orden por las
 * que llegan — pedido real de Tío Lalo: un solo cuadro de texto
 * donde escribe línea por línea ("Cambio radiador 35000") en vez de
 * ir llenando descripción/monto en campos separados por cada línea.
 * Se usa al perder el foco del cuadro: borra lo anterior y crea de
 * nuevo desde el texto actual, más simple y confiable que tratar de
 * calzar cada línea con la fila que ya existía en la base.
 */
export async function reemplazarProcedimientos(
  ordenId: string,
  lineas: { descripcion: string; manoObra: string }[]
) {
  const tallerId = await tallerActual();

  const [duena] = await db
    .select({ id: trabajo.id })
    .from(trabajo)
    .where(and(eq(trabajo.id, ordenId), eq(trabajo.tallerId, tallerId)))
    .limit(1);

  if (!duena) return { error: "Orden no encontrada." };

  await db.delete(procedimiento).where(eq(procedimiento.trabajoId, ordenId));

  const validas = lineas.filter((l) => l.descripcion.trim());
  const nuevos = validas.map((l) => ({
    id: crypto.randomUUID(),
    trabajoId: ordenId,
    descripcion: l.descripcion.trim(),
    manoObra: Number(l.manoObra) || 0,
    repuesto: 0,
    repuestoNombre: null,
  }));

  if (nuevos.length > 0) {
    await db.insert(procedimiento).values(nuevos);
  }

  revalidatePath("/panel/ordenes");
  return {
    ok: true,
    items: nuevos.map((n) => ({
      id: n.id,
      descripcion: n.descripcion,
      manoObra: n.manoObra,
      repuesto: n.repuesto,
      repuestoNombre: n.repuestoNombre,
    })),
  };
}

/**
 * Corregir "qué se hizo" en una orden ya Terminada o Entregada —
 * caso real: se acuerda de algo que faltó anotar después de cerrar.
 * No toca montos: eso quedó calculado al cerrar y no se recalcula.
 */
export async function editarDescripcion(ordenId: string, descripcion: string) {
  const tallerId = await tallerActual();

  await db
    .update(trabajo)
    .set({ descripcion: descripcion.trim() || null, updatedAt: new Date() })
    .where(and(eq(trabajo.id, ordenId), eq(trabajo.tallerId, tallerId)));

  revalidatePath("/panel/ordenes");
  return { ok: true };
}

export async function cambiarEstado(ordenId: string, estado: string) {
  const tallerId = await tallerActual();

  await db
    .update(trabajo)
    .set({
      estado,
      fechaEntrega: estado === "entregado" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(trabajo.id, ordenId), eq(trabajo.tallerId, tallerId)));

  revalidatePath("/panel/ordenes");
  return { ok: true };
}

/**
 * El auto se va del taller a la espera de un repuesto (típico en
 * importaciones): queda visible en la lista pero marcado como que no
 * está físicamente ahí, con el detalle de qué se pidió.
 */
export async function esperarRepuesto(ordenId: string, detalle: string) {
  const tallerId = await tallerActual();

  if (!detalle.trim()) {
    return { error: "Escribe qué repuesto se está esperando." };
  }

  await db
    .update(trabajo)
    .set({
      estado: "esperando_repuesto",
      esperaDetalle: detalle.trim(),
      updatedAt: new Date(),
    })
    .where(and(eq(trabajo.id, ordenId), eq(trabajo.tallerId, tallerId)));

  revalidatePath("/panel/ordenes");
  return { ok: true };
}

/** El repuesto llegó y el auto vuelve al taller a terminar el trabajo. */
export async function retomarTrabajo(ordenId: string) {
  const tallerId = await tallerActual();

  await db
    .update(trabajo)
    .set({
      estado: "en_proceso",
      esperaDetalle: null,
      updatedAt: new Date(),
    })
    .where(and(eq(trabajo.id, ordenId), eq(trabajo.tallerId, tallerId)));

  revalidatePath("/panel/ordenes");
  return { ok: true };
}

/** Qué se compró para este auto, dónde y cuánto costó. */
export type RepuestoUsado = {
  nombre: string;
  cantidad: string;
  costo: string;
  precio: string;
  donde: string;
  /** Si viene del inventario (insumo con stock), su id — para descontarlo al cerrar. */
  parteId?: string | null;
  /** Código del repuesto en la cotización impresa — texto libre, no el parteId. */
  codigo?: string;
};

/** Se completa cuando el trabajo ya está hecho: qué se hizo y cuánto salió. */
export async function cerrarOrden(datos: {
  ordenId: string;
  descripcion: string;
  manoObra: string;
  manoObraFreno?: string;
  repuestos: string;
  cargoTraslado: string;
  estadoPago: string;
  montoAbonado?: string;
  conIva?: boolean;
  piezas?: RepuestoUsado[];
  servicios?: string[];
  fotos?: string[];
}) {
  const tallerId = await tallerActual();

  // parteId viene del cliente: sin el Plan Serviteca, aunque alguien
  // fuerce el envío de un parteId no se descuenta nada del inventario
  // de nadie — se guarda igual como repuesto puntual (sin id).
  const tieneInventario = await tienePlan("inventario");
  // El checklist de servicios es del Plan Serviteca — igual que
  // manoObraFreno, ignorar lo que llegue sin ese plan.
  const tieneImpresion = await tienePlan("impresionOrden");
  const servicios = tieneImpresion ? (datos.servicios ?? []) : [];
  const piezas = (datos.piezas ?? [])
    .filter((p) => p.nombre.trim())
    .map((p) => (tieneInventario ? p : { ...p, parteId: null }));

  const manoObra = Number(datos.manoObra) || 0;
  const manoObraFreno = Number(datos.manoObraFreno) || 0;
  const cargoTraslado = Number(datos.cargoTraslado) || 0;

  // Si se detallaron las piezas, el cobro de repuestos sale de ellas;
  // si no, del campo suelto de siempre.
  const repuestos = piezas.length
    ? piezas.reduce(
        (s, p) => s + (Number(p.precio) || 0) * (Number(p.cantidad) || 1),
        0
      )
    : Number(datos.repuestos) || 0;

  // El IVA se suma encima de lo cobrado. Se redondea porque los pesos
  // chilenos no llevan decimales.
  const neto = manoObra + manoObraFreno + repuestos + cargoTraslado;
  const iva = datos.conIva ? Math.round(neto * 0.19) : 0;
  const total = neto + iva;

  if (!datos.descripcion.trim()) {
    return { error: "Escribe qué se hizo." };
  }

  // Si quedó fiado pero entregó algo ahora, el estado real es "abonado":
  // debe una parte, no el total.
  const montoAbonado = Math.min(
    Math.max(Number(datos.montoAbonado) || 0, 0),
    total
  );
  const estadoPago =
    datos.estadoPago === "fiado" && montoAbonado > 0
      ? "abonado"
      : datos.estadoPago;
  const abonado =
    estadoPago === "pagado" ? total : estadoPago === "abonado" ? montoAbonado : 0;

  await db
    .update(trabajo)
    .set({
      descripcion: datos.descripcion.trim(),
      manoObra,
      manoObraFreno,
      repuestos,
      cargoTraslado,
      iva,
      total,
      serviciosRealizados: servicios,
      ...(datos.fotos !== undefined ? { fotos: datos.fotos } : {}),
      estadoPago,
      abonado,
      fechaPago: estadoPago === "pagado" ? new Date() : null,
      estado: "terminado",
      updatedAt: new Date(),
    })
    .where(and(eq(trabajo.id, datos.ordenId), eq(trabajo.tallerId, tallerId)));

  // Cerrar como pagado o con abono es un cobro y tiene que quedar
  // registrado: si no, el trabajo figura con plata recibida pero
  // "Cobrado este mes" no lo cuenta.
  await db.delete(abono).where(eq(abono.trabajoId, datos.ordenId));

  if (abonado > 0) {
    await db.insert(abono).values({
      id: crypto.randomUUID(),
      trabajoId: datos.ordenId,
      monto: abonado,
      nota: estadoPago === "pagado" ? "Pagado al entregar" : "Abono al entregar",
    });
  }

  // Se reemplazan: cerrar dos veces la misma orden no debe duplicarlas.
  // Antes de borrar, hay que devolver al inventario lo que se había
  // descontado la vez anterior — si no, cerrar dos veces (por ejemplo
  // para corregir un dato) descuenta el stock de más.
  const piezasAnteriores = await db
    .select({ parteId: parteUsada.parteId, cantidad: parteUsada.cantidad })
    .from(parteUsada)
    .where(eq(parteUsada.trabajoId, datos.ordenId));

  for (const anterior of piezasAnteriores) {
    if (anterior.parteId) {
      await db
        .update(parte)
        .set({ stock: sql`${parte.stock} + ${anterior.cantidad}` })
        .where(eq(parte.id, anterior.parteId));
    }
  }

  await db.delete(parteUsada).where(eq(parteUsada.trabajoId, datos.ordenId));

  if (piezas.length) {
    await db.insert(parteUsada).values(
      piezas.map((p) => ({
        id: crypto.randomUUID(),
        trabajoId: datos.ordenId,
        parteId: p.parteId || null,
        nombre: p.nombre.trim(),
        codigo: p.codigo?.trim() || null,
        cantidad: Number(p.cantidad) || 1,
        costoUnitario: Number(p.costo) || 0,
        precioUnitario: Number(p.precio) || 0,
        dondeSeCompro: p.donde.trim() || null,
      }))
    );

    // Solo se descuenta del inventario lo que vino elegido de ahí —
    // un repuesto puntual escrito libre (sin parteId) no toca stock.
    for (const p of piezas) {
      if (p.parteId) {
        await db
          .update(parte)
          .set({ stock: sql`${parte.stock} - ${Number(p.cantidad) || 1}` })
          .where(eq(parte.id, p.parteId));
      }
    }
  }

  revalidatePath("/panel/ordenes");
  revalidatePath("/panel/pagos");
  revalidatePath("/panel");
  return { ok: true };
}

/** El checklist de servicios ya marcado, para precargarlo al reabrir el cierre. */
export async function serviciosDeOrden(ordenId: string) {
  const tallerId = await tallerActual();

  const [orden] = await db
    .select({ servicios: trabajo.serviciosRealizados })
    .from(trabajo)
    .where(and(eq(trabajo.id, ordenId), eq(trabajo.tallerId, tallerId)))
    .limit(1);

  return orden?.servicios ?? [];
}

/** Los repuestos de una orden, con lo que costaron y lo que se cobró. */
export async function repuestosDeOrden(ordenId: string) {
  const tallerId = await tallerActual();

  const [duena] = await db
    .select({ id: trabajo.id })
    .from(trabajo)
    .where(and(eq(trabajo.id, ordenId), eq(trabajo.tallerId, tallerId)))
    .limit(1);

  if (!duena) return [];

  return db
    .select({
      parteId: parteUsada.parteId,
      nombre: parteUsada.nombre,
      codigo: parteUsada.codigo,
      cantidad: parteUsada.cantidad,
      costoUnitario: parteUsada.costoUnitario,
      precioUnitario: parteUsada.precioUnitario,
      dondeSeCompro: parteUsada.dondeSeCompro,
    })
    .from(parteUsada)
    .where(eq(parteUsada.trabajoId, ordenId));
}
