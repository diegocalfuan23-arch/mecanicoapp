import type { MetadataRoute } from "next";

const SITIO = "https://mecanicoapp.com";

// Solo páginas públicas e indexables — el panel, imprimir y la API
// quedan fuera (van en robots.ts como Disallow).
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITIO, changeFrequency: "weekly", priority: 1 },
    { url: `${SITIO}/registro`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITIO}/entrar`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITIO}/privacidad`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
