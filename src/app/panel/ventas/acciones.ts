"use server";

import { revalidatePath } from "next/cache";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/db";
import { venta, itemVenta, parte, cliente } from "@/db/schema";
import { tallerActual, tienePlan } from "@/lib/taller";

function id() {
  return crypto.randomUUID();
}

export type ItemCarrito = {
  parteId: string | null;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  /** repuesto · servicio · mano_obra — solo en un ítem libre sin parteId. */
  tipo?: string | null;
};

export async function crearVenta(datos: {
  clienteId?: string;
  patente?: string;
  estado: "pagada" | "pendiente" | "cotizacion";
  metodoPago?: string;
  referenciaPago?: string;
  descuentoPorcentaje?: number;
  conIva?: boolean;
  notas?: string;
  items: ItemCarrito[];
}) {
  if (!(await tienePlan("impresionOrden"))) {
    return { error: "Esta función es del Plan Serviteca." };
  }

  const tallerId = await tallerActual();
  const items = datos.items.filter((i) => i.nombre.trim());
  if (items.length === 0) {
    return { error: "Agrega al menos un ítem al carrito." };
  }

  // Pagada y pendiente ya entregan algo real, por eso descuentan
  // stock — el cliente queda a criterio del mecánico, opcional en
  // cualquier estado (ej. venta de mostrador sin registrar a nadie).
  const yaEntregada = datos.estado === "pagada" || datos.estado === "pendiente";

  let clienteNombre: string | null = null;
  let clienteTelefono: string | null = null;

  if (datos.clienteId) {
    const [c] = await db
      .select({ nombre: cliente.nombre, telefono: cliente.telefono })
      .from(cliente)
      .where(and(eq(cliente.id, datos.clienteId), eq(cliente.tallerId, tallerId)))
      .limit(1);

    if (!c) return { error: "No se encontró el cliente seleccionado." };
    clienteNombre = c.nombre;
    clienteTelefono = c.telefono;
  }

  // Si hay líneas de repuesto (parteId), confirmar que hay stock antes
  // de descontar nada — no dejar la venta a medias si una línea falla.
  const idsPartes = items
    .map((i) => i.parteId)
    .filter((p): p is string => !!p);

  if (idsPartes.length) {
    const partes = await db
      .select({ id: parte.id, nombre: parte.nombre, stock: parte.stock })
      .from(parte)
      .where(and(eq(parte.tallerId, tallerId), sql`${parte.id} = any(${idsPartes})`));

    const stockPorId = new Map(partes.map((p) => [p.id, p]));
    for (const item of items) {
      if (!item.parteId) continue;
      const real = stockPorId.get(item.parteId);
      if (!real) return { error: `No se encontró "${item.nombre}" en inventario.` };
      if (yaEntregada && real.stock < item.cantidad) {
        return {
          error: `Sin stock suficiente de "${real.nombre}" (quedan ${real.stock}).`,
        };
      }
    }
  }

  const subtotal = items.reduce(
    (s, i) => s + i.cantidad * i.precioUnitario,
    0
  );
  const descuentoPorcentaje = Math.min(
    100,
    Math.max(0, datos.descuentoPorcentaje ?? 0)
  );
  const conDescuento = subtotal - Math.round((subtotal * descuentoPorcentaje) / 100);
  const total = datos.conIva
    ? Math.round(conDescuento * 1.19)
    : conDescuento;

  const [{ ultimo }] = await db
    .select({
      ultimo: sql<number>`coalesce(max(${venta.numero}), 0)`.mapWith(Number),
    })
    .from(venta)
    .where(eq(venta.tallerId, tallerId));

  const ventaId = id();

  await db.insert(venta).values({
    id: ventaId,
    tallerId,
    numero: ultimo + 1,
    clienteId: datos.clienteId || null,
    clienteNombre,
    clienteTelefono,
    patente: datos.patente?.trim().toUpperCase() || null,
    estado: datos.estado,
    // Solo pagada tiene medio de pago — pendiente todavía no cobró
    // nada, aunque ya haya descontado stock.
    metodoPago: datos.estado === "pagada" ? datos.metodoPago || null : null,
    referenciaPago:
      datos.estado === "pagada" ? datos.referenciaPago?.trim() || null : null,
    descuentoPorcentaje,
    conIva: datos.conIva ?? false,
    total,
    notas: datos.notas?.trim() || null,
  });

  await db.insert(itemVenta).values(
    items.map((i) => ({
      id: id(),
      ventaId,
      parteId: i.parteId,
      nombre: i.nombre.trim(),
      cantidad: i.cantidad,
      precioUnitario: i.precioUnitario,
      tipo: i.parteId ? null : (i.tipo ?? null),
    }))
  );

  // Pagada y pendiente ya entregaron el repuesto, así que descuentan
  // stock — una cotización no debe tocar el inventario todavía.
  if (yaEntregada) {
    for (const item of items) {
      if (!item.parteId) continue;
      await db
        .update(parte)
        .set({ stock: sql`${parte.stock} - ${item.cantidad}` })
        .where(and(eq(parte.id, item.parteId), eq(parte.tallerId, tallerId)));
    }
  }

  revalidatePath("/panel/ventas");
  revalidatePath("/panel/inventario");
  revalidatePath("/panel/pagos");
  return { ok: true, numero: ultimo + 1, id: ventaId };
}

