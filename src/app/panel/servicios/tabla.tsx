"use client";

import { useRef, useState } from "react";
import { crearServicio, editarServicio, eliminarServicio } from "./acciones";

type Servicio = {
  id: string;
  grupo: string;
  codigo: string;
  etiqueta: string;
  orden: number;
  parteId: string | null;
  parteNombre: string | null;
};

type Insumo = {
  id: string;
  nombre: string;
  codigo: string | null;
  marca: string | null;
};

const campo =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30";

const NUEVO_GRUPO = "__nuevo__";

/** Elige un grupo existente o escribe uno nuevo — evita duplicados por typo. */
function SelectorGrupo({
  grupos,
  valor,
  onCambio,
}: {
  grupos: string[];
  valor: string;
  onCambio: (v: string) => void;
}) {
  const [esNuevo, setEsNuevo] = useState(!grupos.includes(valor));

  if (esNuevo || grupos.length === 0) {
    return (
      <div className="flex gap-2">
        <input
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          placeholder="Mecánica"
          autoFocus
          className={campo}
        />
        {grupos.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setEsNuevo(false);
              onCambio(grupos[0]);
            }}
            className="shrink-0 rounded-lg border border-border px-3 text-[13px] text-muted-foreground hover:bg-card"
          >
            Elegir
          </button>
        )}
      </div>
    );
  }

  return (
    <select
      value={valor}
      onChange={(e) => {
        if (e.target.value === NUEVO_GRUPO) {
          setEsNuevo(true);
          onCambio("");
          return;
        }
        onCambio(e.target.value);
      }}
      className={campo}
    >
      {grupos.map((g) => (
        <option key={g} value={g}>
          {g}
        </option>
      ))}
      <option value={NUEVO_GRUPO}>+ Grupo nuevo</option>
    </select>
  );
}

/**
 * Insumo del inventario que este servicio usa por defecto (ej.
 * "Cambio de aceite motor" → "Aceite 15W40") — solo referencia, no
 * descuenta stock al marcar el servicio. Buscador propio, mismo
 * patrón que BuscadorRepuesto: dropdown fixed, sin depender de un
 * componente de terceros.
 */
