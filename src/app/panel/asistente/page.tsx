import { ChatAsistente } from "@/components/chat-asistente";

export default function Asistente() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold tracking-tight">Asistente</h1>
        <p className="mt-2 text-muted-foreground">
          Pregúntale por un auto sin soltar las herramientas. Habla o escribe,
          y te responde en voz alta.
        </p>
      </div>

      <ChatAsistente />
    </div>
  );
}