export async function listarVentas() {
  if (!(await tienePlan("impresionOrden"))) return [];

  const tallerId = await tallerActual();

  return db
    .select({
      id: venta.id,
      numero: venta.numero,
      clienteNombre: venta.clienteNombre,
      patente: venta.patente,
      estado: venta.estado,
      metodoPago: venta.metodoPago,
      total: venta.total,
      fecha: venta.fecha,
    })
    .from(venta)
    .where(eq(venta.tallerId, tallerId))
    .orderBy(sql`${venta.fecha} desc`)
    .limit(100);
}

/**
 * Cobra una venta que estaba pendiente — el stock ya se descontó al
 * crearla, así que acá solo cambia el estado y registra el medio de
 * pago; recién ahí suma a Pagos.
 */
export async function marcarVentaPagada(
  ventaId: string,
  datos: { metodoPago?: string; referenciaPago?: string }
) {
  if (!(await tienePlan("impresionOrden"))) {
    return { error: "Esta función es del Plan Serviteca." };
  }

  const tallerId = await tallerActual();

  const [fila] = await db
    .select({ estado: venta.estado })
    .from(venta)
    .where(and(eq(venta.id, ventaId), eq(venta.tallerId, tallerId)))
    .limit(1);

  if (!fila) return { error: "No se encontró esa venta." };
  if (fila.estado !== "pendiente") {
    return { error: "Solo una venta pendiente se puede marcar como pagada." };
  }

  await db
    .update(venta)
    .set({
      estado: "pagada",
      metodoPago: datos.metodoPago || null,
      referenciaPago: datos.referenciaPago?.trim() || null,
    })
    .where(and(eq(venta.id, ventaId), eq(venta.tallerId, tallerId)));

  revalidatePath("/panel/ventas");
  revalidatePath("/panel/pagos");
  return { ok: true };
}

/**
 * Cambia el estado entre pendiente y pagada, en cualquier dirección
 * — "cotizacion" no es un destino válido acá: una venta que ya
 * descontó stock (pendiente/pagada) nunca vuelve a ser una simple
 * cotización sin comprometer inventario. Caja/Pagos leen
 * venta.estado directo en cada consulta, así que revertir a
 * pendiente ya la saca de ahí sin necesidad de deshacer nada más.
 */
export async function cambiarEstadoVenta(
  ventaId: string,
  estado: "pendiente" | "pagada"
) {
  if (!(await tienePlan("impresionOrden"))) {
    return { error: "Esta función es del Plan Serviteca." };
  }

  const tallerId = await tallerActual();

  const [fila] = await db
    .select({ estado: venta.estado })
    .from(venta)
    .where(and(eq(venta.id, ventaId), eq(venta.tallerId, tallerId)))
    .limit(1);

  if (!fila) return { error: "No se encontró esa venta." };
  if (fila.estado === "cotizacion") {
    return { error: "Una cotización no se puede marcar como pendiente o pagada desde acá." };
  }
  if (fila.estado === estado) return { ok: true };

  await db
    .update(venta)
    .set(
      estado === "pendiente"
        ? { estado, metodoPago: null, referenciaPago: null }
        : { estado }
    )
    .where(and(eq(venta.id, ventaId), eq(venta.tallerId, tallerId)));

  revalidatePath("/panel/ventas");
  revalidatePath("/panel/pagos");
  revalidatePath("/panel/caja");
  return { ok: true };
}

export type ItemVentaDetalle = {
  id: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
};

export type VentaDetalle = {
  id: string;
  numero: number;
  clienteNombre: string | null;
  patente: string | null;
  estado: string;
  metodoPago: string | null;
  referenciaPago: string | null;
  descuentoPorcentaje: number;
  conIva: boolean;
  total: number;
  notas: string | null;
  fecha: Date;
  items: ItemVentaDetalle[];
};

export async function obtenerVenta(ventaId: string) {
  if (!(await tienePlan("impresionOrden"))) return null;

  const tallerId = await tallerActual();

  const [datos] = await db
    .select({
      id: venta.id,
      numero: venta.numero,
      clienteNombre: venta.clienteNombre,
      patente: venta.patente,
      estado: venta.estado,
      metodoPago: venta.metodoPago,
      referenciaPago: venta.referenciaPago,
      descuentoPorcentaje: venta.descuentoPorcentaje,
      conIva: venta.conIva,
      total: venta.total,
      notas: venta.notas,
      fecha: venta.fecha,
    })
    .from(venta)
    .where(and(eq(venta.id, ventaId), eq(venta.tallerId, tallerId)))
    .limit(1);

  if (!datos) return null;

  const items = await db
    .select({
      id: itemVenta.id,
      nombre: itemVenta.nombre,
      cantidad: itemVenta.cantidad,
      precioUnitario: itemVenta.precioUnitario,
    })
    .from(itemVenta)
    .where(eq(itemVenta.ventaId, ventaId));

  return { ...datos, items } as VentaDetalle;
}
