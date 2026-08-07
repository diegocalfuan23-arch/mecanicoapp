import { ChatAsistente } from "@/components/chat-asistente";
import { listarConversaciones } from "./acciones";

export default async function Asistente() {
  const conversaciones = await listarConversaciones();

  return <ChatAsistente conversaciones={conversaciones} />;
}
