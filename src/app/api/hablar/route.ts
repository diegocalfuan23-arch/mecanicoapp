import { NextResponse } from "next/server";
import { headers } from "next/headers";
import OpenAI from "openai";
import { auth } from "@/lib/auth";

/** Convierte la respuesta del asistente en audio para escucharla. */
export async function POST(req: Request) {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) {
    return NextResponse.json({ error: "Sin sesión." }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "Falta configurar." }, { status: 503 });
  }

  const { texto } = await req.json();
  if (!texto || typeof texto !== "string") {
    return NextResponse.json({ error: "Falta el texto." }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const habla = await openai.audio.speech.create({
    model: "gpt-4o-mini-tts",
    voice: "onyx",
    input: texto.slice(0, 2000),
    instructions:
      "Habla en español chileno neutro, tono tranquilo de taller, ritmo normal.",
  });

  return new Response(await habla.arrayBuffer(), {
    headers: { "Content-Type": "audio/mpeg" },
  });
}
