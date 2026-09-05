"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearPresupuesto, type ItemCotizado } from "../acciones";
import { ItemsCotizados } from "../items-cotizados";
import { Button } from "@/components/ui/button";

const campo =
  "w-full rounded-lg border border-border bg-card px-3 py-2.5 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30";

export function NuevoPresupuesto() {
  const router = useRouter();
  const [patente, setPatente] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [clienteTelefono, setClienteTelefono] = useState("");
  const [sintoma, setSintoma] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [items, setItems] = useState<ItemCotizado[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const res = await crearPresupuesto({
      patente,
      clienteNombre,
      clienteTelefono,
      sintoma,
      diagnostico,
      items,
    });

    setEnviando(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    router.push("/panel/presupuestos");
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5">
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

      <div>
        <label className="mb-2 block text-[13px] font-medium">
          Qué reporta el cliente (opcional)
        </label>
        <textarea
          value={sintoma}
          onChange={(e) => setSintoma(e.target.value)}
          rows={2}
          className={campo}
        />
      </div>

      <div>
        <label className="mb-2 block text-[13px] font-medium">
          Diagnóstico (opcional)
        </label>
        <textarea
          value={diagnostico}
          onChange={(e) => setDiagnostico(e.target.value)}
          rows={2}
          className={campo}
        />
      </div>

      <ItemsCotizados items={items} onCambio={setItems} />

      {error && (
        <p className="text-[13px] text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={enviando || !patente.trim()}>
          {enviando ? "Guardando…" : "Crear presupuesto"}
        </Button>
      </div>
    </form>
  );
}
