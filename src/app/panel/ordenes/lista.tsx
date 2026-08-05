"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { abrirOrden, cambiarEstado, cerrarOrden } from "./acciones";
import { ESTADOS } from "./estados";
import { pesos, fecha } from "@/lib/formato";

type Orden = {
  id: string;
  numero: number;
  sintoma: string | null;
  descripcion: string | null;
  kilometraje: number | null;
  estado: string;
  estadoPago: string;
  total: number;
  abonado: number;
  fecha: Date;
  fechaEntrega: Date | null;
  patente: string;
  marca: string | null;
  modelo: string | null;
  propietario: string | null;
  telefono: string | null;
};

type VehiculoOpcion = {
  id: string;
  patente: string;
  marca: string | null;
  modelo: string | null;
  propietario: string | null;
};

const COLOR_ESTADO: Record<string, string> = {
  ingresado: "bg-muted text-muted-foreground",
  en_proceso: "bg-primary/15 text-primary",
  terminado: "bg-success/15 text-success",
  entregado: "bg-muted text-muted-foreground",
};

function nombreEstado(valor: string) {
  return ESTADOS.find((e) => e.valor === valor)?.texto ?? valor;
}

function campoBase(error?: boolean) {
  return `w-full rounded-lg border bg-background px-3.5 py-2.5 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:ring-1 ${
    error
      ? "border-destructive/70 focus:border-destructive focus:ring-destructive/30"
      : "border-border focus:border-primary/60 focus:ring-primary/30"
  }`;
}

