"use server";

import { revalidatePath } from "next/cache";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { vehiculo, cliente, trabajo } from "@/db/schema";
import { tallerActual, tienePlan } from "@/lib/taller";
import { siguienteNumeroCliente } from "@/app/panel/propietarios/acciones";
import { TIPOS_VEHICULO } from "@/lib/tipos-vehiculo";

function id() {
  return crypto.randomUUID();
}

export type DatosVehiculo = {
  patente: string;
  vin?: string;
  marca?: string;
  modelo?: string;
  anio?: string;
  color?: string;
  tipo?: string;
  motor?: string;
  cilindrada?: string;
  movil?: string;
  ejes?: string;
  procedencia?: string;
  kilometrajeInicial?: string;
  propietarioNombre?: string;
  propietarioTelefono?: string;
  copropietario?: string;
  copropietarioTelefono?: string;
  primeraVez: boolean;
  comparteHistorial: boolean;
  notas?: string;
};

/**
 * Autocompleta datos del vehículo por patente — Plan Serviteca.
 * Usa GetAPI (getapi.cl), con key de prueba mientras se evalúa si
 * conviene un plan pago. No guarda nada: solo trae los datos para
 * que el mecánico los revise antes de registrar el vehículo.
 */
export async function buscarPorPatente(patente: string) {
  // El botón solo se ve con Plan Serviteca, pero una server action es
  // invocable igual sin pasar por la UI — sin este chequeo, cualquiera
  // podría gastar la key compartida (3 consultas/min en la demo).
  if (!(await tienePlan("impresionOrden"))) {
    return { error: "Esta función es del Plan Serviteca." };
  }

  const key = process.env.GETAPI_KEY;
  if (!key) return { error: "Búsqueda por patente no configurada." };

  const limpia = patente.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (!limpia) return { error: "Escribe una patente." };

  let res: Response;
  try {
    res = await fetch(
      `https://chile.getapi.cl/v1/vehicles/plate/${limpia}`,
      { headers: { "X-Api-Key": key } }
    );
  } catch {
    return { error: "No se pudo conectar con el servicio de patentes." };
  }

  if (res.status === 404) {
    return { error: "No se encontró esa patente." };
  }
  if (res.status === 429) {
    return {
      error: "Se alcanzó el límite de consultas por minuto. Espera un momento.",
    };
  }
  if (!res.ok) {
    return { error: "El servicio de patentes no respondió. Intenta de nuevo." };
  }

  const cuerpo = await res.json();
  const d = cuerpo?.data;
  if (!d) return { error: "No se encontró esa patente." };

  // "Motor" en el formulario es texto libre tipo "2.4 diésel"
  // (cilindrada + combustible), no el número de serie del motor —
  // se arma igual que el mecánico lo escribiría a mano.
  const motor = [d.engine, d.fuel?.toLowerCase()].filter(Boolean).join(" ");

  // El tipo de GetAPI ("STATION WAGON") rara vez calza tal cual con
  // la lista fija del formulario ("Station wagon") — se intenta un
  // match simple; sin coincidencia clara, queda vacío en vez de
  // forzar un tipo incorrecto (el mecánico lo elige a mano).
  const tipoExterno: string | undefined = d.model?.typeVehicle?.name;
  const tipo = tipoExterno
    ? TIPOS_VEHICULO.find(
        (t) => t.toLowerCase() === tipoExterno.toLowerCase()
      )
    : undefined;

  return {
    ok: true as const,
    datos: {
      vin: d.vinNumber ?? "",
      marca: d.model?.brand?.name ?? "",
      modelo: d.model?.name ?? "",
      anio: d.year ? String(d.year) : "",
      color: d.color ?? "",
      motor,
      cilindrada: d.engine ?? "",
      tipo: tipo ?? "",
      kilometrajeInicial: d.mileage != null ? String(d.mileage) : "",
      // No traído a propósito: propietario/RUT no existen en
      // registros públicos sin verificación de identidad.
    },
  };
}

