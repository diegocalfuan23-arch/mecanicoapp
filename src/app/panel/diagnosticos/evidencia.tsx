"use client";

import { useRef, useState } from "react";
import { useUploadThing } from "@/lib/subida";
import { Button } from "@/components/ui/button";

const MAX_FOTOS = 20;
const MAX_VIDEOS = 5;
const MAX_DOCUMENTOS = 3;

function useSubidaSimple(
  endpoint: "fotoDiagnostico" | "videoDiagnostico" | "documentoDiagnostico",
  archivos: string[],
  onCambio: (archivos: string[]) => void,
  onError?: (mensaje: string) => void
) {
  const [subiendo, setSubiendo] = useState(0);

  const { startUpload } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      onCambio([...archivos, ...res.map((r) => r.ufsUrl)]);
      setSubiendo(0);
    },
    onUploadError: (e) => {
      setSubiendo(0);
      onError?.(`No se pudo subir el archivo: ${e.message}`);
    },
  });

  async function recibir(lista: FileList | null, maximo: number) {
    const seleccionados = Array.from(lista ?? []);
    if (seleccionados.length === 0) return;

    const espacio = maximo - archivos.length;
    if (espacio <= 0) {
      onError?.(`Ya llegaste al máximo de ${maximo}.`);
      return;
    }

    const aSubir = seleccionados.slice(0, espacio);
    setSubiendo(aSubir.length);
    await startUpload(aSubir);
  }

  function quitar(url: string) {
    onCambio(archivos.filter((a) => a !== url));
  }

  return { subiendo, recibir, quitar };
}

/** Evidencia del diagnóstico: fotos, videos y documentos PDF —
 * mismo alcance que la referencia (Bujía). Cada tipo tiene su propio
 * endpoint de subida y su propio límite. */
export function Evidencia({
  fotos,
  onCambioFotos,
  videos,
  onCambioVideos,
  documentos,
  onCambioDocumentos,
  onError,
}: {
  fotos: string[];
  onCambioFotos: (fotos: string[]) => void;
  videos: string[];
  onCambioVideos: (videos: string[]) => void;
  documentos: string[];
  onCambioDocumentos: (documentos: string[]) => void;
  onError?: (mensaje: string) => void;
}) {
  const inputFotos = useRef<HTMLInputElement>(null);
  const inputVideos = useRef<HTMLInputElement>(null);
  const inputDocumentos = useRef<HTMLInputElement>(null);

  const {
    subiendo: subiendoFotos,
    recibir: recibirFotos,
    quitar: quitarFoto,
  } = useSubidaSimple("fotoDiagnostico", fotos, onCambioFotos, onError);
  const {
    subiendo: subiendoVideos,
    recibir: recibirVideos,
    quitar: quitarVideo,
  } = useSubidaSimple("videoDiagnostico", videos, onCambioVideos, onError);
  const {
    subiendo: subiendoDocumentos,
    recibir: recibirDocumentos,
    quitar: quitarDocumento,
  } = useSubidaSimple("documentoDiagnostico", documentos, onCambioDocumentos, onError);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[13px] font-medium">Fotos</span>
          <span className="text-[12px] text-muted-foreground">
            {fotos.length} / {MAX_FOTOS}
          </span>
        </div>
        {(fotos.length > 0 || subiendoFotos > 0) && (
          <div className="mb-2 flex flex-wrap gap-2">
            {fotos.map((url) => (
              <div key={url} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="Evidencia del diagnóstico"
                  className="size-16 rounded-lg border border-border object-cover"
                />
                <button
                  type="button"
                  onClick={() => quitarFoto(url)}
                  aria-label="Quitar esta foto"
                  className="absolute -top-2 -right-2 rounded-full border border-border bg-card p-1 text-muted-foreground transition-colors hover:text-destructive"
                >
                  <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
                    <path
                      d="M6 6l8 8M14 6l-8 8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            ))}
            {Array.from({ length: subiendoFotos }).map((_, i) => (
              <div
                key={`subiendo-foto-${i}`}
                className="flex size-16 animate-pulse items-center justify-center rounded-lg border border-dashed border-border text-[12px] text-muted-foreground"
              >
                …
              </div>
            ))}
          </div>
        )}
        <input
          ref={inputFotos}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            recibirFotos(e.target.files, MAX_FOTOS);
            e.target.value = "";
          }}
          className="hidden"
        />
        <Button
          variant="outline"
          type="button"
          onClick={() => inputFotos.current?.click()}
          disabled={fotos.length >= MAX_FOTOS || subiendoFotos > 0}
        >
          {subiendoFotos > 0 ? "Subiendo…" : "Subir fotos"}
        </Button>
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[13px] font-medium">Videos</span>
          <span className="text-[12px] text-muted-foreground">
            {videos.length} / {MAX_VIDEOS}
          </span>
        </div>
        {videos.length > 0 && (
          <ul className="mb-2 flex flex-col gap-1">
            {videos.map((url) => (
              <li
                key={url}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[13px]"
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 truncate text-acento hover:underline"
                >
                  {url.split("/").pop()}
                </a>
                <button
                  type="button"
                  onClick={() => quitarVideo(url)}
                  aria-label="Quitar este video"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
                    <path
                      d="M6 6l8 8M14 6l-8 8"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          ref={inputVideos}
          type="file"
          accept="video/*"
          multiple
          onChange={(e) => {
            recibirVideos(e.target.files, MAX_VIDEOS);
            e.target.value = "";
          }}
          className="hidden"
        />
        <Button
          variant="outline"
          type="button"
          onClick={() => inputVideos.current?.click()}
          disabled={videos.length >= MAX_VIDEOS || subiendoVideos > 0}
        >
          {subiendoVideos > 0 ? "Subiendo…" : "Subir videos"}
        </Button>
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[13px] font-medium">Documentos PDF</span>
          <span className="text-[12px] text-muted-foreground">
            {documentos.length} / {MAX_DOCUMENTOS}
          </span>
        </div>
        {documentos.length > 0 && (
          <ul className="mb-2 flex flex-col gap-1">
            {documentos.map((url) => (
              <li
                key={url}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[13px]"
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 truncate text-acento hover:underline"
                >
                  {url.split("/").pop()}
                </a>
                <button
                  type="button"
                  onClick={() => quitarDocumento(url)}
                  aria-label="Quitar este documento"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
                    <path
                      d="M6 6l8 8M14 6l-8 8"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          ref={inputDocumentos}
          type="file"
          accept="application/pdf"
          multiple
          onChange={(e) => {
            recibirDocumentos(e.target.files, MAX_DOCUMENTOS);
            e.target.value = "";
          }}
          className="hidden"
        />
        <Button
          variant="outline"
          type="button"
          onClick={() => inputDocumentos.current?.click()}
          disabled={documentos.length >= MAX_DOCUMENTOS || subiendoDocumentos > 0}
        >
          {subiendoDocumentos > 0 ? "Subiendo…" : "Subir PDF"}
        </Button>
      </div>
    </div>
  );
}
