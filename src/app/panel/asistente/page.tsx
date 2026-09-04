import { redirect } from "next/navigation";

// El Asistente ya no es una página propia — vive en el panel flotante,
// accesible desde el ícono en el header de cualquier pantalla. Esta
// ruta solo queda para no romper links guardados de antes.
export default function Asistente() {
  redirect("/panel");
}