export async function listarVehiculos() {
  const tallerId = await tallerActual();

  return db
    .select({
      id: vehiculo.id,
      patente: vehiculo.patente,
      vin: vehiculo.vin,
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      color: vehiculo.color,
      tipo: vehiculo.tipo,
      motor: vehiculo.motor,
      cilindrada: vehiculo.cilindrada,
      movil: vehiculo.movil,
      ejes: vehiculo.ejes,
      procedencia: vehiculo.procedencia,
      kilometrajeInicial: vehiculo.kilometrajeInicial,
      copropietario: vehiculo.copropietario,
      copropietarioTelefono: vehiculo.copropietarioTelefono,
      notas: vehiculo.notas,
      primeraVez: vehiculo.primeraVez,
      comparteHistorial: vehiculo.comparteHistorial,
      propietario: cliente.nombre,
      propietarioTelefono: cliente.telefono,
      propietarioEmail: cliente.email,
      propietarioDireccion: cliente.direccion,
      propietarioComuna: cliente.comuna,
      propietarioCiudad: cliente.ciudad,
      esEmpresa: cliente.esEmpresa,
      empresa: cliente.empresa,
      empresaRut: cliente.empresaRut,
    })
    .from(vehiculo)
    .leftJoin(cliente, eq(vehiculo.propietarioId, cliente.id))
    .where(eq(vehiculo.tallerId, tallerId))
    .orderBy(desc(vehiculo.createdAt));
}

