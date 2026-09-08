"use server";

import { revalidatePath } from "next/cache";
import { eq, and, asc, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { compra, itemCompra, proveedor, parte, movimientoCaja } from "@/db/schema";
import { tallerActual, tienePlan } from "@/lib/taller";

function id() {
  return crypto.randomUUID();
}

export type EstadoCompra = "pendiente" | "pagada" | "anulada";
export type OrigenItemCompra = "inventario" | "nuevo" | "manual";

export type ItemCompraEntrada = {
  origen: OrigenItemCompra;
  parteId?: string;
  descripcion: string;
  cantidad: number;
  costoUnitario: number;
};

// ---------- Proveedores ----------

export type ProveedorOpcion = {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  documento: string | null;
  giro: string | null;
  direccion: string | null;
  notas: string | null;
};

export async function listarProveedores() {
  if (!(await tienePlan("impresionOrden"))) return [];

  const tallerId = await tallerActual();

  return db
    .select({
      id: proveedor.id,
      nombre: proveedor.nombre,
      email: proveedor.email,
      telefono: proveedor.telefono,
      documento: proveedor.documento,
      giro: proveedor.giro,
      direccion: proveedor.direccion,
      notas: proveedor.notas,
    })
    .from(proveedor)
    .where(eq(proveedor.tallerId, tallerId))
    .orderBy(asc(proveedor.nombre));
}

export async function crearProveedor(datos: {
  nombre: string;
  email?: string;
  telefono?: string;
  documento?: string;
  giro?: string;
  direccion?: string;
  notas?: string;
}) {
  if (!(await tienePlan("impresionOrden"))) {
    return { error: "Esta función es del Plan Serviteca." };
  }

  const tallerId = await tallerActual();
  const nombre = datos.nombre.trim();
  if (!nombre) return { error: "Escribe el nombre del proveedor." };

  const nuevoId = id();
  await db.insert(proveedor).values({
    id: nuevoId,
    tallerId,
    nombre,
    email: datos.email?.trim() || null,
    telefono: datos.telefono?.trim() || null,
    documento: datos.documento?.trim() || null,
    giro: datos.giro?.trim() || null,
    direccion: datos.direccion?.trim() || null,
    notas: datos.notas?.trim() || null,
  });

  revalidatePath("/panel/compras");
  return { ok: true, id: nuevoId, nombre };
}

// ---------- Repuestos existentes (para la línea "Desde inventario") ----------

export type RepuestoOpcion = {
  id: string;
  nombre: string;
  codigo: string | null;
  marca: string | null;
  stock: number;
  costo: number;
};

export async function listarRepuestosParaCompra() {
  if (!(await tienePlan("impresionOrden"))) return [];

  const tallerId = await tallerActual();

  return db
    .select({
      id: parte.id,
      nombre: parte.nombre,
      codigo: parte.codigo,
      marca: parte.marca,
      stock: parte.stock,
      costo: parte.costo,
    })
    .from(parte)
    .where(eq(parte.tallerId, tallerId))
    .orderBy(asc(parte.nombre));
}

// ---------- Compras ----------

export type CompraLista = {
  id: string;
  numero: number;
  proveedorNombreReal: string | null;
  proveedorNombre: string | null;
  folio: string | null;
  fecha: Date;
  estado: EstadoCompra;
  total: number;
};

export async function listarCompras() {
  if (!(await tienePlan("impresionOrden"))) return [];

  const tallerId = await tallerActual();

  const filas = await db
    .select({
      id: compra.id,
      numero: compra.numero,
      proveedorNombreReal: proveedor.nombre,
      proveedorNombre: compra.proveedorNombre,
      folio: compra.folio,
      fecha: compra.fecha,
      estado: compra.estado,
      total: compra.total,
    })
    .from(compra)
    .leftJoin(proveedor, eq(compra.proveedorId, proveedor.id))
    .where(eq(compra.tallerId, tallerId))
    .orderBy(desc(compra.fecha));

  return filas as CompraLista[];
}

async function calcularTotales(items: ItemCompraEntrada[]) {
  const subtotal = items.reduce(
    (acc, i) => acc + Math.round(i.costoUnitario) * Math.max(1, Math.round(i.cantidad)),
    0
  );
  // Sin impuesto separado por ahora — el taller lo agrega dentro del
  // costo unitario si corresponde; no hay integración de facturación
  // electrónica todavía que necesite el desglose.
  return { subtotal, impuesto: 0, total: subtotal };
}

export async function crearCompra(datos: {
  proveedorId?: string;
  proveedorNombre?: string;
  fechaIso: string;
  estado: EstadoCompra;
  folio?: string;
  notas?: string;
  items: ItemCompraEntrada[];
}) {
  if (!(await tienePlan("impresionOrden"))) {
    return { error: "Esta función es del Plan Serviteca." };
  }

  const tallerId = await tallerActual();

  if (!datos.fechaIso) return { error: "Elige la fecha de compra." };

  const items = datos.items.filter((i) => i.descripcion.trim());
  if (items.length === 0) {
    return { error: "Agrega al menos un ítem." };
  }

  const fecha = new Date(`${datos.fechaIso}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) return { error: "Fecha inválida." };

  const { subtotal, impuesto, total } = await calcularTotales(items);

  const [{ ultimo }] = await db
    .select({
      ultimo: sql<number>`coalesce(max(${compra.numero}), 0)`.mapWith(Number),
    })
    .from(compra)
    .where(eq(compra.tallerId, tallerId));

  const compraId = id();

  await db.insert(compra).values({
    id: compraId,
    tallerId,
    numero: ultimo + 1,
    proveedorId: datos.proveedorId || null,
    proveedorNombre: datos.proveedorId ? null : datos.proveedorNombre?.trim() || null,
    fecha,
    estado: datos.estado,
    folio: datos.folio?.trim() || null,
    notas: datos.notas?.trim() || null,
    subtotal,
    impuesto,
    total,
  });

  // "Producto nuevo" crea el repuesto antes de poder referenciarlo en
  // la línea de la compra.
  const parteIdPorLinea = new Map<number, string>();
  for (let idx = 0; idx < items.length; idx++) {
    const linea = items[idx];
    if (linea.origen === "nuevo") {
      const nuevaParteId = id();
      await db.insert(parte).values({
        id: nuevaParteId,
        tallerId,
        nombre: linea.descripcion.trim(),
        stock: Math.max(1, Math.round(linea.cantidad)),
        costo: Math.round(linea.costoUnitario),
        precio: 0,
      });
      parteIdPorLinea.set(idx, nuevaParteId);
    } else if (linea.origen === "inventario" && linea.parteId) {
      await db
        .update(parte)
        .set({
          stock: sql`${parte.stock} + ${Math.max(1, Math.round(linea.cantidad))}`,
          updatedAt: new Date(),
        })
        .where(and(eq(parte.id, linea.parteId), eq(parte.tallerId, tallerId)));
    }
  }

  await db.insert(itemCompra).values(
    items.map((linea, idx) => ({
      id: id(),
      compraId,
      origen: linea.origen,
      parteId:
        linea.origen === "nuevo"
          ? (parteIdPorLinea.get(idx) ?? null)
          : linea.origen === "inventario"
            ? linea.parteId || null
            : null,
      descripcion: linea.descripcion.trim(),
      cantidad: Math.max(1, Math.round(linea.cantidad)),
      costoUnitario: Math.round(linea.costoUnitario),
    }))
  );

  // "Compra pagada" ya queda disponible como origen de movimiento en
  // el filtro de Caja — se genera el egreso solo si nace pagada.
  if (datos.estado === "pagada") {
    await db.insert(movimientoCaja).values({
      id: id(),
      tallerId,
      tipo: "egreso",
      monto: total,
      descripcion: `Compra C-${ultimo + 1}${datos.proveedorNombre ? ` · ${datos.proveedorNombre}` : ""}`,
      referencia: datos.folio || null,
      categoria: "compra",
      fecha,
    });
  }

  revalidatePath("/panel/compras");
  revalidatePath("/panel/inventario");
  revalidatePath("/panel/caja");
  return { ok: true, id: compraId, numero: ultimo + 1 };
}

export async function cambiarEstadoCompra(compraId: string, estado: EstadoCompra) {
  if (!(await tienePlan("impresionOrden"))) {
    return { error: "Esta función es del Plan Serviteca." };
  }

  const tallerId = await tallerActual();

  const [actual] = await db
    .select({
      estado: compra.estado,
      total: compra.total,
      numero: compra.numero,
      folio: compra.folio,
      proveedorNombre: compra.proveedorNombre,
      fecha: compra.fecha,
    })
    .from(compra)
    .where(and(eq(compra.id, compraId), eq(compra.tallerId, tallerId)))
    .limit(1);

  if (!actual) return { error: "Compra no encontrada." };
  if (actual.estado === estado) return { ok: true };

  await db
    .update(compra)
    .set({ estado, updatedAt: new Date() })
    .where(eq(compra.id, compraId));

  // Pasa a pagada desde otro estado → genera el egreso en Caja.
  if (estado === "pagada" && actual.estado !== "pagada") {
    await db.insert(movimientoCaja).values({
      id: id(),
      tallerId,
      tipo: "egreso",
      monto: actual.total,
      descripcion: `Compra C-${actual.numero}${actual.proveedorNombre ? ` · ${actual.proveedorNombre}` : ""}`,
      referencia: actual.folio || null,
      categoria: "compra",
      fecha: new Date(),
    });
  }

  revalidatePath("/panel/compras");
  revalidatePath("/panel/caja");
  return { ok: true };
}

export async function anularCompra(compraId: string) {
  return cambiarEstadoCompra(compraId, "anulada");
}
