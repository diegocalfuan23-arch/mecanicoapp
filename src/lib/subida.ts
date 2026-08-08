import { generateReactHelpers } from "@uploadthing/react";
import type { RutasSubida } from "@/app/api/subir/core";

/**
 * La subida se controla a mano: cámara seguida, borrar, reintentar.
 *
 * `url` es obligatorio porque el endpoint vive en /api/subir y no en el
 * /api/uploadthing que el cliente asume por defecto: sin esto pedía a
 * una ruta inexistente y fallaba con "Failed to parse response".
 */
export const { useUploadThing } = generateReactHelpers<RutasSubida>({
  url: "/api/subir",
});
