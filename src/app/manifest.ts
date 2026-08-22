import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MecanicoApp — El cuaderno del taller",
    short_name: "MecanicoApp",
    description:
      "Historial por patente, control de repuestos, fiados al día y recordatorios por WhatsApp.",
    start_url: "/panel",
    scope: "/",
    display: "standalone",
    background_color: "#100c0a",
    theme_color: "#100c0a",
    lang: "es-CL",
    icons: [
      {
        src: "/icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
