import type { MetadataRoute } from "next";

const SITIO = "https://mecanicoapp.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // El panel es privado (requiere sesión) y las órdenes
      // imprimibles no aportan nada indexadas.
      disallow: ["/panel", "/imprimir", "/api"],
    },
    sitemap: `${SITIO}/sitemap.xml`,
  };
}
