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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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
  metodoPago: string | null;
  cuotas: number | null;
  manoObraFreno: number;
  cargoTraslado: number;
  total: number;
  abonado: number;
  fecha: Date;
  fechaEntrega: Date | null;
  tecnicoId: string | null;
  tecnicoNombre: string | null;
  patente: string;
  marca: string | null;
  modelo: string | null;
  propietario: string | null;
  telefono: string | null;
};

type Tecnico = { id: string; nombre: string };
type Servicio = { id: string; grupo: string; codigo: string; etiqueta: string };

// Valor de opción imposible de chocar con un id real de usuario —
// selecciona el modo "escribir nombre libre" en vez de un técnico.
const OTRO_TECNICO = "__otro__";

function Seccion({
  numero,
  titulo,
  eyebrow,
  children,
}: {
  numero: string;
  titulo: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="ring-border/60">
      <CardHeader className="border-b border-border/60 pb-4">
        <span className="text-[11px] font-bold tracking-wider text-primary uppercase">
          {numero} · {eyebrow}
        </span>
        <h2 className="text-base font-semibold tracking-tight">{titulo}</h2>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">{children}</CardContent>
    </Card>
  );
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
  const [tecnicoNombre, setTecnicoNombre] = useState(
    orden.tecnicoNombre ?? ""
  );
  const [usaTecnicoLibre, setUsaTecnicoLibre] = useState(
    !!orden.tecnicoNombre
  );
  const [fotos, setFotos] = useState<string[]>(orden.fotos);
  const [guardadoAbierta, setGuardadoAbierta] = useState(false);
  const [manoObraFreno, setManoObraFreno] = useState(
    orden.manoObraFreno ? String(orden.manoObraFreno) : ""
  );
  const [cargoTraslado, setCargoTraslado] = useState(
    orden.cargoTraslado ? String(orden.cargoTraslado) : ""
  );
  const [mostrarManoObraFreno, setMostrarManoObraFreno] = useState(
    orden.manoObraFreno > 0
  );
  const [mostrarServicios, setMostrarServicios] = useState(false);
  const [estadoPago, setEstadoPago] = useState(orden.estadoPago || "pagado");
  const [metodoPago, setMetodoPago] = useState(orden.metodoPago ?? "");
  const [cuotas, setCuotas] = useState(orden.cuotas ? String(orden.cuotas) : "");
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
  const descripcion = procedimientos.map((p) => p.descripcion).join(", ");
  // Mano de obra y Repuestos se precargan sumando los procedimientos,
  // pero quedan editables a mano — pedido real de Tío Lalo: una
  // orden puede cobrarse sin pasar por "Qué se hizo" línea por línea.
  const [manoObra, setManoObra] = useState("");
  const [repuestos, setRepuestos] = useState("");
  const [montosPersonalizados, setMontosPersonalizados] = useState(false);

  useEffect(() => {
    procedimientosDeOrden(orden.id).then((items) => {
      setProcedimientos(items);
      if (montosPersonalizados) return;
      setManoObra(
        String(items.reduce((s, p) => s + p.manoObra, 0) || "")
      );
      setRepuestos(
        String(items.reduce((s, p) => s + p.repuesto, 0) || "")
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orden.id]);

  // Cada cambio en "Qué se hizo" recalcula Mano de obra/Repuestos
  // solo mientras el mecánico no los haya editado a mano — una vez
  // que los toca, esos campos quedan bajo su control y dejan de
  // seguir a los procedimientos.
  function onCambioProcedimientos(
    accion: React.SetStateAction<Procedimiento[]>
  ) {
    setProcedimientos((actuales) => {
      const items = typeof accion === "function" ? accion(actuales) : accion;
      if (!montosPersonalizados) {
        setManoObra(String(items.reduce((s, p) => s + p.manoObra, 0) || ""));
        setRepuestos(String(items.reduce((s, p) => s + p.repuesto, 0) || ""));
      }
      return items;
    });
  }

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
      manoObraFreno,
      cargoTraslado,
      estadoPago,
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
      metodoPago: estadoPago === "pagado" ? metodoPago : "",
      cuotas: estadoPago === "pagado" && metodoPago === "credito" ? cuotas : "",
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
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <Seccion numero="01" eyebrow="Información" titulo="Datos del vehículo">
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <Label className="text-[13px] font-medium">
              Qué reporta el cliente
            </Label>
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
            className="w-full resize-y rounded-lg border border-border bg-input/30 px-3 py-2 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-2 block text-[13px] font-medium">
              Kilometraje
            </Label>
            <Input
              value={miles(kilometraje)}
              onChange={(e) => setKilometraje(soloDigitos(e.target.value))}
              onBlur={guardarAbierta}
              placeholder="128.500"
              inputMode="numeric"
              className="rounded-lg"
            />
          </div>

          {tecnicos.length > 0 && (
            <div>
              <Label className="mb-2 block text-[13px] font-medium">
                Técnico a cargo
              </Label>
              <Selector
                value={usaTecnicoLibre ? OTRO_TECNICO : tecnicoId}
                onChange={async (valor) => {
                  if (valor === OTRO_TECNICO) {
                    // Solo cambia el modo del campo — todavía no hay
                    // nombre que guardar, se guarda al escribirlo.
                    setUsaTecnicoLibre(true);
                    setTecnicoId("");
                    return;
                  }
                  setUsaTecnicoLibre(false);
                  setTecnicoId(valor);
                  setTecnicoNombre("");
                  await editarOrdenAbierta(orden.id, {
                    sintoma,
                    kilometraje,
                    diagnostico,
                    descripcion,
                    tecnicoId: valor,
                  });
                  router.refresh();
                }}
                placeholder="Sin asignar"
                opciones={[
                  ...tecnicos.map((t) => ({ valor: t.id, texto: t.nombre })),
                  { valor: OTRO_TECNICO, texto: "Otro (sin cuenta)…" },
                ]}
              />
              {usaTecnicoLibre && (
                <Input
                  value={tecnicoNombre}
                  onChange={(e) => setTecnicoNombre(e.target.value)}
                  onBlur={async () => {
                    await editarOrdenAbierta(orden.id, {
                      sintoma,
                      kilometraje,
                      diagnostico,
                      descripcion,
                      tecnicoNombre,
                    });
                    router.refresh();
                  }}
                  placeholder="Nombre del técnico"
                  autoFocus
                  className="mt-2 rounded-lg"
                />
              )}
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <Label className="text-[13px] font-medium">Diagnóstico</Label>
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
            className="w-full resize-y rounded-lg border border-border bg-input/30 px-3 py-2 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>

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
      </Seccion>

      <Seccion numero="02" eyebrow="Registro" titulo="Qué se hizo">
        <Procedimientos
          ordenId={orden.id}
          items={procedimientos}
          onCambio={onCambioProcedimientos}
        />
      </Seccion>

      <Seccion numero="03" eyebrow="Total" titulo="Cobro">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <Label className="mb-2 block text-[13px] font-medium">
              Mano de obra
            </Label>
            <Input
              value={miles(manoObra)}
              onChange={(e) => {
                setMontosPersonalizados(true);
                setManoObra(soloDigitos(e.target.value));
              }}
              placeholder="0"
              inputMode="numeric"
              className="rounded-lg"
            />
          </div>
          {tieneImpresion && (mostrarManoObraFreno || manoObraFreno) && (
            <div>
              <Label className="mb-2 block text-[13px] font-medium">
                Mano de obra freno
              </Label>
              <Input
                value={miles(manoObraFreno)}
                onChange={(e) =>
                  setManoObraFreno(soloDigitos(e.target.value))
                }
                placeholder="15.000"
                inputMode="numeric"
                autoFocus
                className="rounded-lg"
              />
            </div>
          )}
          {/* Cuando se detallan los repuestos cotizados al abrir
              (Plan Serviteca), el cobro sale de ellos y este campo
              se oculta para no cobrar el mismo repuesto dos veces. */}
          {piezas.length === 0 && (
            <div>
              <Label className="mb-2 block text-[13px] font-medium">
                Repuestos
              </Label>
              <Input
                value={miles(repuestos)}
                onChange={(e) => {
                  setMontosPersonalizados(true);
                  setRepuestos(soloDigitos(e.target.value));
                }}
                placeholder="0"
                inputMode="numeric"
                className="rounded-lg"
              />
            </div>
          )}
          <div>
            <Label className="mb-2 block text-[13px] font-medium">
              Cargo por ir a comprar
            </Label>
            <Input
              value={miles(cargoTraslado)}
              onChange={(e) => setCargoTraslado(soloDigitos(e.target.value))}
              placeholder="3.000"
              inputMode="numeric"
              className="rounded-lg"
            />
          </div>
          <div>
            <Label className="mb-2 block text-[13px] font-medium">Pago</Label>
            <Selector
              value={estadoPago}
              onChange={setEstadoPago}
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
        {tieneImpresion && !mostrarManoObraFreno && !manoObraFreno && (
          <button
            type="button"
            onClick={() => setMostrarManoObraFreno(true)}
            className="self-start text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            + Mano de obra freno
          </button>
        )}

        {/* Método de pago: solo tiene sentido si quedó pagado, y solo
            en Plan Serviteca — la máquina POS de tarjeta no está
            conectada al sistema, esto es lo que el mecánico marca a
            mano después de cobrar. */}
        {tieneImpresion && estadoPago === "pagado" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-2 block text-[13px] font-medium">
                Método de pago (opcional)
              </Label>
              <Selector
                value={metodoPago}
                onChange={(v) => {
                  setMetodoPago(v);
                  if (v !== "credito") setCuotas("");
                }}
                opciones={[
                  { valor: "efectivo", texto: "Efectivo" },
                  { valor: "transferencia", texto: "Transferencia" },
                  { valor: "debito", texto: "Débito" },
                  { valor: "credito", texto: "Crédito" },
                ]}
              />
            </div>
            {metodoPago === "credito" && (
              <div>
                <Label className="mb-2 block text-[13px] font-medium">
                  Cuotas
                </Label>
                <Input
                  value={cuotas}
                  onChange={(e) => setCuotas(soloDigitos(e.target.value))}
                  placeholder="3"
                  inputMode="numeric"
                  className="rounded-lg"
                />
              </div>
            )}
          </div>
        )}

        {/* Solo si quedó fiado: cuánto entregó ahora, para no perder ese
            dato saltando a Pagos después a anotarlo aparte. */}
        {estadoPago === "fiado" && (
          <div>
            <Label className="mb-2 block text-[13px] font-medium">
              ¿Abonó algo ahora? (opcional)
            </Label>
            <Input
              value={miles(montoAbonado)}
              onChange={(e) => setMontoAbonado(soloDigitos(e.target.value))}
              placeholder="40.000"
              inputMode="numeric"
              className="rounded-lg"
            />
          </div>
        )}

        {/* Checklist de servicios propio del taller — Plan Serviteca,
            pedido por Senna, configurable en /panel/servicios. Aparte
            del texto libre de arriba: sirve para marcar rápido lo
            típico (cambio de aceite, balanceo...) sin escribirlo. */}
        {tieneImpresion && catalogoServicios.length > 0 && (
          <div className="rounded-lg border border-border bg-input/20 p-4">
            <button
              type="button"
              onClick={() => setMostrarServicios((a) => !a)}
              className="flex w-full items-center justify-between text-left text-[13px] font-medium"
            >
              <span className="flex items-center gap-2">
                Servicios realizados
                {servicios.length > 0 && (
                  <Badge variant="secondary" className="rounded-full">
                    {servicios.length} marcados
                  </Badge>
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

        <label className="flex items-center gap-4 rounded-lg border border-border bg-input/20 px-4 py-4">
          <input
            type="checkbox"
            checked={conIva}
            onChange={(e) => setConIva(e.target.checked)}
            className="size-4 accent-primary"
          />
          <span className="text-[15px]">Sumar IVA (19%)</span>
        </label>

        {neto > 0 && (
          <div className="flex flex-col gap-1 text-[15px]">
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
              <span className="text-lg font-semibold tabular-nums text-primary">
                {pesos(total)}
              </span>
            </p>
          </div>
        )}
      </Seccion>

      {error && <p className="text-[13px] text-destructive">{error}</p>}

      {/* En móvil, la barra de acciones queda pegada al fondo de la
          pantalla al hacer scroll: sin esto había que bajar por toda
          la sección de cobro solo para llegar a "Cerrar orden".
          sticky (no fixed) para que se ancle al scroll real del
          panel — <main> tiene su propio overflow-y-auto, así que un
          "fixed" queda mal alineado con lo que realmente scrollea.
          Desde sm: hay espacio de sobra y vuelve al flujo normal. */}
      <div className="sticky bottom-0 -mx-4 z-10 bg-card/95 px-4 pt-3 pb-4 shadow-[0_-12px_30px_rgba(0,0,0,0.35)] backdrop-blur sm:relative sm:inset-auto sm:z-auto sm:mx-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none">
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={enviando}
            className="flex-[1.35] rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {enviando ? "Guardando…" : "Cerrar orden y cobrar"}
          </button>
          <button
            type="button"
            onClick={guardarAbierta}
            className="flex-1 rounded-lg border border-border bg-background px-6 py-2.5 font-medium transition-colors hover:bg-card"
          >
            Guardar avance
          </button>
        </div>
        <p className="mt-1.5 text-[12px] text-muted-foreground">
          &ldquo;Cerrar orden y cobrar&rdquo; termina el trabajo y registra el
          pago. &ldquo;Guardar avance&rdquo; deja todo anotado sin cerrar,
          para seguir después.
        </p>
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/panel/ordenes")}
            className="rounded-lg px-3 py-1.5 text-[13px] text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
          >
            Cancelar y volver sin guardar
          </button>
          {guardadoAbierta && (
            <span className="text-[13px] text-success">
              Avance guardado
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
