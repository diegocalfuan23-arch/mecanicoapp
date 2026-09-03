"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { agregarAyudante, quitarAyudante, cambiarVePagos } from "./acciones";

type Miembro = {
  id: string;
  nombre: string;
  correo: string;
  vePagos: boolean;
  createdAt: Date;
};

function Formulario({ onListo }: { onListo: () => void }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const campo =
    "w-full rounded-lg border border-border bg-background px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30";

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

    onListo();
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <h2 className="text-lg font-medium">Nuevo ayudante</h2>
      <p className="mt-1 text-[14px] text-muted-foreground">
        Entra con su propia cuenta y ve los mismos vehículos, órdenes y
        pagos que tú.
      </p>

      <form onSubmit={enviar} className="mt-6 flex flex-col gap-4">
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

        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            type="submit"
            disabled={enviando}
            className="rounded-lg bg-primary px-6 py-4 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {enviando ? "Agregando…" : "Agregar ayudante"}
          </button>
          <button
            type="button"
            onClick={onListo}
            className="rounded-lg border border-border px-6 py-4 font-medium transition-colors hover:bg-card"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export function TablaEquipo({ miembros: iniciales }: { miembros: Miembro[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [confirmando, setConfirmando] = useState<Miembro | null>(null);
  const [quitando, setQuitando] = useState(false);
  // Optimista: el checkbox responde al instante, sin esperar la
  // vuelta del servidor ni un router.refresh() completo por cada clic.
  const [miembros, setMiembros] = useState(iniciales);

  async function quitar() {
    if (!confirmando) return;
    setQuitando(true);
    await quitarAyudante(confirmando.id);
    setQuitando(false);
    setConfirmando(null);
    router.refresh();
  }

  async function alternarVePagos(m: Miembro) {
    const nuevo = !m.vePagos;
    setMiembros((actuales) =>
      actuales.map((x) => (x.id === m.id ? { ...x, vePagos: nuevo } : x))
    );
    await cambiarVePagos(m.id, nuevo);
  }

  if (abierto) {
    return <Formulario onListo={() => setAbierto(false)} />;
  }

  return (
    <>
      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            aria-label="Cancelar"
            onClick={() => setConfirmando(null)}
            className="absolute inset-0 bg-black/60"
          />
          <div
            role="dialog"
            aria-modal
            className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6"
          >
            <h2 className="text-lg font-medium">
              ¿Quitar a {confirmando.nombre}?
            </h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Deja de tener acceso al taller. Su cuenta no se borra, solo
              se desvincula.
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={quitar}
                disabled={quitando}
                className="rounded-lg bg-destructive px-6 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {quitando ? "Quitando…" : "Sí, quitar"}
              </button>
              <button
                onClick={() => setConfirmando(null)}
                className="rounded-lg border border-border px-6 py-2 font-medium transition-colors hover:bg-background"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => setAbierto(true)}
          className="shrink-0 rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Agregar ayudante
        </button>
      </div>

      {miembros.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">
            Todavía no agregaste a nadie de tu equipo.
          </p>
          <button
            onClick={() => setAbierto(true)}
            className="mt-4 text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Agregar el primero
          </button>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {miembros.map((m) => (
            <li
              key={m.id}
              className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-4 sm:p-6"
            >
              <p className="truncate font-medium">{m.nombre}</p>
              <p className="mt-1 truncate text-[14px] text-muted-foreground">
                {m.correo}
              </p>
              <label className="mt-4 flex items-center gap-2 text-[13px]">
                <input
                  type="checkbox"
                  checked={m.vePagos}
                  onChange={() => alternarVePagos(m)}
                  className="size-4 accent-primary"
                />
                Ve Pagos y precios de repuestos
              </label>
              <button
                onClick={() => setConfirmando(m)}
                className="mt-4 self-start text-[13px] text-muted-foreground underline underline-offset-4 hover:text-destructive"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
