"use client";

import { useState } from "react";
import { crearServicio, editarServicio, eliminarServicio } from "./acciones";

type Servicio = {
  id: string;
  grupo: string;
  codigo: string;
  etiqueta: string;
  orden: number;
};

const campo =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30";

/**
 * Agrega o corrige un servicio — mismo formulario para ambos casos,
 * el grupo se escribe a mano (no hay selector) para poder crear uno
 * nuevo sin pasos extra: si coincide con uno existente, se agrupa ahí.
 */
function Formulario({
  servicio,
  grupoSugerido,
  onListo,
}: {
  servicio?: Servicio;
  grupoSugerido?: string;
  onListo: (item?: Servicio) => void;
}) {
  const [grupo, setGrupo] = useState(servicio?.grupo ?? grupoSugerido ?? "");
  const [codigo, setCodigo] = useState(servicio?.codigo ?? "");
  const [etiqueta, setEtiqueta] = useState(servicio?.etiqueta ?? "");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const datos = { grupo: grupo.trim(), codigo: codigo.trim(), etiqueta: etiqueta.trim() };

    if (servicio) {
      const res = await editarServicio(servicio.id, datos);
      setEnviando(false);
      if (res?.error) {
        setError(res.error);
        return;
      }
      onListo({ ...servicio, ...datos });
      return;
    }

    const res = await crearServicio(datos);
    setEnviando(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    onListo(res.item);
  }

  return (
    <form
      onSubmit={enviar}
      className="rounded-lg border border-border bg-card p-4"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_2fr]">
        <label className="block">
          <span className="mb-1 block text-[12px] text-muted-foreground">
            Grupo
          </span>
          <input
            value={grupo}
            onChange={(e) => setGrupo(e.target.value)}
            placeholder="Mecánica"
            autoFocus
            className={campo}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] text-muted-foreground">
            Código
          </span>
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="1"
            className={`${campo} sm:w-20`}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[12px] text-muted-foreground">
            Servicio
          </span>
          <input
            value={etiqueta}
            onChange={(e) => setEtiqueta(e.target.value)}
            placeholder="Cambio de aceite motor"
            className={campo}
          />
        </label>
      </div>

      {error && <p className="mt-2 text-[13px] text-destructive">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-primary px-4 py-2 text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {enviando ? "Guardando…" : servicio ? "Guardar cambios" : "Agregar"}
        </button>
        <button
          type="button"
          onClick={() => onListo()}
          className="rounded-lg border border-border px-4 py-2 text-[14px] transition-colors hover:bg-background"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function TablaServicios({ servicios }: { servicios: Servicio[] }) {
  const [items, setItems] = useState(servicios);
  const [agregando, setAgregando] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [quitandoId, setQuitandoId] = useState<string | null>(null);

  const grupos = Array.from(new Set(items.map((s) => s.grupo)));

  async function quitar(id: string) {
    setQuitandoId(id);
    setItems((actuales) => actuales.filter((s) => s.id !== id));
    await eliminarServicio(id);
    setQuitandoId(null);
  }

  return (
    <div>
      <div className="flex justify-end">
        <button
          onClick={() => setAgregando("")}
          className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Agregar servicio
        </button>
      </div>

      {agregando !== null && (
        <div className="mt-4">
          <Formulario
            grupoSugerido={agregando || undefined}
            onListo={(item) => {
              if (item) setItems((actuales) => [...actuales, item]);
              setAgregando(null);
            }}
          />
        </div>
      )}

      {items.length === 0 && agregando === null ? (
        <div className="mt-8 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">
            Todavía no configuraste tus servicios.
          </p>
          <button
            onClick={() => setAgregando("")}
            className="mt-4 text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Agregar el primero
          </button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {grupos.map((grupo) => (
            <div key={grupo}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-[13px] font-medium text-muted-foreground">
                  {grupo}
                </h2>
                <button
                  onClick={() => setAgregando(grupo)}
                  className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Agregar acá
                </button>
              </div>
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items
                  .filter((s) => s.grupo === grupo)
                  .map((s) =>
                    editandoId === s.id ? (
                      <li key={s.id} className="sm:col-span-2 lg:col-span-3">
                        <Formulario
                          servicio={s}
                          onListo={(item) => {
                            if (item) {
                              setItems((actuales) =>
                                actuales.map((a) => (a.id === s.id ? item : a))
                              );
                            }
                            setEditandoId(null);
                          }}
                        />
                      </li>
                    ) : (
                      <li
                        key={s.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[14px]"
                      >
                        <button
                          onClick={() => setEditandoId(s.id)}
                          className="min-w-0 flex-1 truncate text-left"
                        >
                          <span className="text-muted-foreground">
                            {s.codigo}
                          </span>{" "}
                          {s.etiqueta}
                        </button>
                        <button
                          onClick={() => quitar(s.id)}
                          disabled={quitandoId === s.id}
                          aria-label="Quitar"
                          className="shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-40"
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
                    )
                  )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
