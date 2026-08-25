"use server";

import { revalidatePath } from "next/cache";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  trabajo,
  vehiculo,
  cliente,
  parteUsada,
  parte,
  abono,
  user,
} from "@/db/schema";
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
      patente: vehiculo.patente,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      propietario: cliente.nombre,
      telefono: cliente.telefono,
    })
    .from(trabajo)
    .innerJoin(vehiculo, eq(trabajo.vehiculoId, vehiculo.id))
    .leftJoin(cliente, eq(vehiculo.propietarioId, cliente.id))
    .where(eq(trabajo.tallerId, tallerId))
    .orderBy(desc(trabajo.numero));
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
      combustible: trabajo.combustible,
      accesorios: trabajo.accesorios,
      observaciones: trabajo.observaciones,
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
      anio: vehiculo.anio,
      color: vehiculo.color,
      motor: vehiculo.motor,
      cilindrada: vehiculo.cilindrada,
      vin: vehiculo.vin,
      movil: vehiculo.movil,
      propietario: cliente.nombre,
      propietarioTelefono: cliente.telefono,
      propietarioEmail: cliente.email,
      empresa: cliente.empresa,
      empresaRut: cliente.empresaRut,
      taller: user.taller,
      tallerLogo: user.image,
      tallerRut: user.rut,
      tallerDireccion: user.direccion,
      tallerTelefono: user.telefono,
      tallerEmail: user.email,
    })
    .from(trabajo)
    .innerJoin(vehiculo, eq(trabajo.vehiculoId, vehiculo.id))
    .leftJoin(cliente, eq(vehiculo.propietarioId, cliente.id))
    .innerJoin(user, eq(trabajo.tallerId, user.id))
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
      anio: vehiculo.anio,
      color: vehiculo.color,
      motor: vehiculo.motor,
      cilindrada: vehiculo.cilindrada,
      vin: vehiculo.vin,
      movil: vehiculo.movil,
      propietario: cliente.nombre,
      propietarioTelefono: cliente.telefono,
      propietarioEmail: cliente.email,
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
      cliente.nombre,
      cliente.telefono,
      cliente.email,
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
  combustible?: string;
  accesorios?: string[];
  observaciones?: string;
  ordenadoPor?: string;
  ordenadoPorFono?: string;
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
    combustible: datos.combustible || null,
    accesorios: datos.accesorios ?? [],
    observaciones: datos.observaciones?.trim() || null,
    ordenadoPor: datos.ordenadoPor?.trim() || null,
    ordenadoPorFono: datos.ordenadoPorFono?.trim() || null,
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
      updatedAt: new Date(),
    })
    .where(and(eq(trabajo.id, ordenId), eq(trabajo.tallerId, tallerId)));

  revalidatePath("/panel/ordenes");
  return { ok: true };
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
}) {
  const tallerId = await tallerActual();

  // parteId viene del cliente: sin el Plan Serviteca, aunque alguien
  // fuerce el envío de un parteId no se descuenta nada del inventario
  // de nadie — se guarda igual como repuesto puntual (sin id).
  const tieneInventario = await tienePlan("inventario");
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
