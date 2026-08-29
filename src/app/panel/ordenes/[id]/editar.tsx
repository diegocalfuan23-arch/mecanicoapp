"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  cerrarOrden,
  editarOrdenAbierta,
  repuestosDeOrden,
  serviciosDeOrden,
  procedimientosDeOrden,
  type RepuestoUsado,
  type Procedimiento,
} from "../acciones";
import { pesos, miles, soloDigitos } from "@/lib/formato";
import { Dictar } from "@/components/dictar";
import { FotosVehiculo } from "@/components/fotos-vehiculo";
import { Selector } from "@/components/ui/selector";
import { Procedimientos } from "@/components/procedimientos";

type Orden = {
  id: string;
  numero: number;
  sintoma: string | null;
  diagnostico: string | null;
  descripcion: string | null;
  kilometraje: number | null;
  fotos: string[];
  estado: string;
  esperaDetalle: string | null;
  estadoPago: string;
  total: number;
  abonado: number;
  fecha: Date;
  fechaEntrega: Date | null;
  tecnicoId: string | null;
  patente: string;
  marca: string | null;
  modelo: string | null;
  propietario: string | null;
  telefono: string | null;
};

type Tecnico = { id: string; nombre: string };
type Servicio = { id: string; grupo: string; codigo: string; etiqueta: string };

function campoBase(error?: boolean) {
  return `w-full rounded-lg border bg-background px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:ring-1 ${
    error
      ? "border-destructive/70 focus:border-destructive focus:ring-destructive/30"
      : "border-border focus:border-primary/60 focus:ring-primary/30"
  }`;
}

