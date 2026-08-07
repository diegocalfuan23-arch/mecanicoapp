import { NextResponse } from "next/server";
import { headers } from "next/headers";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { buscarVehiculos, fichaVehiculo } from "@/app/panel/historial/acciones";
import { pesos } from "@/lib/formato";

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
        "Busca vehículos por patente, marca, modelo o nombre del dueño. Úsala primero si no tienes el id del vehículo.",
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
];

async function ejecutar(nombre: string, args: Record<string, string>) {
  if (nombre === "buscar_vehiculo") {
    const resultados = await buscarVehiculos(args.consulta);
    return resultados.map((v) => ({
      id: v.id,
      patente: v.patente,
      marca: v.marca,
      modelo: v.modelo,
      anio: v.anio,
      propietario: v.propietario,
      visitas: v.visitas,
    }));
  }

  if (nombre === "ficha_vehiculo") {
    const ficha = await fichaVehiculo(args.vehiculoId);
    if (!ficha) return { error: "No se encontró ese vehículo." };

    return {
      patente: ficha.datos.patente,
      marca: ficha.datos.marca,
      modelo: ficha.datos.modelo,
      propietario: ficha.datos.propietario,
      kilometrajeInicial: ficha.datos.kilometrajeInicial,
      visitas: ficha.trabajos.length,
      totalGastado: pesos(ficha.gastado),
      deudaActual: pesos(ficha.debe),
      ultimosTrabajos: ficha.trabajos.slice(0, 5).map((t) => ({
        fecha: t.fecha,
        sintoma: t.sintoma,
        descripcion: t.descripcion,
        total: pesos(t.total),
        estadoPago: t.estadoPago,
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

  const { pregunta } = await req.json();
  if (!pregunta || typeof pregunta !== "string") {
    return NextResponse.json({ error: "Falta la pregunta." }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const mensajes: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "Eres el asistente de un taller mecánico chileno. Respondes preguntas " +
        "cortas sobre vehículos, historial y deudas usando las herramientas " +
        "disponibles. Nunca inventes datos que no vengan de una herramienta. " +
        "Si buscar_vehiculo devuelve más de un resultado, pide precisar la " +
        "patente en vez de adivinar cuál. Responde en 1-2 frases, directo, " +
        "sin rodeos — el mecánico lo está escuchando mientras trabaja.",
    },
    { role: "user", content: pregunta },
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
