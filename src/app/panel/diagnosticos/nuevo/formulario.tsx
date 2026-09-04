"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearDiagnostico, type PasoCotizado } from "../acciones";
import { Checklist } from "../checklist";
import { Evidencia } from "../evidencia";
import { Selector } from "@/components/ui/selector";
import { Button } from "@/components/ui/button";

const campo =
  "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30";

const OTRO_TECNICO = "__otro__";

type Tecnico = { id: string; nombre: string };

export function NuevoDiagnostico({ tecnicos }: { tecnicos: Tecnico[] }) {
  const router = useRouter();
  const [patente, setPatente] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [tecnicoId, setTecnicoId] = useState("");
  const [tecnicoNombre, setTecnicoNombre] = useState("");
  const [usaTecnicoLibre, setUsaTecnicoLibre] = useState(false);
  const [falla, setFalla] = useState("");
  const [procedimiento, setProcedimiento] = useState("");
  const [pasos, setPasos] = useState<PasoCotizado[]>([]);
  const [fotos, setFotos] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [documentos, setDocumentos] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const res = await crearDiagnostico({
      patente,
      clienteNombre,
      clienteTelefono,
      tecnicoId: usaTecnicoLibre ? "" : tecnicoId,
      tecnicoNombre: usaTecnicoLibre ? tecnicoNombre : "",
      falla,
      procedimiento,
      pasos,
      fotos,
      videos,
      documentos,
    });

    setEnviando(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    router.push("/panel/diagnosticos");
  }

  return (
    <form onSubmit={enviar} className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <label className="mb-2 block text-[13px] font-medium">Patente</label>
        <input
          value={patente}
          onChange={(e) => setPatente(e.target.value)}
          placeholder="AA1234"
          autoCapitalize="characters"
          autoFocus
          className={`${campo} font-mono uppercase`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-[13px] font-medium">
            Nombre del cliente (opcional)
          </label>
          <input
            value={clienteNombre}
            onChange={(e) => setClienteNombre(e.target.value)}
            placeholder="Si aún no se sabe, déjalo vacío"
            className={campo}
          />
        </div>
        <div>
          <label className="mb-2 block text-[13px] font-medium">
            Teléfono (opcional)
          </label>
          <input
            value={clienteTelefono}
            onChange={(e) => setClienteTelefono(e.target.value)}
            placeholder="+56 9…"
            className={campo}
          />
        </div>
      </div>

      {tecnicos.length > 0 && (
        <div>
          <span className="mb-2 block text-[13px] font-medium">Técnico</span>
          <Selector
            value={usaTecnicoLibre ? OTRO_TECNICO : tecnicoId}
            onChange={(valor) => {
              if (valor === OTRO_TECNICO) {
                setUsaTecnicoLibre(true);
                setTecnicoId("");
                return;
              }
              setUsaTecnicoLibre(false);
              setTecnicoId(valor);
              setTecnicoNombre("");
            }}
            placeholder="Sin asignar"
            opciones={[
              ...tecnicos.map((t) => ({ valor: t.id, texto: t.nombre })),
              { valor: OTRO_TECNICO, texto: "Otro (sin cuenta)…" },
            ]}
          />
          {usaTecnicoLibre && (
            <input
              value={tecnicoNombre}
              onChange={(e) => setTecnicoNombre(e.target.value)}
              placeholder="Nombre del técnico"
              autoFocus
              className={`${campo} mt-2`}
            />
          )}
        </div>
      )}

      <div>
        <label className="mb-2 block text-[13px] font-medium">
          Falla o problema
        </label>
        <p className="mb-2 text-[13px] text-muted-foreground">
          Describe qué reporta el cliente o qué se va a diagnosticar.
        </p>
        <textarea
          value={falla}
          onChange={(e) => setFalla(e.target.value)}
          rows={3}
          placeholder="Ej. no enciende, freno delantero sin respuesta…"
          className={campo}
        />
      </div>

      <div>
        <label className="mb-2 block text-[13px] font-medium">
          Procedimiento (opcional)
        </label>
        <p className="mb-2 text-[13px] text-muted-foreground">
          Pasos que seguirá el técnico durante el diagnóstico.
        </p>
        <textarea
          value={procedimiento}
          onChange={(e) => setProcedimiento(e.target.value)}
          rows={3}
          placeholder="Ej. medir voltaje de batería, revisar conexiones del motor…"
          className={campo}
        />
      </div>

      <Checklist pasos={pasos} onCambio={setPasos} />

      <Evidencia
        fotos={fotos}
        onCambioFotos={setFotos}
        videos={videos}
        onCambioVideos={setVideos}
        documentos={documentos}
        onCambioDocumentos={setDocumentos}
        onError={setError}
      />

      {error && (
        <p className="text-[13px] text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={enviando || !patente.trim()}>
          {enviando ? "Guardando…" : "Crear diagnóstico"}
        </Button>
      </div>
    </form>
  );
}