export function EditarOrden({
  orden,
  tieneImpresion,
  tecnicos,
  servicios: catalogoServicios,
}: {
  orden: Orden;
  tieneImpresion: boolean;
  tecnicos: Tecnico[];
  servicios: Servicio[];
}) {
  const router = useRouter();
  const [sintoma, setSintoma] = useState(orden.sintoma ?? "");
  const [kilometraje, setKilometraje] = useState(
    orden.kilometraje ? String(orden.kilometraje) : ""
  );
  const [diagnostico, setDiagnostico] = useState(orden.diagnostico ?? "");
  const [tecnicoId, setTecnicoId] = useState(orden.tecnicoId ?? "");
  const [fotos, setFotos] = useState<string[]>(orden.fotos);
  const [guardadoAbierta, setGuardadoAbierta] = useState(false);
  const [manoObraFreno, setManoObraFreno] = useState("");
  const [cargoTraslado, setCargoTraslado] = useState("");
  const [mostrarManoObraFreno, setMostrarManoObraFreno] = useState(false);
  const [mostrarServicios, setMostrarServicios] = useState(false);
  const [estadoPago, setEstadoPago] = useState("pagado");
  const [montoAbonado, setMontoAbonado] = useState("");
  const [conIva, setConIva] = useState(false);
  const [piezas, setPiezas] = useState<RepuestoUsado[]>([]);
  const [servicios, setServicios] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function alternarServicio(id: string) {
    setServicios((actual) =>
      actual.includes(id) ? actual.filter((s) => s !== id) : [...actual, id]
    );
  }

  // Si ya se cotizaron repuestos al abrir la orden (Plan Serviteca), se
  // precargan acá para no anotarlos dos veces — el mecánico solo los
  // confirma o ajusta antes de cerrar.
  useEffect(() => {
    repuestosDeOrden(orden.id).then((previas) => {
      if (previas.length === 0) return;
      setPiezas(
        previas.map((p) => ({
          nombre: p.nombre,
          cantidad: String(p.cantidad),
          costo: String(p.costoUnitario),
          precio: String(p.precioUnitario),
          donde: p.dondeSeCompro ?? "",
          parteId: p.parteId,
        }))
      );
    });
  }, [orden.id]);

  useEffect(() => {
    if (!tieneImpresion) return;
    serviciosDeOrden(orden.id).then(setServicios);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orden.id]);

  // Lo que se va haciendo mientras la orden sigue abierta, línea por
  // línea con su costo — pedido real de Tío Lalo: cambia algo (ej.
  // "cambio de embrague"), anota mano de obra + repuesto de esa
  // línea, y ve el total acumulado del cliente. Un solo lugar para
  // ver y editar la orden, se cierre hoy o no.
  const [procedimientos, setProcedimientos] = useState<Procedimiento[]>([]);
  // "Qué se hizo" y sus montos ya no se escriben aparte: salen de los
  // procedimientos anotados arriba — un solo lugar para esa info, sin
  // duplicar campos abajo.
  const descripcion = procedimientos.map((p) => p.descripcion).join(", ");
  const manoObra = String(
    procedimientos.reduce((s, p) => s + p.manoObra, 0) || ""
  );
  const repuestos = String(
    procedimientos.reduce((s, p) => s + p.repuesto, 0) || ""
  );

  useEffect(() => {
    procedimientosDeOrden(orden.id).then(setProcedimientos);
  }, [orden.id]);

  // Guarda síntoma/diagnóstico/técnico sin cerrar la orden — separado
  // de enviar(), que sí cierra. El mecánico puede ir dejando esto al
  // día sin tener que completar el cierre financiero todavía.
  async function guardarAbierta() {
    await editarOrdenAbierta(orden.id, {
      sintoma,
      kilometraje,
      diagnostico,
      descripcion,
      tecnicoId,
      fotos,
    });
    setGuardadoAbierta(true);
    setTimeout(() => setGuardadoAbierta(false), 1500);
    router.refresh();
  }

  // Si se detallaron los repuestos, el cobro sale de ellos.
  const cobroRepuestos = piezas.length
    ? piezas.reduce(
        (s, p) => s + (Number(p.precio) || 0) * (Number(p.cantidad) || 1),
        0
      )
    : Number(repuestos) || 0;

  // El IVA se suma encima del neto, no viene incluido.
  const neto =
    (Number(manoObra) || 0) +
    (Number(manoObraFreno) || 0) +
    cobroRepuestos +
    (Number(cargoTraslado) || 0);
  const iva = conIva ? Math.round(neto * 0.19) : 0;
  const total = neto + iva;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const res = await cerrarOrden({
      ordenId: orden.id,
      descripcion,
      manoObra,
      manoObraFreno,
      repuestos,
      cargoTraslado,
      estadoPago,
      montoAbonado: estadoPago === "fiado" ? montoAbonado : "",
      conIva,
      piezas,
      servicios,
      fotos,
    });
    setEnviando(false);

    if (res?.error) {
      setError(res.error);
      return;
    }
    router.push("/panel/ordenes");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-background p-4">
        <p className="mb-3 text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">
          Datos del vehículo
        </p>
        <label className="block">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] font-medium">Qué reporta el cliente</span>
            <Dictar
              onTexto={(texto) =>
                setSintoma((a) => (a ? `${a} ${texto}` : texto))
              }
            />
          </div>
          <textarea
            value={sintoma}
            onChange={(e) => setSintoma(e.target.value)}
            onBlur={guardarAbierta}
            placeholder="Suena adelante al frenar"
            rows={1}
            className={`${campoBase()} resize-y bg-card`}
          />
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">
              Kilometraje
            </span>
            <input
              value={miles(kilometraje)}
              onChange={(e) => setKilometraje(soloDigitos(e.target.value))}
              onBlur={guardarAbierta}
              placeholder="128.500"
              inputMode="numeric"
              className={`${campoBase()} bg-card`}
            />
          </label>

          {tecnicos.length > 0 && (
            <div>
              <span className="mb-2 block text-[13px] font-medium">
                Técnico a cargo
              </span>
              <Selector
                value={tecnicoId}
                onChange={async (valor) => {
                  setTecnicoId(valor);
                  await editarOrdenAbierta(orden.id, {
                    sintoma,
                    kilometraje,
                    diagnostico,
                    descripcion,
                    tecnicoId: valor,
                  });
                  router.refresh();
                }}
                className="bg-card"
                placeholder="Sin asignar"
                opciones={tecnicos.map((t) => ({
                  valor: t.id,
                  texto: t.nombre,
                }))}
              />
            </div>
          )}
        </div>

        <label className="mt-4 block">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] font-medium">Diagnóstico</span>
            <Dictar
              onTexto={(texto) =>
                setDiagnostico((a) => (a ? `${a} ${texto}` : texto))
              }
            />
          </div>
          <textarea
            value={diagnostico}
            onChange={(e) => setDiagnostico(e.target.value)}
            onBlur={guardarAbierta}
            placeholder="Retenes de la caja desgastados, causando la fuga"
            rows={1}
            className={`${campoBase()} resize-y bg-card`}
          />
        </label>

        <div className="mt-4">
          <FotosVehiculo
            fotos={fotos}
            onCambio={(f) => {
              setFotos(f);
              editarOrdenAbierta(orden.id, {
                sintoma,
                kilometraje,
                diagnostico,
                descripcion,
                tecnicoId,
                fotos: f,
              });
              router.refresh();
            }}
            onError={setError}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background p-4">
        <p className="mb-3 text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">
          Qué se hizo
        </p>
        <Procedimientos
          ordenId={orden.id}
          items={procedimientos}
          onCambio={setProcedimientos}
        />
      </div>

      <div className="rounded-lg border border-border bg-background p-4">
        <p className="mb-3 text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">
          Cobro
        </p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <span className="mb-2 block text-[13px] font-medium">
              Mano de obra
            </span>
            <p className={`${campoBase()} bg-card text-muted-foreground`}>
              {manoObra ? pesos(Number(manoObra)) : "—"}
            </p>
          </div>
          {tieneImpresion && (mostrarManoObraFreno || manoObraFreno) && (
            <label className="block">
              <span className="mb-2 block text-[13px] font-medium">
                Mano de obra freno
              </span>
              <input
                value={miles(manoObraFreno)}
                onChange={(e) =>
                  setManoObraFreno(soloDigitos(e.target.value))
                }
                placeholder="15.000"
                inputMode="numeric"
                autoFocus
                className={`${campoBase()} bg-card`}
              />
            </label>
          )}
          {/* Cuando se detallan los repuestos cotizados al abrir
              (Plan Serviteca), el cobro sale de ellos en vez de la
              suma de procedimientos. */}
          {piezas.length === 0 && (
            <div>
              <span className="mb-2 block text-[13px] font-medium">
                Repuestos
              </span>
              <p className={`${campoBase()} bg-card text-muted-foreground`}>
                {repuestos ? pesos(Number(repuestos)) : "—"}
              </p>
            </div>
          )}
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">
              Cargo por ir a comprar
            </span>
            <input
              value={miles(cargoTraslado)}
              onChange={(e) => setCargoTraslado(soloDigitos(e.target.value))}
              placeholder="3.000"
              inputMode="numeric"
              className={`${campoBase()} bg-card`}
            />
          </label>
          <div>
            <span className="mb-2 block text-[13px] font-medium">Pago</span>
            <Selector
              value={estadoPago}
              onChange={setEstadoPago}
              className="bg-card"
              opciones={[
                { valor: "pagado", texto: "Pagado" },
                { valor: "fiado", texto: "Fiado" },
              ]}
            />
          </div>
        </div>

        {/* Campos que casi nunca hacen falta, escondidos detrás de un
            enlace — pedido de Tío Lalo: el formulario se sentía largo
            con todo siempre visible. */}
        <div className="mt-3 flex flex-wrap gap-4">
          {tieneImpresion && !mostrarManoObraFreno && !manoObraFreno && (
            <button
              type="button"
              onClick={() => setMostrarManoObraFreno(true)}
              className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              + Mano de obra freno
            </button>
          )}
        </div>

        {/* Solo si quedó fiado: cuánto entregó ahora, para no perder ese
            dato saltando a Pagos después a anotarlo aparte. */}
        {estadoPago === "fiado" && (
          <label className="mt-4 block">
            <span className="mb-2 block text-[13px] font-medium">
              ¿Abonó algo ahora? (opcional)
            </span>
            <input
              value={miles(montoAbonado)}
              onChange={(e) => setMontoAbonado(soloDigitos(e.target.value))}
              placeholder="40.000"
              inputMode="numeric"
              className={`${campoBase()} bg-card`}
            />
          </label>
        )}

        {/* Checklist de servicios propio del taller — Plan Serviteca,
            pedido por Senna, configurable en /panel/servicios. Aparte
            del texto libre de arriba: sirve para marcar rápido lo
            típico (cambio de aceite, balanceo...) sin escribirlo. */}
        {tieneImpresion && catalogoServicios.length > 0 && (
          <div className="mt-4 rounded-lg border border-border bg-card p-4">
            <button
              type="button"
              onClick={() => setMostrarServicios((a) => !a)}
              className="flex w-full items-center justify-between text-left text-[13px] font-medium"
            >
              <span>
                Servicios realizados
                {servicios.length > 0 && (
                  <span className="ml-2 font-normal text-muted-foreground">
                    {servicios.length} marcados
                  </span>
                )}
              </span>
              <svg
                viewBox="0 0 20 20"
                className={`size-4 shrink-0 text-muted-foreground transition-transform ${mostrarServicios ? "rotate-180" : ""}`}
                aria-hidden
              >
                <path
                  d="M5 7.5l5 5 5-5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {mostrarServicios && (
              <div className="mt-3 flex flex-col gap-4">
                {Array.from(new Set(catalogoServicios.map((s) => s.grupo))).map(
                  (grupo) => (
                    <div key={grupo}>
                      <p className="mb-2 text-[12px] font-medium text-muted-foreground">
                        {grupo}
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {catalogoServicios
                          .filter((s) => s.grupo === grupo)
                          .map((s) => (
                            <label
                              key={s.id}
                              className="flex items-center gap-2 text-[14px]"
                            >
                              <input
                                type="checkbox"
                                checked={servicios.includes(s.id)}
                                onChange={() => alternarServicio(s.id)}
                                className="size-4 accent-primary"
                              />
                              <span className="text-muted-foreground">
                                {s.codigo}
                              </span>
                              {s.etiqueta}
                            </label>
                          ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        )}

        <label className="mt-4 flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-4">
          <input
            type="checkbox"
            checked={conIva}
            onChange={(e) => setConIva(e.target.checked)}
            className="size-4 accent-primary"
          />
          <span className="text-[15px]">Sumar IVA (19%)</span>
        </label>

        {neto > 0 && (
          <div className="mt-4 flex flex-col gap-1 text-[15px]">
            {conIva && (
              <>
                <p className="flex justify-between text-muted-foreground">
                  <span>Neto</span>
                  <span className="tabular-nums">{pesos(neto)}</span>
                </p>
                <p className="flex justify-between text-muted-foreground">
                  <span>IVA 19%</span>
                  <span className="tabular-nums">{pesos(iva)}</span>
                </p>
              </>
            )}
            <p className="flex justify-between border-t border-border pt-2">
              <span>Total</span>
              <span className="text-lg font-semibold tabular-nums">
                {pesos(total)}
              </span>
            </p>
          </div>
        )}
      </div>

      {error && <p className="text-[13px] text-destructive">{error}</p>}

      {/* En móvil, la barra de acciones queda pegada al fondo de la
          pantalla al hacer scroll: sin esto había que bajar por toda
          la sección de cobro solo para llegar a "Cerrar orden".
          sticky (no fixed) para que se ancle al scroll real del
          panel — <main> tiene su propio overflow-y-auto, así que un
          "fixed" queda mal alineado con lo que realmente scrollea.
          Desde sm: hay espacio de sobra y vuelve al flujo normal. */}
      <div className="sticky bottom-0 -mx-4 z-10 flex flex-wrap items-center gap-4 border-t border-border bg-background p-4 sm:relative sm:inset-auto sm:z-auto sm:mx-0 sm:border-t-0 sm:bg-transparent sm:p-0">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {enviando ? "Guardando…" : "Cerrar orden"}
        </button>
        <button
          type="button"
          onClick={guardarAbierta}
          className="rounded-lg border border-border px-6 py-2 font-medium transition-colors hover:bg-card"
        >
          Guardar sin cerrar
        </button>
        <button
          type="button"
          onClick={() => router.push("/panel/ordenes")}
          className="rounded-lg border border-border px-6 py-2 transition-colors hover:bg-card"
        >
          Cancelar
        </button>
        {guardadoAbierta && (
          <span className="text-[13px] text-muted-foreground">Guardado</span>
        )}
      </div>
    </form>
  );
}

