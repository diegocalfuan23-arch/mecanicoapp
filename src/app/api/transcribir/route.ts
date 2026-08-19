import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import OpenAI from "openai";

export async function POST(req: Request) {
  const sesion = await auth.api.getSession({ headers: await headers() });
  if (!sesion) {
    return NextResponse.json({ error: "Sin sesión." }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "Falta configurar la transcripción." },
      { status: 503 }
    );
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // @types/react declara un stub `interface FormData {}` vacío para React
  // Native que aquí se fusiona con el de DOM y tapa sus métodos — el cast
  // recupera el FormData real que devuelve el runtime.
  const forma = (await req.formData()) as unknown as {
    get(campo: string): FormDataEntryValue | null;
  };
  const audio = forma.get("audio");

  if (!(audio instanceof File)) {
    return NextResponse.json({ error: "Falta el audio." }, { status: 400 });
  }

  try {
    const resultado = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      language: "es",
      // Sin esto Whisper a veces "traduce" jerga de taller a un
      // español más formal en vez de transcribirla tal cual, y confunde
      // pares que suenan parecido (deuda/duda, fiado/hilado).
      prompt:
        "Taller mecánico en Chile. Términos: pastillas de freno, " +
        "amortiguadores, batería, correa, embrague, patente, kilometraje, " +
        "deuda, debe, fiado, abono, cobrar, cliente.",
    });

    return NextResponse.json({ texto: resultado.text });
  } catch {
    return NextResponse.json(
      { error: "No se pudo transcribir el audio." },
      { status: 502 }
    );
  }
}
