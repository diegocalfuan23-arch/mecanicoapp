import { generateReactHelpers } from "@uploadthing/react";
import type { RutasSubida } from "@/app/api/subir/core";

/** La subida se controla a mano: cámara seguida, borrar, reintentar. */
export const { useUploadThing } = generateReactHelpers<RutasSubida>();