function SelectorInsumo({
  inventario,
  parteId,
  onCambio,
}: {
  inventario: Insumo[];
  parteId: string | null;
  onCambio: (id: string | null) => void;
}) {
  const seleccionado = inventario.find((i) => i.id === parteId) ?? null;
  const [texto, setTexto] = useState(seleccionado?.nombre ?? "");
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const coincidencias = texto.trim()
    ? inventario.filter((i) =>
        i.nombre.toLowerCase().includes(texto.trim().toLowerCase())
      )
    : inventario;

  function abrir() {
    const el = inputRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setAbierto(true);
  }

  function elegir(insumo: Insumo | null) {
    onCambio(insumo?.id ?? null);
    setTexto(insumo?.nombre ?? "");
    setAbierto(false);
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          if (!e.target.value) onCambio(null);
          abrir();
        }}
        onFocus={abrir}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
        placeholder="Sin insumo asociado"
        className={campo}
      />
      {abierto && inventario.length > 0 && (
        <ul
          style={{ top: pos.top, left: pos.left, width: pos.width }}
          className="scroll-discreto fixed z-50 max-h-48 overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-lg"
        >
          <li>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => elegir(null)}
              className="w-full px-4 py-2 text-left text-[14px] text-muted-foreground hover:bg-background"
            >
              Sin insumo asociado
            </button>
          </li>
          {coincidencias.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => elegir(i)}
                className="w-full truncate px-4 py-2 text-left text-[14px] hover:bg-background"
              >
                {i.nombre}
                {i.marca && (
                  <span className="text-muted-foreground"> · {i.marca}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Agrega o corrige un servicio, en un modal — mismo formulario para
 * ambos casos. Optimista: se ve en la lista al instante, sin esperar
 * la respuesta del servidor para cerrar el modal.
 */
function Formulario({
  servicio,
  grupoSugerido,
  grupos,
  inventario,
  onListo,
}: {
  servicio?: Servicio;
  grupoSugerido?: string;
  grupos: string[];
  inventario: Insumo[];
  onListo: (item?: Servicio) => void;
}) {
  const [grupo, setGrupo] = useState(servicio?.grupo ?? grupoSugerido ?? grupos[0] ?? "");
  const [codigo, setCodigo] = useState(servicio?.codigo ?? "");
  const [etiqueta, setEtiqueta] = useState(servicio?.etiqueta ?? "");
  const [parteId, setParteId] = useState<string | null>(servicio?.parteId ?? null);
  const [error, setError] = useState<string | null>(null);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const datos = {
      grupo: grupo.trim(),
      codigo: codigo.trim(),
      etiqueta: etiqueta.trim(),
      parteId,
    };
    if (!datos.grupo) return setError("Escribe el nombre del grupo.");
    if (!datos.etiqueta) return setError("Escribe el nombre del servicio.");

    const parteNombre = inventario.find((i) => i.id === parteId)?.nombre ?? null;

    if (servicio) {
      onListo({ ...servicio, ...datos, parteNombre });
      editarServicio(servicio.id, datos);
      return;
    }

    const optimista: Servicio = {
      id: `tmp-${crypto.randomUUID()}`,
      ...datos,
      parteNombre,
      orden: 0,
    };
    onListo(optimista);
    crearServicio(datos);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Cerrar"
        onClick={() => onListo()}
        className="absolute inset-0 bg-black/60"
      />
      <form
        onSubmit={enviar}
        className="relative w-full max-w-md rounded-lg border border-border bg-background p-4"
      >
        <h2 className="mb-4 text-[15px] font-medium">
          {servicio ? "Corregir servicio" : "Nuevo servicio"}
        </h2>

        <label className="block">
          <span className="mb-1 block text-[13px] text-muted-foreground">
            Grupo
          </span>
          <SelectorGrupo grupos={grupos} valor={grupo} onCambio={setGrupo} />
        </label>
        <div className="mt-3 grid grid-cols-[auto_1fr] gap-3">
          <label className="block">
            <span className="mb-1 block text-[13px] text-muted-foreground">
              Código
            </span>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="1"
              className={`${campo} w-20`}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[13px] text-muted-foreground">
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
        <label className="mt-3 block">
          <span className="mb-1 block text-[13px] text-muted-foreground">
            Insumo que usa (opcional)
          </span>
          <SelectorInsumo
            inventario={inventario}
            parteId={parteId}
            onCambio={setParteId}
          />
        </label>

        {error && <p className="mt-2 text-[13px] text-destructive">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            {servicio ? "Guardar cambios" : "Agregar"}
          </button>
          <button
            type="button"
            onClick={() => onListo()}
            className="rounded-lg border border-border px-4 py-2 text-[14px] transition-colors hover:bg-card"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export function TablaServicios({
  servicios,
  inventario,
}: {
  servicios: Servicio[];
  inventario: Insumo[];
}) {
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
        <Formulario
          grupoSugerido={agregando || undefined}
          grupos={grupos}
          inventario={inventario}
          onListo={(item) => {
            if (item) setItems((actuales) => [...actuales, item]);
            setAgregando(null);
          }}
        />
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
                  .map((s) => (
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
                        {s.parteNombre && (
                          <span className="block truncate text-[12px] text-muted-foreground">
                            {s.parteNombre}
                          </span>
                        )}
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
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {editandoId !== null && (
        <Formulario
          servicio={items.find((s) => s.id === editandoId)}
          grupos={grupos}
          inventario={inventario}
          onListo={(item) => {
            if (item) {
              setItems((actuales) =>
                actuales.map((a) => (a.id === editandoId ? item : a))
              );
            }
            setEditandoId(null);
          }}
        />
      )}
    </div>
  );
}
