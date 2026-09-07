"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pesos, fecha as formatoFecha, miles, soloDigitos } from "@/lib/formato";
import { Selector } from "@/components/ui/selector";
import { Button } from "@/components/ui/button";
import {
  registrarMovimiento,
  cerrarCaja,
  type MovimientoDia,
} from "./acciones";

type Resumen = {
  disponibleAnterior: number;
  totalIngresos: number;
  totalEgresos: number;
  disponibleDelDia: number;
  cerrado: boolean;
};

const TIPOS_FILTRO = [
  { valor: "todos", texto: "Todos los tipos" },
  { valor: "ingreso", texto: "Ingresos" },
  { valor: "egreso", texto: "Egresos" },
];

const ORIGENES_FILTRO = [
  { valor: "todos", texto: "Todos los orígenes" },
  { valor: "orden", texto: "Órdenes" },
  { valor: "venta", texto: "Ventas POS" },
  { valor: "manual", texto: "Manual" },
];

const ETIQUETA_ORIGEN: Record<string, string> = {
  orden: "Orden",
  venta: "Venta POS",
  manual: "Manual",
};

function ModalNuevoMovimiento({ onCerrar }: { onCerrar: () => void }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<"ingreso" | "egreso">("egreso");
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [referencia, setReferencia] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const campo =
    "w-full rounded-lg border border-border bg-background px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30";

  async function guardar() {
    setError(null);
    setEnviando(true);
    const res = await registrarMovimiento({
      tipo,
      monto: Number(monto) || 0,
      descripcion,
      referencia,
    });
    setEnviando(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    onCerrar();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        aria-label="Cancelar"
        onClick={onCerrar}
        className="absolute inset-0 bg-black/60"
      />
      <div
        role="dialog"
        aria-modal
        className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 sm:p-8"
      >
        <h2 className="text-lg font-medium">Registrar movimiento</h2>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Un gasto, un retiro, o un ingreso que no vino de una orden ni de
          una venta.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex rounded-lg border border-border p-1">
            <button
              type="button"
              onClick={() => setTipo("ingreso")}
              className={`flex-1 rounded-md px-4 py-2 text-[14px] font-medium transition-colors ${
                tipo === "ingreso"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Ingreso
            </button>
            <button
              type="button"
              onClick={() => setTipo("egreso")}
              className={`flex-1 rounded-md px-4 py-2 text-[14px] font-medium transition-colors ${
                tipo === "egreso"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Egreso
            </button>
          </div>

          <div>
            <span className="mb-2 block text-[13px] font-medium">
              Descripción
            </span>
            <input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej. Compra de trapos, retiro para caja chica…"
              autoFocus
              className={campo}
            />
          </div>

          <div>
            <span className="mb-2 block text-[13px] font-medium">Monto</span>
            <input
              value={miles(monto)}
              onChange={(e) => setMonto(soloDigitos(e.target.value))}
              placeholder="0"
              inputMode="numeric"
              className={campo}
            />
          </div>

          <div>
            <span className="mb-2 block text-[13px] font-medium">
              Referencia (opcional)
            </span>
            <input
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="N° boleta, comprobante…"
              className={campo}
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 text-[13px] text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button type="button" onClick={guardar} disabled={enviando}>
            {enviando ? "Guardando…" : "Registrar"}
          </Button>
          <Button variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

export function VistaCaja({
  fecha,
  resumen,
  movimientos,
}: {
  fecha: string;
  resumen: Resumen;
  movimientos: MovimientoDia[];
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroOrigen, setFiltroOrigen] = useState("todos");
  const [registrando, setRegistrando] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [errorCierre, setErrorCierre] = useState<string | null>(null);

  function irA(nuevaFecha: string) {
    router.push(`/panel/caja?fecha=${nuevaFecha}`);
  }

  function cambiarDia(delta: number) {
    const d = new Date(fecha + "T00:00:00");
    d.setDate(d.getDate() + delta);
    irA(d.toISOString().slice(0, 10));
  }

  async function confirmarCierre() {
    setErrorCierre(null);
    setCerrando(true);
    const res = await cerrarCaja(fecha);
    setCerrando(false);
    if (res?.error) {
      setErrorCierre(res.error);
      return;
    }
    router.refresh();
  }

  const q = busqueda.trim().toLowerCase();
  const filtrados = movimientos.filter((m) => {
    if (filtroTipo !== "todos" && m.tipo !== filtroTipo) return false;
    if (filtroOrigen !== "todos" && m.origen !== filtroOrigen) return false;
    if (q && !m.descripcion.toLowerCase().includes(q) && !m.referencia?.toLowerCase().includes(q)) {
      return false;
    }
    return true;
  });

  return (
    <>
      {registrando && (
        <ModalNuevoMovimiento onCerrar={() => setRegistrando(false)} />
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => cambiarDia(-1)}
            aria-label="Día anterior"
            className="flex size-9 items-center justify-center rounded-lg border border-border hover:bg-card"
          >
            <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
              <path
                d="M12.5 5L7 10l5.5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <input
            type="date"
            value={fecha}
            onChange={(e) => irA(e.target.value)}
            className="rounded-lg border border-border bg-card px-4 py-2 text-[14px] outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
          />
          <button
            type="button"
            onClick={() => cambiarDia(1)}
            aria-label="Día siguiente"
            className="flex size-9 items-center justify-center rounded-lg border border-border hover:bg-card"
          >
            <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
              <path
                d="M7.5 5L13 10l-5.5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={confirmarCierre}
            disabled={resumen.cerrado || cerrando}
          >
            {resumen.cerrado
              ? "Caja cerrada"
              : cerrando
                ? "Cerrando…"
                : "Cerrar caja"}
          </Button>
          <Button onClick={() => setRegistrando(true)}>
            + Registrar movimiento
          </Button>
        </div>
      </div>

      {errorCierre && (
        <p className="mt-2 text-[13px] text-destructive" role="alert">
          {errorCierre}
        </p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
            Disponible anterior
          </p>
          <p className="mt-2 text-2xl font-bold">
            {pesos(resumen.disponibleAnterior)}
          </p>
        </div>
        <div className="rounded-xl border border-success/30 bg-success/10 p-4">
          <p className="text-[12px] font-medium tracking-wide text-success uppercase">
            Total ingresos
          </p>
          <p className="mt-2 text-2xl font-bold text-success">
            {pesos(resumen.totalIngresos)}
          </p>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-[12px] font-medium tracking-wide text-destructive uppercase">
            Total egresos
          </p>
          <p className="mt-2 text-2xl font-bold text-destructive">
            {pesos(resumen.totalEgresos)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
            Disponible del día
          </p>
          <p className="mt-2 text-2xl font-bold">
            {pesos(resumen.disponibleDelDia)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por descripción o referencia…"
          className="flex-1 rounded-lg border border-border bg-card px-4 py-2 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
        />
        <div className="sm:w-48">
          <Selector value={filtroTipo} onChange={setFiltroTipo} opciones={TIPOS_FILTRO} />
        </div>
        <div className="sm:w-48">
          <Selector
            value={filtroOrigen}
            onChange={setFiltroOrigen}
            opciones={ORIGENES_FILTRO}
          />
        </div>
      </div>

      {filtrados.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="font-medium">Sin movimientos de caja</p>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Los ingresos y egresos aparecerán aquí al registrar abonos,
            ventas POS o movimientos manuales.
          </p>
          <Button onClick={() => setRegistrando(true)} className="mt-4">
            + Registrar movimiento
          </Button>
        </div>
      ) : (
        <div className="scroll-discreto mt-6 overflow-x-auto rounded-xl border border-border">
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-border bg-card">
                {["Descripción", "Tipo", "Origen", "Monto", "Hora"].map((c) => (
                  <th
                    key={c}
                    className="px-4 py-3 text-left font-medium whitespace-nowrap text-muted-foreground"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtrados.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-border last:border-0 hover:bg-card/50"
                >
                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    {m.descripcion}
                    {m.referencia && (
                      <span className="ml-2 text-[12px] text-muted-foreground">
                        {m.referencia}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`rounded-full px-2 py-1 text-[12px] font-medium ${
                        m.tipo === "ingreso"
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {m.tipo === "ingreso" ? "Ingreso" : "Egreso"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {ETIQUETA_ORIGEN[m.origen]}
                  </td>
                  <td
                    className={`px-4 py-3 whitespace-nowrap font-medium tabular-nums ${
                      m.tipo === "ingreso" ? "text-success" : "text-destructive"
                    }`}
                  >
                    {m.tipo === "ingreso" ? "+" : "-"}
                    {pesos(m.monto)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {formatoFecha(m.fecha)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