export async function actualizarVehiculo(
  vehiculoId: string,
  datos: DatosVehiculo
) {
  const tallerId = await tallerActual();
  const patente = datos.patente.trim().toUpperCase();

  const [actual] = await db
    .select({ id: vehiculo.id })
    .from(vehiculo)
    .where(and(eq(vehiculo.id, vehiculoId), eq(vehiculo.tallerId, tallerId)))
    .limit(1);

  if (!actual) return { error: "No se encontró ese vehículo." };

  // Otra ficha del taller ya puede tener esa patente.
  const repetida = await db
    .select({ id: vehiculo.id })
    .from(vehiculo)
    .where(and(eq(vehiculo.tallerId, tallerId), eq(vehiculo.patente, patente)))
    .limit(2);

  if (repetida.some((v) => v.id !== vehiculoId)) {
    return { error: `La patente ${patente} ya está en otra ficha.` };
  }

  let propietarioId: string | null = null;
  const nombre = datos.propietarioNombre?.trim();

  if (nombre) {
    const existente = await db
      .select({ id: cliente.id })
      .from(cliente)
      .where(and(eq(cliente.tallerId, tallerId), eq(cliente.nombre, nombre)))
      .limit(1);

    // Solo el teléfono se toca desde acá: email/dirección/empresa son
    // datos del cliente que se editan en Propietarios, para no
    // pisarlos sin querer si este formulario no los muestra.
    const datosCliente = {
      telefono: datos.propietarioTelefono?.trim() || null,
    };

    if (existente.length) {
      propietarioId = existente[0].id;
      await db
        .update(cliente)
        .set({ ...datosCliente, updatedAt: new Date() })
        .where(eq(cliente.id, propietarioId));
    } else {
      propietarioId = id();
      await db.insert(cliente).values({
        id: propietarioId,
        tallerId,
        numero: await siguienteNumeroCliente(tallerId),
        nombre,
        ...datosCliente,
      });
    }
  }

  await db
    .update(vehiculo)
    .set({
      patente,
      vin: datos.vin?.trim().toUpperCase() || null,
      marca: datos.marca?.trim() || null,
      modelo: datos.modelo?.trim() || null,
      anio: datos.anio ? Number(datos.anio) : null,
      color: datos.color?.trim() || null,
      tipo: datos.tipo || null,
      motor: datos.motor?.trim() || null,
      cilindrada: datos.cilindrada?.trim() || null,
      movil: datos.movil?.trim() || null,
      ejes: datos.ejes ? Number(datos.ejes) : null,
      procedencia: datos.procedencia || null,
      kilometrajeInicial: datos.kilometrajeInicial
        ? Number(datos.kilometrajeInicial)
        : null,
      propietarioId,
      copropietario: datos.copropietario?.trim() || null,
      copropietarioTelefono: datos.copropietarioTelefono?.trim() || null,
      primeraVez: datos.primeraVez,
      comparteHistorial: datos.comparteHistorial,
      consentimientoFecha: datos.comparteHistorial ? new Date() : null,
      notas: datos.notas?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(vehiculo.id, vehiculoId));

  revalidatePath("/panel/vehiculos");
  revalidatePath("/panel/historial");
  return { ok: true };
}

/**
 * Borrar arrastra las ordenes en cascada, asi que un vehiculo con
 * historial no se elimina: ese historial es el corazon de la app.
 */
export async function eliminarVehiculo(vehiculoId: string) {
  const tallerId = await tallerActual();

  const [actual] = await db
    .select({ patente: vehiculo.patente })
    .from(vehiculo)
    .where(and(eq(vehiculo.id, vehiculoId), eq(vehiculo.tallerId, tallerId)))
    .limit(1);

  if (!actual) return { error: "No se encontró ese vehículo." };

  const [conteo] = await db
    .select({ cuantos: sql<number>`count(*)`.mapWith(Number) })
    .from(trabajo)
    .where(eq(trabajo.vehiculoId, vehiculoId));

  if (conteo.cuantos > 0) {
    return {
      error: `${actual.patente} tiene ${conteo.cuantos} ${
        conteo.cuantos === 1 ? "trabajo registrado" : "trabajos registrados"
      }. Si lo borras se pierde su historial.`,
    };
  }

  await db.delete(vehiculo).where(eq(vehiculo.id, vehiculoId));

  revalidatePath("/panel/vehiculos");
  revalidatePath("/panel/historial");
  return { ok: true };
}

export async function guardarVehiculo(datos: DatosVehiculo) {
  const tallerId = await tallerActual();
  const patente = datos.patente.trim().toUpperCase();

  const yaExiste = await db
    .select({ id: vehiculo.id })
    .from(vehiculo)
    .where(and(eq(vehiculo.tallerId, tallerId), eq(vehiculo.patente, patente)))
    .limit(1);

  if (yaExiste.length) {
    return { error: `La patente ${patente} ya está registrada.` };
  }

  // El propietario tiene ficha propia: se reutiliza si ya existe por nombre.
  let propietarioId: string | null = null;
  const nombre = datos.propietarioNombre?.trim();

  if (nombre) {
    const existente = await db
      .select({ id: cliente.id })
      .from(cliente)
      .where(and(eq(cliente.tallerId, tallerId), eq(cliente.nombre, nombre)))
      .limit(1);

    // Solo el teléfono se toca desde acá: email/dirección/empresa son
    // datos del cliente que se editan en Propietarios, para no
    // pisarlos sin querer si este formulario no los muestra.
    const datosCliente = {
      telefono: datos.propietarioTelefono?.trim() || null,
    };

    if (existente.length) {
      propietarioId = existente[0].id;
      await db
        .update(cliente)
        .set({ ...datosCliente, updatedAt: new Date() })
        .where(eq(cliente.id, propietarioId));
    } else {
      propietarioId = id();
      await db.insert(cliente).values({
        id: propietarioId,
        tallerId,
        numero: await siguienteNumeroCliente(tallerId),
        nombre,
        ...datosCliente,
      });
    }
  }

  await db.insert(vehiculo).values({
    id: id(),
    tallerId,
    patente,
    vin: datos.vin?.trim().toUpperCase() || null,
    marca: datos.marca?.trim() || null,
    modelo: datos.modelo?.trim() || null,
    anio: datos.anio ? Number(datos.anio) : null,
    color: datos.color?.trim() || null,
    tipo: datos.tipo || null,
    motor: datos.motor?.trim() || null,
    cilindrada: datos.cilindrada?.trim() || null,
    movil: datos.movil?.trim() || null,
    ejes: datos.ejes ? Number(datos.ejes) : null,
    procedencia: datos.procedencia || null,
    kilometrajeInicial: datos.kilometrajeInicial
      ? Number(datos.kilometrajeInicial)
      : null,
    propietarioId,
    copropietario: datos.copropietario?.trim() || null,
    copropietarioTelefono: datos.copropietarioTelefono?.trim() || null,
    primeraVez: datos.primeraVez,
    comparteHistorial: datos.comparteHistorial,
    consentimientoFecha: datos.comparteHistorial ? new Date() : null,
    notas: datos.notas?.trim() || null,
  });

  revalidatePath("/panel/vehiculos");
  return { ok: true };
}