function Abrir({
  vehiculos,
  onListo,
}: {
  vehiculos: VehiculoOpcion[];
  onListo: () => void;
}) {
  const router = useRouter();
  const [vehiculoId, setVehiculoId] = useState("");
  const [kilometraje, setKilometraje] = useState("");
  const [sintoma, setSintoma] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const res = await abrirOrden({ vehiculoId, kilometraje, sintoma });
    setEnviando(false);

    if (res?.error) {
      setError(res.error);
      return;
    }
    onListo();
    router.refresh();
  }

  if (vehiculos.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Necesitas registrar un vehículo antes de abrir una orden.
        </p>
        <button
          onClick={onListo}
          className="mt-4 text-primary hover:underline"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <h2 className="text-lg font-medium">Ingresar vehículo</h2>
      <p className="mt-1 text-[14px] text-muted-foreground">
        Se abre la orden con lo que reporta el cliente. El detalle del trabajo
        se completa después.
      </p>

      <form onSubmit={enviar} className="mt-6 flex flex-col gap-4">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium">Vehículo</span>
          <select
            value={vehiculoId}
            onChange={(e) => setVehiculoId(e.target.value)}
            autoFocus
            className={campoBase()}
          >
            <option value="">Elige el vehículo</option>
            {vehiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.patente}
                {v.marca ? ` · ${v.marca} ${v.modelo ?? ""}` : ""}
                {v.propietario ? ` · ${v.propietario}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium">
            Kilometraje de entrada
          </span>
          <input
            value={kilometraje}
            onChange={(e) => setKilometraje(e.target.value.replace(/\D/g, ""))}
            placeholder="128500"
            inputMode="numeric"
            className={campoBase()}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium">
            Qué reporta el cliente
          </span>
          <textarea
            value={sintoma}
            onChange={(e) => setSintoma(e.target.value)}
            placeholder="Suena adelante al frenar"
            rows={3}
            className={`${campoBase()} resize-y`}
          />
        </label>

        {error && <p className="text-[13px] text-destructive">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={enviando}
            className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {enviando ? "Abriendo…" : "Abrir orden"}
          </button>
          <button
            type="button"
            onClick={onListo}
            className="rounded-lg border border-border px-6 py-3 font-medium transition-colors hover:bg-background"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function Cerrar({ orden, onListo }: { orden: Orden; onListo: () => void }) {
  const router = useRouter();
  const [descripcion, setDescripcion] = useState(orden.descripcion ?? "");
  const [manoObra, setManoObra] = useState("");
  const [repuestos, setRepuestos] = useState("");
  const [estadoPago, setEstadoPago] = useState("pagado");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const total = (Number(manoObra) || 0) + (Number(repuestos) || 0);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const res = await cerrarOrden({
      ordenId: orden.id,
      descripcion,
      manoObra,
      repuestos,
      estadoPago,
    });
    setEnviando(false);

    if (res?.error) {
      setError(res.error);
      return;
    }
    onListo();
    router.refresh();
  }

  return (
    <form
      onSubmit={enviar}
      className="mt-4 rounded-lg border border-border bg-background p-4"
    >
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-medium">
          Qué se hizo
        </span>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Cambio de pastillas delanteras y rectificado de discos"
          rows={2}
          autoFocus
          className={`${campoBase()} resize-y bg-card`}
        />
      </label>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium">
            Mano de obra
          </span>
          <input
            value={manoObra}
            onChange={(e) => setManoObra(e.target.value.replace(/\D/g, ""))}
            placeholder="45000"
            inputMode="numeric"
            className={`${campoBase()} bg-card`}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium">
            Repuestos
          </span>
          <input
            value={repuestos}
            onChange={(e) => setRepuestos(e.target.value.replace(/\D/g, ""))}
            placeholder="80000"
            inputMode="numeric"
            className={`${campoBase()} bg-card`}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium">Pago</span>
          <select
            value={estadoPago}
            onChange={(e) => setEstadoPago(e.target.value)}
            className={`${campoBase()} bg-card`}
          >
            <option value="pagado">Pagado</option>
            <option value="fiado">Fiado</option>
          </select>
        </label>
      </div>

      {total > 0 && (
        <p className="mt-3 text-[15px]">
          Total: <span className="font-semibold">{pesos(total)}</span>
        </p>
      )}

      {error && <p className="mt-2 text-[13px] text-destructive">{error}</p>}

      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {enviando ? "Guardando…" : "Cerrar orden"}
        </button>
        <button
          type="button"
          onClick={onListo}
          className="rounded-lg border border-border px-5 py-2.5 transition-colors hover:bg-card"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function ListaOrdenes({
  ordenes,
  vehiculos,
}: {
  ordenes: Orden[];
  vehiculos: VehiculoOpcion[];
}) {
  const router = useRouter();
  const [abriendo, setAbriendo] = useState(false);
  const [cerrando, setCerrando] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("abiertas");

  const visibles =
    filtro === "abiertas"
      ? ordenes.filter((o) => o.estado !== "entregado")
      : ordenes;

  async function avanzar(id: string, estado: string) {
    await cambiarEstado(id, estado);
    router.refresh();
  }

  if (abriendo) {
    return <Abrir vehiculos={vehiculos} onListo={() => setAbriendo(false)} />;
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {[
            { valor: "abiertas", texto: "Abiertas" },
            { valor: "todas", texto: "Todas" },
          ].map((f) => (
            <button
              key={f.valor}
              onClick={() => setFiltro(f.valor)}
              className={`rounded px-4 py-1.5 text-[14px] transition-colors ${
                filtro === f.valor
                  ? "bg-card font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.texto}
            </button>
          ))}
        </div>
        <button
          onClick={() => setAbriendo(true)}
          className="rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Ingresar vehículo
        </button>
      </div>

      {visibles.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">
            {ordenes.length === 0
              ? "Todavía no hay órdenes de trabajo."
              : "No hay órdenes abiertas."}
          </p>
          {ordenes.length === 0 && (
            <button
              onClick={() => setAbriendo(true)}
              className="mt-4 text-primary hover:underline"
            >
              Ingresar el primer vehículo
            </button>
          )}
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {visibles.map((o) => {
            const saldo = o.total - o.abonado;

            return (
              <li
                key={o.id}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[13px] text-muted-foreground">
                        OT-{o.numero}
                      </span>
                      <span className="font-mono font-medium">{o.patente}</span>
                      {o.marca && (
                        <span className="text-muted-foreground">
                          {o.marca} {o.modelo}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${COLOR_ESTADO[o.estado]}`}
                      >
                        {nombreEstado(o.estado)}
                      </span>
                      {o.estadoPago !== "pagado" && o.total > 0 && (
                        <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[12px] font-medium text-primary">
                          Debe {pesos(saldo)}
                        </span>
                      )}
                    </div>

                    {o.sintoma && (
                      <p className="mt-2 text-[15px]">
                        <span className="text-muted-foreground">Reporta: </span>
                        {o.sintoma}
                      </p>
                    )}
                    {o.descripcion && (
                      <p className="mt-1 text-[15px]">
                        <span className="text-muted-foreground">Se hizo: </span>
                        {o.descripcion}
                      </p>
                    )}

                    <p className="mt-1.5 text-[13px] text-muted-foreground">
                      {o.propietario ?? "Sin dueño registrado"} ·{" "}
                      {fecha(o.fecha)}
                      {o.kilometraje
                        ? ` · ${o.kilometraje.toLocaleString("es-CL")} km`
                        : ""}
                    </p>
                  </div>

                  {o.total > 0 && (
                    <p className="text-xl font-semibold">{pesos(o.total)}</p>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {o.estado === "ingresado" && (
                    <button
                      onClick={() => avanzar(o.id, "en_proceso")}
                      className="rounded-lg border border-border px-4 py-2 text-[14px] transition-colors hover:bg-background"
                    >
                      Empezar
                    </button>
                  )}
                  {(o.estado === "ingresado" || o.estado === "en_proceso") && (
                    <button
                      onClick={() =>
                        setCerrando(cerrando === o.id ? null : o.id)
                      }
                      className="rounded-lg bg-primary px-4 py-2 text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    >
                      Terminar
                    </button>
                  )}
                  {o.estado === "terminado" && (
                    <>
                      <button
                        onClick={() => avanzar(o.id, "entregado")}
                        className="rounded-lg bg-primary px-4 py-2 text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        Entregar
                      </button>
                      {o.telefono && (
                        <a
                          href={`https://wa.me/${o.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(
                            `Hola ${o.propietario ?? ""}, su ${o.marca ?? "vehículo"} patente ${o.patente} ya está listo para retirar.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-border px-4 py-2 text-[14px] transition-colors hover:bg-background"
                        >
                          Avisar que está listo
                        </a>
                      )}
                    </>
                  )}
                </div>

                {cerrando === o.id && (
                  <Cerrar orden={o} onListo={() => setCerrando(null)} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
