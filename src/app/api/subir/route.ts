import { createRouteHandler } from "uploadthing/next";
import { rutasSubida } from "./core";

export const { GET, POST } = createRouteHandler({
  router: rutasSubida,
});
