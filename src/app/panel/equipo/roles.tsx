"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  crearRolPersonalizado,
  actualizarRolPersonalizado,
  eliminarRolPersonalizado,
} from "./acciones";
import { Button } from "@/components/ui/button";

export type RolPersonalizado = {
  id: string;
  nombre: string;
  permisos: unknown;
};

const campo =
  "w-full rounded-lg border border-border bg-background px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30";

function permisosDe(permisos: unknown): Record<string, boolean> {
  return permisos && typeof permisos === "object"
    ? (permisos as Record<string, boolean>)
    : {};
}

function FormularioRol({
  modulos,
  etiquetas,
  rol,
  onListo,
}: {
  modulos: readonly string[];
  etiquetas: Record<string, string>;
  rol: RolPersonalizado | null;
  onListo: () => void;
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState(rol?.nombre ?? "");
  const [permisos, setPermisos] = useState<Record<string, boolean>>(
    permisosDe(rol?.permisos)
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function alternar(modulo: string) {
    setPermisos((actuales) => ({ ...actuales, [modulo]: !actuales[modulo] }));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);

    const res = rol
      ? await actualizarRolPersonalizado(rol.id, { nombre, permisos })
      : await crearRolPersonalizado({ nombre, permisos });

    setGuardando(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    router.refresh();
    onListo();
  }

  return (
    <form
      onSubmit={guardar}
      className="rounded-xl border border-border bg-card p-6 sm:p-8"
    >
      <h2 className="text-lg font-medium">
        {rol ? `Editar ${rol.nombre}` : "Nuevo rol"}
      </h2>
      <p className="mt-1 text-[14px] text-muted-foreground">
        Elige qué puede ver esta persona — tú decides, según tu propio
        criterio, sin reglas fijas.
      </p>

      <label className="mt-6 block">
        <span className="mb-2 block text-[13px] font-medium">
          Nombre del rol
        </span>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Contador, Ayudante de recepción"
          autoFocus
          className={campo}
        />
      </label>

      <div className="mt-6">
        <span className="mb-2 block text-[13px] font-medium">
          Módulos habilitados
        </span>
        <div className="grid gap-2 sm:grid-cols-2">
          {modulos.map((modulo) => (
            <label
              key={modulo}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-[14px]"
            >
              <input
                type="checkbox"
                checked={permisos[modulo] === true}
                onChange={() => alternar(modulo)}
                className="size-4 accent-primary"
              />
              {etiquetas[modulo] ?? modulo}
            </label>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-[13px] text-destructive">{error}</p>}

      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
        <Button type="submit" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar rol"}
        </Button>
        <Button variant="outline" type="button" onClick={onListo}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function Roles({
  roles,
  modulos,
  etiquetas,
}: {
  roles: RolPersonalizado[];
  modulos: readonly string[];
  etiquetas: Record<string, string>;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState<RolPersonalizado | null | "nuevo">(
    null
  );
  const [borrando, setBorrando] = useState<RolPersonalizado | null>(null);

  async function confirmarBorrado() {
    if (!borrando) return;
    await eliminarRolPersonalizado(borrando.id);
    setBorrando(null);
    router.refresh();
  }

  if (editando) {
    return (
      <FormularioRol
        modulos={modulos}
        etiquetas={etiquetas}
        rol={editando === "nuevo" ? null : editando}
        onListo={() => setEditando(null)}
      />
    );
  }

  return (
    <div>
      {borrando && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            aria-label="Cancelar"
            onClick={() => setBorrando(null)}
            className="absolute inset-0 bg-black/60"
          />
          <div
            role="dialog"
            aria-modal
            className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6"
          >
            <h2 className="text-lg font-medium">¿Eliminar {borrando.nombre}?</h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Quienes tengan este rol vuelven a verse como Mecánico. No se
              elimina a nadie del equipo.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={confirmarBorrado}
                className="rounded-lg bg-destructive px-6 py-2 font-medium text-white transition-opacity hover:opacity-90"
              >
                Sí, eliminar
              </button>
              <Button variant="outline" onClick={() => setBorrando(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">Roles a medida</h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Crea roles como Contador o Ayudante y decide qué módulos ve
            cada uno.
          </p>
        </div>
        <Button onClick={() => setEditando("nuevo")} className="shrink-0">
          Nuevo rol
        </Button>
      </div>

      {roles.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border py-12 text-center">
          <p className="text-muted-foreground">Todavía no creaste ningún rol.</p>
          <button
            onClick={() => setEditando("nuevo")}
            className="mt-4 text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Crear el primero
          </button>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((rol) => {
            const activos = modulos.filter(
              (m) => permisosDe(rol.permisos)[m] === true
            );
            return (
              <li
                key={rol.id}
                className="flex flex-col rounded-xl border border-border bg-card p-4 sm:p-6"
              >
                <p className="font-medium">{rol.nombre}</p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {activos.length === 0
                    ? "Sin módulos habilitados"
                    : activos.map((m) => etiquetas[m] ?? m).join(", ")}
                </p>
                <div className="mt-4 flex gap-4">
                  <button
                    onClick={() => setEditando(rol)}
                    className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setBorrando(rol)}
                    className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-destructive"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
