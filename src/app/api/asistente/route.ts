import { NextResponse } from "next/server";
import { headers } from "next/headers";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { buscarVehiculos, fichaVehiculo } from "@/app/panel/historial/acciones";
import { listarVehiculos } from "@/app/panel/vehiculos/acciones";
import { listarOrdenes } from "@/app/panel/ordenes/acciones";
import { listarDeudas } from "@/app/panel/pagos/acciones";
import { listarPropietarios } from "@/app/panel/propietarios/acciones";
import { pesos, fecha as formatoFecha } from "@/lib/formato";

/**
 * Preguntas por voz sobre datos que ya existen — "cuánto debe la BXFS19",
 * "cuándo vino por última vez el Yaris de Rosa". Solo lectura: la IA
 * nunca inserta ni modifica nada, solo llama a las mismas consultas que
 * ya usa el buscador de patentes, que ya filtran por tallerId.
 */

const HERRAMIENTAS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "buscar_vehiculo",
      description:
        "Busca vehículos por patente, marca, modelo o nombre del dueño. " +
        "Si encuentra uno solo, ya devuelve su ficha completa (kilometraje, " +
        "color, motor, VIN, deuda, últimos trabajos): no hace falta llamar " +
        "a ficha_vehiculo después.",
      parameters: {
        type: "object",
        properties: {
          consulta: {
            type: "string",
            description: "Patente, marca, modelo o nombre del dueño a buscar",
          },
        },
        required: ["consulta"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ficha_vehiculo",
      description:
        "Trae la ficha completa de un vehículo: datos, visitas, cuánto ha gastado, cuánto debe. Requiere el id que devuelve buscar_vehiculo.",
      parameters: {
        type: "object",
        properties: {
          vehiculoId: { type: "string" },
        },
        required: ["vehiculoId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_vehiculos",
      description:
        "Todos los autos registrados en el taller. Úsala cuando pregunten " +
        "'qué autos tengo', 'cuántos vehículos hay' o pidan el listado " +
        "completo, sin un término de búsqueda.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_ordenes",
      description:
        "Todas las órdenes de trabajo del taller con su estado (ingresado, " +
        "en proceso, esperando repuesto, terminado, entregado). Úsala para " +
        "'qué trabajos tengo', 'qué autos están en el taller', 'qué hay " +
        "pendiente'.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_deudas",
      description:
        "Los trabajos que quedaron sin pagar del todo, con cuánto debe cada " +
        "uno. Úsala para 'quién me debe', 'cuánto me deben', 'qué fiados " +
        "tengo'.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_propietarios",
      description:
        "Los dueños registrados, con cuántos autos tiene cada uno y cuánto " +
        "debe. Úsala para 'qué clientes tengo', 'cuántos clientes hay'.",
      parameters: { type: "object", properties: {} },
    },
  },
];

async function armarFicha(vehiculoId: string) {
  const ficha = await fichaVehiculo(vehiculoId);
  if (!ficha) return { error: "No se encontró ese vehículo." };

  return {
    patente: ficha.datos.patente,
    marca: ficha.datos.marca,
    modelo: ficha.datos.modelo,
    anio: ficha.datos.anio,
    color: ficha.datos.color,
    tipo: ficha.datos.tipo,
    motor: ficha.datos.motor,
    vin: ficha.datos.vin,
    procedencia: ficha.datos.procedencia,
    propietario: ficha.datos.propietario,
    telefono: ficha.datos.telefono,
    copropietario: ficha.datos.copropietario,
    kilometrajeInicial: ficha.datos.kilometrajeInicial,
    notas: ficha.datos.notas,
    visitas: ficha.trabajos.length,
    totalGastado: ficha.gastado !== null ? pesos(ficha.gastado) : null,
    deudaActual: ficha.debe !== null ? pesos(ficha.debe) : null,
    nota: ficha.verMontos
      ? undefined
      : "Este vehículo es de otro taller: lo que cobró es secreto. No menciones plata, solo qué se hizo.",
    trabajos: ficha.trabajos.map((t) => ({
      fecha: t.fecha,
      kilometraje: t.kilometraje,
      estado: t.estado,
      sintoma: t.sintoma,
      descripcion: t.descripcion,
      total: t.total !== null ? pesos(t.total) : null,
      estadoPago: t.estadoPago,
      taller: t.esPropio ? null : t.tallerNombre,
    })),
  };
}

async function ejecutar(nombre: string, args: Record<string, string>) {
  if (nombre === "buscar_vehiculo") {
    const resultados = await buscarVehiculos(args.consulta);

    if (resultados.length === 0) return { encontrados: 0 };

    // Con un solo resultado se devuelve la ficha completa: si no, el
    // modelo se queda con estos campos sueltos y responde "no tengo ese
    // dato" en vez de dar el segundo paso a ficha_vehiculo.
    if (resultados.length === 1) {
      return { encontrados: 1, vehiculo: await armarFicha(resultados[0].id) };
    }

    return {
      encontrados: resultados.length,
      vehiculos: resultados.map((v) => ({
        id: v.id,
        patente: v.patente,
        marca: v.marca,
        modelo: v.modelo,
        anio: v.anio,
        propietario: v.propietario,
        visitas: v.visitas,
      })),
    };
  }

  if (nombre === "ficha_vehiculo") {
    return armarFicha(args.vehiculoId);
  }

  if (nombre === "listar_vehiculos") {
    const autos = await listarVehiculos();
    return {
      cuantos: autos.length,
      vehiculos: autos.map((v) => ({
        patente: v.patente,
        marca: v.marca,
        modelo: v.modelo,
        anio: v.anio,
        color: v.color,
        tipo: v.tipo,
        kilometraje: v.kilometrajeInicial,
        propietario: v.propietario,
      })),
    };
  }

  if (nombre === "listar_ordenes") {
    const ordenes = await listarOrdenes();
    return {
      cuantas: ordenes.length,
      ordenes: ordenes.map((o) => ({
        numero: `OT-${o.numero}`,
        patente: o.patente,
        marca: o.marca,
        modelo: o.modelo,
        propietario: o.propietario,
        estado: o.estado,
        sintoma: o.sintoma,
        descripcion: o.descripcion,
        fecha: formatoFecha(o.fecha),
        total: o.total > 0 ? pesos(o.total) : null,
        estadoPago: o.estadoPago,
      })),
    };
  }

  if (nombre === "listar_deudas") {
    const deudas = await listarDeudas();
    const total = deudas.reduce((s, d) => s + (d.total - d.abonado), 0);
    return {
      cuantas: deudas.length,
      totalPorCobrar: pesos(total),
      deudas: deudas.map((d) => ({
        patente: d.patente,
        propietario: d.propietario,
        descripcion: d.descripcion,
        debe: pesos(d.total - d.abonado),
        fecha: formatoFecha(d.fecha),
      })),
    };
  }

  if (nombre === "listar_propietarios") {
    const duenos = await listarPropietarios();
    return {
      cuantos: duenos.length,
      propietarios: duenos.map((p) => ({
        nombre: p.nombre,
        telefono: p.telefono,
        autos: p.autos,
        debe: p.deuda > 0 ? pesos(p.deuda) : null,
      })),
    };
  }

  return { error: "Herramienta desconocida." };
}

export async function POST(req: Request) {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) {
    return NextResponse.json({ error: "Sin sesión." }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Falta configurar el asistente." },
      { status: 503 }
    );
  }

  const cuerpo = await req.json();
  // Acepta el historial de la conversación para que el asistente entienda
  // "¿y cuánto debe?" después de haber preguntado por un auto.
  const conversacion: { rol: string; texto: string }[] = Array.isArray(
    cuerpo.conversacion
  )
    ? cuerpo.conversacion
    : cuerpo.pregunta
      ? [{ rol: "usuario", texto: cuerpo.pregunta }]
      : [];

  if (conversacion.length === 0) {
    return NextResponse.json({ error: "Falta la pregunta." }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const mensajes: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "Eres el asistente de un taller mecánico chileno. Respondes preguntas " +
        "sobre vehículos, historial, órdenes y deudas usando las herramientas " +
        "disponibles. Nunca inventes datos que no vengan de una herramienta. " +
        "Si te piden un listado ('qué autos tengo', 'quién me debe', 'qué " +
        "trabajos hay'), usa las herramientas de listar en vez de decir que " +
        "no puedes: sí tienes acceso a todo el taller. Cuando el listado sea " +
        "largo, di el total primero y después enuméralos hablando, en frases " +
        "corridas separadas por punto seguido — nunca con números al " +
        "principio de línea ni viñetas, porque esto se escucha en voz alta " +
        "y queda ilegible. Si buscar_vehiculo devuelve varios resultados, pide precisar " +
        "la patente en vez de adivinar cuál. Responde corto y directo, sin " +
        "rodeos — el mecánico lo está escuchando mientras trabaja, y tu " +
        "respuesta también se lee en voz alta. Por eso: nada de markdown, " +
        "listas con guiones ni asteriscos; frases habladas. Los montos " +
        "dilos en palabras naturales ('cuarenta y cinco mil pesos'). " +
        "Si un trabajo trae 'taller' con un nombre, dilo explícitamente " +
        "('en [taller]...') porque no lo hizo el taller que pregunta. Si " +
        "un monto viene null, o si viene 'nota', no des cifras — di que " +
        "lo que cobró el otro taller no se comparte. Las patentes siempre " +
        "se deletrean, letra por letra y dígito por dígito, nunca como un " +
        "número compuesto — por ejemplo 'JHVK52' se dice 'jota, hache, ve, " +
        "ka, cinco, dos' y '4422' se dice 'cuatro, cuatro, dos, dos', " +
        "nunca 'cuarenta y cuatro veintidós' ni agrupando los dígitos.",
    },
    ...conversacion.map((m) => ({
      role: m.rol === "usuario" ? ("user" as const) : ("assistant" as const),
      content: m.texto,
    })),
  ];

  // Hasta 4 vueltas de herramientas por si necesita buscar y luego
  // consultar la ficha, sin dejar que quede dando vueltas indefinido.
  for (let vuelta = 0; vuelta < 4; vuelta++) {
    const respuesta = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: mensajes,
      tools: HERRAMIENTAS,
    });

    const mensaje = respuesta.choices[0].message;
    mensajes.push(mensaje);

    if (!mensaje.tool_calls?.length) {
      return NextResponse.json({ respuesta: mensaje.content ?? "" });
    }

    for (const llamada of mensaje.tool_calls) {
      if (llamada.type !== "function") continue;
      const args = JSON.parse(llamada.function.arguments || "{}");
      const resultado = await ejecutar(llamada.function.name, args);

      mensajes.push({
        role: "tool",
        tool_call_id: llamada.id,
        content: JSON.stringify(resultado),
      });
    }
  }

  return NextResponse.json(
    { error: "No se pudo responder la pregunta." },
    { status: 502 }
  );
}
