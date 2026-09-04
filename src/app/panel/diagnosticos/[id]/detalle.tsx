"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { alternarPaso, vincularDiagnostico } from "../acciones";
import { fecha } from "@/lib/formato";
import { Selector } from "@/components/ui/selector";
import { Button } from "@/components/ui/button";

type Paso = { id: string; texto: string; hecho: boolean };

type Diagnostico = {
  id: string;
  numero: number;
  patente: string;
  clienteNombre: string | null;
  clienteTelefono: string | null;
  tecnicoNombre: string | null;
  falla: string | null;
  procedimiento: string | null;
  fotos: string[];
  videos: string[];
  documentos: string[];
  estado: string;
  trabajoId: string | null;
  fecha: Date;
  pasos: Paso[];
};

type Orden = { id: string; numero: number; patente: string };

const TEXTO_ESTADO: Record<string, string> = {
  pendiente: "Pendiente",
  vinculado: "Vinculado a una orden",
};

export function DetalleDiagnostico({
  diagnostico,
  ordenes,
}: {
  diagnostico: Diagnostico;
  ordenes: Orden[];
}) {
  const router = useRouter();
  const [pasos, setPasos] = useState(diagnostico.pasos);
  const [ordenElegida, setOrdenElegida] = useState("");
  const [enCurso, setEnCurso] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function marcar(pasoId: string, hechoActual: boolean) {
    setPasos((actuales) =>
      actuales.map((p) => (p.id === pasoId ? { ...p, hecho: !hechoActual } : p))
    );
    await alternarPaso(pasoId, !hechoActual);
  }

  async function vincular() {
    if (!ordenElegida) return;
    setEnCurso(true);
    setError(null);
    const res = await vincularDiagnostico(diagnostico.id, ordenElegida);
    setEnCurso(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    router.push(`/panel/ordenes/${ordenElegida}`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="font-mono text-xl font-medium">
          {diagnostico.patente}
        </span>
        <span className="text-muted-foreground">
          {diagnostico.clienteNombre ?? "Sin nombre aún"}
        </span>
        <span className="rounded-full bg-foreground/10 px-2 py-1 text-[12px] font-medium">
          {TEXTO_ESTADO[diagnostico.estado] ?? diagnostico.estado}
        </span>
      </div>
      <p className="mt-1 text-[13px] text-muted-foreground">
        {fecha(diagnostico.fecha)}
        {diagnostico.tecnicoNombre ? ` · ${diagnostico.tecnicoNombre}` : ""}
        {diagnostico.clienteTelefono ? ` · ${diagnostico.clienteTelefono}` : ""}
      </p>

      {(diagnostico.falla || diagnostico.procedimiento) && (
        <div className="mt-6 rounded-xl border border-border bg-card p-4">
          {diagnostico.falla && (
            <p className="text-[14px]">
              <span className="text-muted-foreground">Falla: </span>
              {diagnostico.falla}
            </p>
          )}
          {diagnostico.procedimiento && (
            <p className="mt-2 text-[14px]">
              <span className="text-muted-foreground">Procedimiento: </span>
              {diagnostico.procedimiento}
            </p>
          )}
        </div>
      )}

      {pasos.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-[13px] font-medium">Checklist</p>
          <ul className="flex flex-col gap-1">
            {pasos.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
              >
                <input
                  type="checkbox"
                  checked={p.hecho}
                  onChange={() => marcar(p.id, p.hecho)}
                  className="size-4 shrink-0"
                />
                <span
                  className={`text-[14px] ${p.hecho ? "text-muted-foreground line-through" : ""}`}
                >
                  {p.texto}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {diagnostico.fotos.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-[13px] font-medium">Fotos</p>
          <div className="flex flex-wrap gap-2">
            {diagnostico.fotos.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt="Evidencia del diagnóstico"
                className="size-20 rounded-lg border border-border object-cover"
              />
            ))}
          </div>
        </div>
      )}

      {diagnostico.videos.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-[13px] font-medium">Videos</p>
          <ul className="flex flex-col gap-1">
            {diagnostico.videos.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] text-acento hover:underline"
                >
                  {url.split("/").pop()}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {diagnostico.documentos.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-[13px] font-medium">Documentos</p>
          <ul className="flex flex-col gap-1">
            {diagnostico.documentos.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[13px] text-acento hover:underline"
                >
                  {url.split("/").pop()}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="mt-4 text-[13px] text-destructive" role="alert">
          {error}
        </p>
      )}

      {diagnostico.estado === "pendiente" && (
        <div className="mt-6 rounded-xl border border-border bg-card p-4">
          <p className="mb-2 text-[13px] font-medium">Vincular a una orden</p>
          {ordenes.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">
              No hay órdenes abiertas todavía.{" "}
              <Link
                href="/panel/ordenes/nueva"
                className="text-acento hover:underline"
              >
                Ingresar vehículo
              </Link>
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-48">
                <Selector
                  value={ordenElegida}
                  onChange={setOrdenElegida}
                  placeholder="Elige una orden"
                  opciones={ordenes.map((o) => ({
                    valor: o.id,
                    texto: `OT-${o.numero} · ${o.patente}`,
                  }))}
                />
              </div>
              <Button
                type="button"
                onClick={vincular}
                disabled={enCurso || !ordenElegida}
              >
                {enCurso ? "Vinculando…" : "Vincular"}
              </Button>
            </div>
          )}
        </div>
      )}

      {diagnostico.estado === "vinculado" && diagnostico.trabajoId && (
        <Link
          href={`/panel/ordenes/${diagnostico.trabajoId}`}
          className="mt-6 inline-block text-[14px] text-acento hover:underline"
        >
          Ver orden vinculada →
        </Link>
      )}
    </div>
  );
}
