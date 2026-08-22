"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { agregarAyudante, quitarAyudante } from "./equipo";

type Miembro = {
  id: string;
  nombre: string;
  correo: string;
  createdAt: Date;
};

export function Equipo({ miembros }: { miembros: Miembro[] }) {
  const router = useRouter();
  const [agregando, setAgregando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [quitando, setQuitando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const res = await agregarAyudante({ nombre, correo, clave });
    setEnviando(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    setNombre("");
    setCorreo("");
    setClave("");
    setAgregando(false);
    router.refresh();
  }

  async function quitar(id: string) {
    setQuitando(id);
    await quitarAyudante(id);
    setQuitando(null);
    router.refresh();
  }

  const campo =
    "w-full rounded-lg border border-border bg-background px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30";

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-medium">Tu equipo</h2>
      <p className="mt-2 text-[15px] text-muted-foreground">
        Los ayudantes entran con su propia cuenta y ven los mismos
        vehículos, órdenes y pagos que tú.
      </p>

      {miembros.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {miembros.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium">{m.nombre}</p>
                <p className="truncate text-[13px] text-muted-foreground">
                  {m.correo}
                </p>
              </div>
              <button
                onClick={() => quitar(m.id)}
                disabled={quitando === m.id}
                className="shrink-0 text-[13px] text-muted-foreground underline underline-offset-4 hover:text-destructive disabled:opacity-60"
              >
                {quitando === m.id ? "Quitando…" : "Quitar"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {agregando ? (
        <form onSubmit={enviar} className="mt-4 flex flex-col gap-4">
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">Nombre</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del ayudante"
              autoFocus
              className={campo}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">Correo</span>
            <input
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              type="email"
              placeholder="correo@ejemplo.cl"
              className={campo}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">
              Contraseña
            </span>
            <input
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              type="password"
              placeholder="Mínimo 8 caracteres"
              className={campo}
            />
          </label>

          {error && <p className="text-[13px] text-destructive">{error}</p>}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={enviando}
              className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {enviando ? "Agregando…" : "Agregar ayudante"}
            </button>
            <button
              type="button"
              onClick={() => {
                setAgregando(false);
                setError(null);
              }}
              className="rounded-lg border border-border px-6 py-2 font-medium transition-colors hover:bg-background"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAgregando(true)}
          className="mt-4 rounded-lg border border-border px-6 py-2 font-medium transition-colors hover:bg-background"
        >
          Agregar ayudante
        </button>
      )}
    </div>
  );
}
