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
};

export async function crearVenta(datos: {
  clienteId?: string;
  patente?: string;
  estado: "pagada" | "cotizacion";
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

  // Una venta pagada queda registrada a nombre de alguien real, para
  // trazabilidad y consistencia con el resto de la app — una
  // cotización todavía no compromete a nadie, así que puede quedar
  // sin cliente.
  if (datos.estado === "pagada" && !datos.clienteId) {
    return { error: "Selecciona un cliente para completar la venta." };
  }

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
      if (datos.estado === "pagada" && real.stock < item.cantidad) {
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
    }))
  );

  // Solo una venta pagada descuenta stock — una cotización no debe
  // tocar el inventario todavía.
  if (datos.estado === "pagada") {
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
