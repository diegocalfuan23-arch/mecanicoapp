import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/lib/auth";

const f = createUploadthing();

export const rutasSubida = {
  /** Fotos del vehículo al ingresar: costados y tablero. */
  fotoVehiculo: f({
    // 12: los cuatro costados, el tablero y detalles de golpes previos,
    // con margen para repetir alguna que salió movida.
    image: { maxFileSize: "8MB", maxFileCount: 12 },
  })
    // Las cabeceras salen del `req` que entrega uploadthing, no de
    // headers() de Next: en este contexto esa función no siempre trae
    // la cookie de sesión y getSession devolvía null aun estando dentro.
    .middleware(async ({ req }) => {
      const sesion = await auth.api.getSession({ headers: req.headers });
      if (!sesion) throw new UploadThingError("Sin sesión.");
      return { tallerId: sesion.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),

  /** Logo del taller: sale en el encabezado de la orden en pantalla e impresa. */
  logoTaller: f({
    image: { maxFileSize: "2MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const sesion = await auth.api.getSession({ headers: req.headers });
      if (!sesion) throw new UploadThingError("Sin sesión.");
      return { tallerId: sesion.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type RutasSubida = typeof rutasSubida;
