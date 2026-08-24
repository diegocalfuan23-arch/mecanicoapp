"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { guardarDatosTaller } from "./acciones";

export function PanelTaller({
  taller,
  rut,
  direccion,
  telefono,
}: {
  taller: string;
  rut: string;
  direccion: string;
  telefono: string;
}) {
  const router = useRouter();
  const [valores, setValores] = useState({ taller, rut, direccion, telefono });
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    await guardarDatosTaller(valores);
    setGuardando(false);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 1500);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-medium">Datos del taller</h2>
      <p className="mt-2 text-[15px] text-muted-foreground">
        Aparecen en el encabezado de la orden de trabajo cuando se imprime.
      </p>

      <form onSubmit={guardar} className="mt-4 flex flex-col gap-4">
        <label className="block">
          <span className="mb-2 block text-[13px] font-medium">
            Nombre del taller
          </span>
          <input
            value={valores.taller}
            onChange={(e) =>
              setValores((v) => ({ ...v, taller: e.target.value }))
            }
            placeholder="Omega Serviteca SPA"
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[13px] font-medium">RUT</span>
          <input
            value={valores.rut}
            onChange={(e) =>
              setValores((v) => ({ ...v, rut: e.target.value }))
            }
            placeholder="77.980.235-3"
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[13px] font-medium">
            Dirección
          </span>
          <input
            value={valores.direccion}
            onChange={(e) =>
              setValores((v) => ({ ...v, direccion: e.target.value }))
            }
            placeholder="O'Higgins #0860, Temuco"
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[13px] font-medium">Teléfono</span>
          <input
            value={valores.telefono}
            onChange={(e) =>
              setValores((v) => ({ ...v, telefono: e.target.value }))
            }
            placeholder="+56 9 4865 2995"
            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
          />
        </label>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={guardando}
            className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
          {guardado && (
            <span className="text-[13px] text-muted-foreground">
              Guardado
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
