"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registrarAbono, saldarTrabajo } from "./acciones";
import { pesos, fecha } from "@/lib/formato";

type Deuda = {
  id: string;
  descripcion: string | null;
  total: number;
  abonado: number;
  estadoPago: string;
  fecha: Date;
  patente: string;
  marca: string | null;
  modelo: string | null;
  propietario: string | null;
  telefono: string | null;
};

function diasDesde(desde: Date) {
  const ms = Date.now() - new Date(desde).getTime();
  return Math.floor(ms / 86_400_000);
}

function Abonar({
  deuda,
  onCerrar,
}: {
  deuda: Deuda;
  onCerrar: () => void;
}) {
  const router = useRouter();
  const saldo = deuda.total - deuda.abonado;
  const [monto, setMonto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const res = await registrarAbono(deuda.id, Number(monto));
    setEnviando(false);

    if (res?.error) {
      setError(res.error);
      return;
    }
    onCerrar();
    router.refresh();
  }

  return (
    <form
      onSubmit={enviar}
      className="mt-4 rounded-lg border border-border bg-background p-4"
    >
      <p className="text-[13px] text-muted-foreground">
        Saldo pendiente: <span className="text-foreground">{pesos(saldo)}</span>
      </p>
      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        <input
          value={monto}
          onChange={(e) => setMonto(e.target.value.replace(/\D/g, ""))}
          placeholder="Monto abonado"
          inputMode="numeric"
          autoFocus
          className="flex-1 rounded-lg border border-border bg-card px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
        />
        <button
          type="submit"
          disabled={enviando || !monto}
          className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {enviando ? "Guardando…" : "Registrar abono"}
        </button>
        <button
          type="button"
          onClick={onCerrar}
          className="rounded-lg border border-border px-6 py-2 transition-colors hover:bg-card"
        >
          Cancelar
        </button>
      </div>
      {error && <p className="mt-2 text-[13px] text-destructive">{error}</p>}
    </form>
  );
}

export function ListaDeudas({ deudas }: { deudas: Deuda[] }) {
  const router = useRouter();
  const [abriendo, setAbriendo] = useState<string | null>(null);
  const [saldando, setSaldando] = useState<string | null>(null);

  async function saldar(id: string) {
    setSaldando(id);
    await saldarTrabajo(id);
    setSaldando(null);
    router.refresh();
  }

  if (deudas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center">
        <p className="text-muted-foreground">Nadie te debe. Todo al día.</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {deudas.map((d) => {
        const saldo = d.total - d.abonado;
        const dias = diasDesde(d.fecha);

        return (
          <li
            key={d.id}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-medium">{d.patente}</span>
                  {d.marca && (
                    <span className="text-muted-foreground">
                      {d.marca} {d.modelo}
                    </span>
                  )}
                  {d.estadoPago === "abonado" && (
                    <span className="rounded-full bg-foreground/10 px-2 py-1 text-[12px] font-medium">
                      Abonado
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[15px]">
                  {d.descripcion ?? "Sin detalle del trabajo"}
                </p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {d.propietario ?? "Sin dueño registrado"} · {fecha(d.fecha)} ·
                  hace {dias} {dias === 1 ? "día" : "días"}
                </p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold">{pesos(saldo)}</p>
                {d.abonado > 0 && (
                  <p className="text-[13px] text-muted-foreground">
                    de {pesos(d.total)}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setAbriendo(abriendo === d.id ? null : d.id)}
                className="rounded-lg border border-border px-4 py-2 text-[14px] transition-colors hover:bg-background"
              >
                Abonar
              </button>
              <button
                onClick={() => saldar(d.id)}
                disabled={saldando === d.id}
                className="rounded-lg bg-foreground px-4 py-2 text-[14px] font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {saldando === d.id ? "Guardando…" : "Marcar pagado"}
              </button>
              {d.telefono && (
                <a
                  href={`https://wa.me/${d.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Hola ${d.propietario ?? ""}, le escribo del taller por el trabajo de la patente ${d.patente}. Queda un saldo de ${pesos(saldo)}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-border px-4 py-2 text-[14px] transition-colors hover:bg-background"
                >
                  Escribirle
                </a>
              )}
            </div>

            {abriendo === d.id && (
              <Abonar deuda={d} onCerrar={() => setAbriendo(null)} />
            )}
          </li>
        );
      })}
    </ul>
  );
}
