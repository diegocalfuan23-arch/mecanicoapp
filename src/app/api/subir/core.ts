import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const f = createUploadthing();

export const rutasSubida = {
  /** Fotos del vehículo al ingresar: costados y tablero. */
  fotoVehiculo: f({
    // 12: los cuatro costados, el tablero y detalles de golpes previos,
    // con margen para repetir alguna que salió movida.
    image: { maxFileSize: "8MB", maxFileCount: 12 },
  })
    .middleware(async () => {
      const sesion = await auth.api.getSession({ headers: await headers() });
      if (!sesion) throw new UploadThingError("Sin sesión.");
      return { tallerId: sesion.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl };
    }),
} satisfies FileRouter;

export type RutasSubida = typeof rutasSubida;
