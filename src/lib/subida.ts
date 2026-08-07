import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react";
import type { RutasSubida } from "@/app/api/subir/core";

export const BotonSubida = generateUploadButton<RutasSubida>();
export const ZonaSubida = generateUploadDropzone<RutasSubida>();
