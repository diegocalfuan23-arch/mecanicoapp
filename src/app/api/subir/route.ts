import { createRouteHandler } from "uploadthing/next";
import { rutasSubida } from "./core";

export const { GET, POST } = createRouteHandler({
  router: rutasSubida,
  config: {
    // Explícito en vez de confiar en que lo lea del entorno: si falta,
    // el error dice qué pasa en vez de fallar de forma opaca.
    token: process.env.UPLOADTHING_TOKEN,
  },
});
