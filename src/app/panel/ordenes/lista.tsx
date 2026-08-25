"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  abrirOrden,
  cambiarEstado,
  cerrarOrden,
  editarDescripcion,
  editarOrdenAbierta,
  esperarRepuesto,
  retomarTrabajo,
  repuestosDeOrden,
  type RepuestoUsado,
} from "./acciones";
import { ESTADOS } from "./estados";
import { pesos, fecha, miles, soloDigitos } from "@/lib/formato";
import { Dictar } from "@/components/dictar";
import { FotosVehiculo } from "@/components/fotos-vehiculo";
import { Selector } from "@/components/ui/selector";
import { RepuestosUsados } from "@/components/repuestos-usados";
import { DiagramaAuto } from "@/components/diagrama-auto";
import { NIVELES_COMBUSTIBLE } from "@/lib/accesorios-auto";
import { ACCESORIOS_AUTO } from "@/lib/accesorios-auto";

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
  anio: number | null;
  color: string | null;
  motor: string | null;
  vin: string | null;
  propietario: string | null;
  propietarioTelefono: string | null;
  ultimoKilometraje: number | null;
};

type Insumo = {
  id: string;
  nombre: string;
  stock: number;
  costo: number;
  precio: number;
};

const COLOR_ESTADO: Record<string, string> = {
  ingresado: "bg-muted text-muted-foreground",
  en_proceso: "bg-foreground/10 text-foreground",
  esperando_repuesto: "border border-dashed border-foreground/30 text-foreground",
  terminado: "bg-foreground/10 text-foreground",
  entregado: "bg-muted text-muted-foreground",
};

function nombreEstado(valor: string) {
  return ESTADOS.find((e) => e.valor === valor)?.texto ?? valor;
}

function campoBase(error?: boolean) {
  return `w-full rounded-lg border bg-background px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:ring-1 ${
    error
      ? "border-destructive/70 focus:border-destructive focus:ring-destructive/30"
      : "border-border focus:border-primary/60 focus:ring-primary/30"
  }`;
}

function DatoVehiculo({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string | number | null;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {etiqueta}
      </p>
      <p className="text-[14px]">{valor ?? "—"}</p>
    </div>
  );
}

function Abrir({
  vehiculos,
  vehiculoIdInicial,
  tieneImpresion,
  inventario,
  onListo,
}: {
  vehiculos: VehiculoOpcion[];
  /** Al llegar desde "Nueva visita" en la ficha del vehículo. */
  vehiculoIdInicial?: string;
  /** Plan Serviteca: agrega datos del vehículo y diagrama de daños. */
  tieneImpresion: boolean;
  inventario: Insumo[];
  onListo: () => void;
}) {
  const router = useRouter();
  const [vehiculoId, setVehiculoId] = useState(vehiculoIdInicial ?? "");
  const [kilometraje, setKilometraje] = useState(() => {
    const v = vehiculos.find((x) => x.id === vehiculoIdInicial);
    return v?.ultimoKilometraje ? String(v.ultimoKilometraje) : "";
  });
  const [sintoma, setSintoma] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [danos, setDanos] = useState<string[]>([]);
  const [combustible, setCombustible] = useState("");
  const [accesorios, setAccesorios] = useState<string[]>([]);
  const [piezas, setPiezas] = useState<RepuestoUsado[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const elegido = vehiculos.find((v) => v.id === vehiculoId);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const res = await abrirOrden({
      vehiculoId,
      kilometraje,
      sintoma,
      diagnostico,
      fotos,
      danos,
      combustible,
      accesorios,
      piezas,
    });
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
          className="mt-4 text-muted-foreground underline underline-offset-4 hover:text-foreground"
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
        <div>
          <span className="mb-2 block text-[13px] font-medium">Vehículo</span>
          <Selector
            value={vehiculoId}
            onChange={(id) => {
              setVehiculoId(id);
              // Se precarga el último kilometraje conocido para no
              // escribirlo de cero: el mecánico solo corrige la
              // diferencia desde la última visita.
              const v = vehiculos.find((x) => x.id === id);
              setKilometraje(
                v?.ultimoKilometraje ? String(v.ultimoKilometraje) : ""
              );
            }}
            autoFocus
            placeholder="Elige el vehículo"
            opciones={vehiculos.map((v) => ({
              valor: v.id,
              texto: [
                v.patente,
                v.marca ? `${v.marca} ${v.modelo ?? ""}`.trim() : null,
                v.propietario,
              ]
                .filter(Boolean)
                .join(" · "),
            }))}
          />
        </div>

        {tieneImpresion && elegido && (
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-background p-4 sm:grid-cols-3">
            <DatoVehiculo etiqueta="Año" valor={elegido.anio} />
            <DatoVehiculo etiqueta="Color" valor={elegido.color} />
            <DatoVehiculo etiqueta="Motor" valor={elegido.motor} />
            <DatoVehiculo etiqueta="VIN / Chasis" valor={elegido.vin} />
            <DatoVehiculo etiqueta="Cliente" valor={elegido.propietario} />
            <DatoVehiculo
              etiqueta="Fono"
              valor={elegido.propietarioTelefono}
            />
          </div>
        )}

        <label className="block">
          <span className="mb-2 block text-[13px] font-medium">
            Kilometraje de entrada
          </span>
          <input
            value={miles(kilometraje)}
            onChange={(e) => setKilometraje(soloDigitos(e.target.value))}
            placeholder="128.500"
            inputMode="numeric"
            className={campoBase()}
          />
          {elegido?.ultimoKilometraje ? (
            // Un kilometraje menor al de la última visita es raro: casi
            // siempre es un dígito de más o de menos al escribir.
            Number(kilometraje) > 0 &&
            Number(kilometraje) < elegido.ultimoKilometraje ? (
              <span className="mt-2 block text-[12px] text-destructive">
                Menos que la última vez, que marcaba{" "}
                {elegido.ultimoKilometraje.toLocaleString("es-CL")} km. ¿Está
                bien escrito?
              </span>
            ) : (
              <span className="mt-2 block text-[12px] text-muted-foreground">
                La última vez marcaba{" "}
                {elegido.ultimoKilometraje.toLocaleString("es-CL")} km. Corrige
                si viene con más.
              </span>
            )
          ) : null}
        </label>

        {tieneImpresion && (
          <div>
            <span className="mb-2 block text-[13px] font-medium">
              Nivel de combustible
            </span>
            <div className="flex flex-wrap gap-2">
              {NIVELES_COMBUSTIBLE.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() =>
                    setCombustible(combustible === n.id ? "" : n.id)
                  }
                  className={`rounded-lg border px-4 py-2 text-[14px] transition-colors ${
                    combustible === n.id
                      ? "border-foreground bg-foreground/10 text-foreground"
                      : "border-border hover:bg-background"
                  }`}
                >
                  {n.etiqueta}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="block">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] font-medium">
              Qué reporta el cliente
            </span>
            <Dictar
              onTexto={(texto) =>
                setSintoma((actual) => (actual ? `${actual} ${texto}` : texto))
              }
            />
          </div>
          <textarea
            value={sintoma}
            onChange={(e) => setSintoma(e.target.value)}
            placeholder="Suena adelante al frenar"
            rows={3}
            className={`${campoBase()} resize-y`}
          />
        </label>

        <label className="block">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] font-medium">
              Diagnóstico (si ya se sabe)
            </span>
            <Dictar
              onTexto={(texto) =>
                setDiagnostico((actual) =>
                  actual ? `${actual} ${texto}` : texto
                )
              }
            />
          </div>
          <textarea
            value={diagnostico}
            onChange={(e) => setDiagnostico(e.target.value)}
            placeholder="Retenes de la caja desgastados, causando la fuga"
            rows={2}
            className={`${campoBase()} resize-y`}
          />
        </label>

        <FotosVehiculo fotos={fotos} onCambio={setFotos} onError={setError} />

        {tieneImpresion && (
          <div>
            <span className="mb-2 block text-[13px] font-medium">
              Estado del vehículo al ingresar
            </span>
            <DiagramaAuto value={danos} onChange={setDanos} />
          </div>
        )}

        {tieneImpresion && (
          <div>
            <span className="mb-2 block text-[13px] font-medium">
              Accesorios que trae
            </span>
            <div className="flex flex-wrap gap-2">
              {ACCESORIOS_AUTO.map((a) => {
                const activo = accesorios.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() =>
                      setAccesorios((actual) =>
                        activo
                          ? actual.filter((id) => id !== a.id)
                          : [...actual, a.id]
                      )
                    }
                    className={`rounded-lg border px-4 py-2 text-[14px] transition-colors ${
                      activo
                        ? "border-foreground bg-foreground/10 text-foreground"
                        : "border-border hover:bg-background"
                    }`}
                  >
                    {a.etiqueta}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tieneImpresion && (
          <RepuestosUsados
            piezas={piezas}
            onCambio={setPiezas}
            inventario={inventario}
          />
        )}

        {error && <p className="text-[13px] text-destructive">{error}</p>}

        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            type="submit"
            disabled={enviando}
            className="rounded-lg bg-primary px-6 py-4 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {enviando ? "Abriendo…" : "Abrir orden"}
          </button>
          <button
            type="button"
            onClick={onListo}
            className="rounded-lg border border-border px-6 py-4 font-medium transition-colors hover:bg-background"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function Cerrar({
  orden,
  inventario,
  onListo,
}: {
  orden: Orden;
  inventario: Insumo[];
  onListo: () => void;
}) {
  const router = useRouter();
  const [descripcion, setDescripcion] = useState(orden.descripcion ?? "");
  const [manoObra, setManoObra] = useState("");
  const [repuestos, setRepuestos] = useState("");
  const [cargoTraslado, setCargoTraslado] = useState("");
  const [estadoPago, setEstadoPago] = useState("pagado");
  const [montoAbonado, setMontoAbonado] = useState("");
  const [conIva, setConIva] = useState(false);
  const [piezas, setPiezas] = useState<RepuestoUsado[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orden.id]);

  // Si se detallaron los repuestos, el cobro sale de ellos.
  const cobroRepuestos = piezas.length
    ? piezas.reduce(
        (s, p) => s + (Number(p.precio) || 0) * (Number(p.cantidad) || 1),
        0
      )
    : Number(repuestos) || 0;

  // El IVA se suma encima del neto, no viene incluido.
  const neto =
    (Number(manoObra) || 0) + cobroRepuestos + (Number(cargoTraslado) || 0);
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
      repuestos,
      cargoTraslado,
      estadoPago,
      montoAbonado: estadoPago === "fiado" ? montoAbonado : "",
      conIva,
      piezas,
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
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[13px] font-medium">Qué se hizo</span>
          <Dictar
            onTexto={(texto) =>
              setDescripcion((actual) =>
                actual ? `${actual} ${texto}` : texto
              )
            }
          />
        </div>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Cambio de pastillas delanteras y rectificado de discos"
          rows={2}
          autoFocus
          className={`${campoBase()} resize-y bg-card`}
        />
      </label>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="block">
          <span className="mb-2 block text-[13px] font-medium">
            Mano de obra
          </span>
          <input
            value={miles(manoObra)}
            onChange={(e) => setManoObra(soloDigitos(e.target.value))}
            placeholder="45.000"
            inputMode="numeric"
            className={`${campoBase()} bg-card`}
          />
        </label>
        {/* Cuando se detallan los repuestos abajo, este campo sale
            sobrando: el cobro se calcula solo. */}
        {piezas.length === 0 && (
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">
              Repuestos
            </span>
            <input
              value={miles(repuestos)}
              onChange={(e) => setRepuestos(soloDigitos(e.target.value))}
              placeholder="80.000"
              inputMode="numeric"
              className={`${campoBase()} bg-card`}
            />
          </label>
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

      <div className="mt-4">
        <RepuestosUsados
          piezas={piezas}
          onCambio={setPiezas}
          inventario={inventario}
        />
      </div>

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

      {error && <p className="mt-2 text-[13px] text-destructive">{error}</p>}

      <div className="mt-4 flex gap-4">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {enviando ? "Guardando…" : "Cerrar orden"}
        </button>
        <button
          type="button"
          onClick={onListo}
          className="rounded-lg border border-border px-6 py-2 transition-colors hover:bg-card"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

/**
 * Editar una orden que sigue abierta, sin cerrarla — para cuando se
 * encuentra algo aparte del diagnóstico inicial. Guarda solo al salir
 * del campo, sin botón: no hay montos que calcular acá, a diferencia
 * de Cerrar.
 */
function EditarAbierta({
  orden,
  onListo,
}: {
  orden: Orden;
  onListo: () => void;
}) {
  const router = useRouter();
  const [sintoma, setSintoma] = useState(orden.sintoma ?? "");
  const [kilometraje, setKilometraje] = useState(
    orden.kilometraje ? String(orden.kilometraje) : ""
  );
  const [diagnostico, setDiagnostico] = useState(orden.diagnostico ?? "");
  const [descripcion, setDescripcion] = useState(orden.descripcion ?? "");
  const [guardado, setGuardado] = useState(false);

  async function guardar() {
    await editarOrdenAbierta(orden.id, {
      sintoma,
      kilometraje,
      diagnostico,
      descripcion,
    });
    setGuardado(true);
    setTimeout(() => setGuardado(false), 1500);
    router.refresh();
  }

  // El botón "Volver" competía con el onBlur del campo enfocado: al
  // tocarlo, el blur disparaba guardar() (async) al mismo tiempo que
  // el click, y el re-render de por medio hacía que el click se
  // perdiera. Guardar primero y recién ahí cerrar evita la carrera.
  async function volver() {
    await guardar();
    onListo();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Cerrar"
        onClick={volver}
        className="absolute inset-0 bg-black/60"
      />
      <div className="relative w-full max-w-md rounded-lg border border-border bg-background p-4">
        <label className="block">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] font-medium">
              Qué reporta el cliente
            </span>
            <Dictar
              onTexto={(texto) =>
                setSintoma((a) => (a ? `${a} ${texto}` : texto))
              }
            />
          </div>
          <textarea
            value={sintoma}
            onChange={(e) => setSintoma(e.target.value)}
            onBlur={guardar}
            placeholder="Suena adelante al frenar"
            rows={3}
            autoFocus
            className="w-full resize-y rounded-lg border border-border bg-card px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-2 block text-[13px] font-medium">
            Kilometraje
          </span>
          <input
            value={miles(kilometraje)}
            onChange={(e) => setKilometraje(soloDigitos(e.target.value))}
            onBlur={guardar}
            placeholder="128.500"
            inputMode="numeric"
            className="w-full rounded-lg border border-border bg-card px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
          />
        </label>

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
            onBlur={guardar}
            placeholder="Retenes de la caja desgastados, causando la fuga"
            rows={2}
            className="w-full resize-y rounded-lg border border-border bg-card px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
          />
        </label>

        <label className="mt-4 block">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] font-medium">
              Qué se está haciendo
            </span>
            <Dictar
              onTexto={(texto) =>
                setDescripcion((a) => (a ? `${a} ${texto}` : texto))
              }
            />
          </div>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            onBlur={guardar}
            placeholder="Se desarmó la caja y se fue a comprar los retenes"
            rows={3}
            className="w-full resize-y rounded-lg border border-border bg-card px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
          />
        </label>

        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-[13px] text-muted-foreground">
            {guardado ? "Guardado" : "Los cambios se guardan solos"}
          </span>
          <button
            type="button"
            onClick={volver}
            className="rounded-lg border border-border px-6 py-2 font-medium transition-colors hover:bg-card"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Corregir "qué se hizo" en una orden ya Terminada o Entregada — se
 * acordó de algo que faltó anotar después de cerrar. Sin montos: eso
 * ya quedó calculado al cerrar.
 */
function EditarDescripcion({
  orden,
  onListo,
}: {
  orden: Orden;
  onListo: () => void;
}) {
  const router = useRouter();
  const [descripcion, setDescripcion] = useState(orden.descripcion ?? "");
  const [guardado, setGuardado] = useState(false);

  async function guardar() {
    await editarDescripcion(orden.id, descripcion);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 1500);
    router.refresh();
  }

  // Ver el comentario equivalente en EditarAbierta: guardar antes de
  // cerrar evita que el blur y el click compitan por el re-render.
  async function volver() {
    await guardar();
    onListo();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Cerrar"
        onClick={volver}
        className="absolute inset-0 bg-black/60"
      />
      <div className="relative w-full max-w-md rounded-lg border border-border bg-background p-4">
        <label className="block">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] font-medium">Qué se hizo</span>
            <Dictar
              onTexto={(texto) =>
                setDescripcion((a) => (a ? `${a} ${texto}` : texto))
              }
            />
          </div>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            onBlur={guardar}
            placeholder="Cambio de pastillas delanteras y rectificado de discos"
            rows={3}
            autoFocus
            className="w-full resize-y rounded-lg border border-border bg-card px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
          />
        </label>

        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-[13px] text-muted-foreground">
            {guardado ? "Guardado" : "Los cambios se guardan solos"}
          </span>
          <button
            type="button"
            onClick={volver}
            className="rounded-lg border border-border px-6 py-2 font-medium transition-colors hover:bg-card"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}

/** El auto se va del taller: pide qué repuesto se está esperando. */
function EsperarRepuesto({
  ordenId,
  onListo,
}: {
  ordenId: string;
  onListo: () => void;
}) {
  const router = useRouter();
  const [detalle, setDetalle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const res = await esperarRepuesto(ordenId, detalle);
    setEnviando(false);

    if (res?.error) {
      setError(res.error);
      return;
    }
    onListo();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Cerrar"
        onClick={onListo}
        className="absolute inset-0 bg-black/60"
      />
      <form
        onSubmit={enviar}
        className="relative w-full max-w-md rounded-lg border border-border bg-background p-4"
      >
        <label className="block">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[13px] font-medium">
              Qué se está esperando
            </span>
            <Dictar onTexto={(texto) => setDetalle((a) => (a ? `${a} ${texto}` : texto))} />
          </div>
          <textarea
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            placeholder="Amortiguadores traseros, importados, llegan en 10 días"
            rows={2}
            autoFocus
            className="w-full resize-y rounded-lg border border-border bg-card px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
          />
        </label>

        {error && <p className="mt-2 text-[13px] text-destructive">{error}</p>}

        <div className="mt-4 flex flex-col gap-4 sm:flex-row">
          <button
            type="submit"
            disabled={enviando}
            className="rounded-lg bg-foreground px-6 py-2 font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {enviando ? "Guardando…" : "El auto se va del taller"}
          </button>
          <button
            type="button"
            onClick={onListo}
            className="rounded-lg border border-border px-6 py-2 font-medium transition-colors hover:bg-card"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

export function ListaOrdenes({
  ordenes,
  vehiculos,
  inventario,
  tieneImpresion,
}: {
  ordenes: Orden[];
  vehiculos: VehiculoOpcion[];
  inventario: Insumo[];
  tieneImpresion: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  // Al llegar desde "Nueva visita" en la ficha del vehículo, con
  // ?abrir=<id> en la URL: abre el formulario ya con ese auto puesto.
  const vehiculoDesdeUrl = params.get("abrir");
  const [abriendo, setAbriendo] = useState(!!vehiculoDesdeUrl);
  const [cerrando, setCerrando] = useState<string | null>(null);
  const [esperando, setEsperando] = useState<string | null>(null);
  const [editandoAbierta, setEditandoAbierta] = useState<string | null>(null);
  const [editandoDescripcion, setEditandoDescripcion] = useState<
    string | null
  >(null);
  const [retomando, setRetomando] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("abiertas");

  const visibles =
    filtro === "abiertas"
      ? ordenes.filter((o) => o.estado !== "entregado")
      : ordenes;

  async function avanzar(id: string, estado: string) {
    await cambiarEstado(id, estado);
    router.refresh();
  }

  async function volvio(id: string) {
    setRetomando(id);
    await retomarTrabajo(id);
    setRetomando(null);
    router.refresh();
  }

  if (abriendo) {
    return (
      <Abrir
        vehiculos={vehiculos}
        vehiculoIdInicial={vehiculoDesdeUrl ?? undefined}
        tieneImpresion={tieneImpresion}
        inventario={inventario}
        onListo={() => {
          setAbriendo(false);
          // Limpia el ?abrir= de la URL: un refresh no debe reabrir
          // el formulario solo.
          if (vehiculoDesdeUrl) router.replace("/panel/ordenes");
        }}
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {[
            { valor: "abiertas", texto: "Abiertas" },
            { valor: "todas", texto: "Todas" },
          ].map((f) => (
            <button
              key={f.valor}
              onClick={() => setFiltro(f.valor)}
              className={`rounded px-4 py-2 text-[14px] transition-colors ${
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
          className="shrink-0 rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground transition-opacity hover:opacity-90"
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
              className="mt-4 text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Ingresar el primer vehículo
            </button>
          )}
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((o) => {
            const saldo = o.total - o.abonado;
            const editando = cerrando === o.id;
            const puedeEditarAbierta =
              o.estado === "ingresado" || o.estado === "en_proceso";
            const puedeEditarDescripcion =
              o.estado === "terminado" || o.estado === "entregado";

            return (
              <li
                key={o.id}
                onClick={
                  puedeEditarAbierta
                    ? () => setEditandoAbierta(o.id)
                    : puedeEditarDescripcion
                      ? () => setEditandoDescripcion(o.id)
                      : undefined
                }
                className={`flex min-w-0 flex-col rounded-xl border border-border bg-card p-4 sm:p-6 ${
                  editando ? "sm:col-span-2 xl:col-span-3" : ""
                } ${puedeEditarAbierta || puedeEditarDescripcion ? "cursor-pointer transition-colors hover:border-primary/40" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[13px] text-muted-foreground">
                    OT-{o.numero}
                  </span>
                  <span
                    className={`rounded-full px-2 py-1 text-[12px] font-medium ${COLOR_ESTADO[o.estado]}`}
                  >
                    {nombreEstado(o.estado)}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-baseline gap-x-2">
                  <span className="font-mono font-medium">{o.patente}</span>
                  {o.marca && (
                    <span className="text-[14px] text-muted-foreground">
                      {o.marca} {o.modelo}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex-1 space-y-1">
                  {o.sintoma && (
                    <p className="text-[15px]">
                      <span className="text-muted-foreground">Reporta: </span>
                      {o.sintoma}
                    </p>
                  )}
                  {o.diagnostico && (
                    <p className="text-[15px]">
                      <span className="text-muted-foreground">
                        Diagnóstico:{" "}
                      </span>
                      {o.diagnostico}
                    </p>
                  )}
                  {o.descripcion && (
                    <p className="text-[15px]">
                      <span className="text-muted-foreground">
                        {o.estado === "terminado" || o.estado === "entregado"
                          ? "Se hizo: "
                          : "Procedimiento: "}
                      </span>
                      {o.descripcion}
                    </p>
                  )}
                  {o.estado === "esperando_repuesto" && o.esperaDetalle && (
                    <p className="text-[15px]">
                      <span className="text-muted-foreground">
                        El auto no está aquí, esperando:{" "}
                      </span>
                      {o.esperaDetalle}
                    </p>
                  )}
                  {o.fotos.length > 0 && (
                    <div
                      className="flex flex-wrap gap-1 pt-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {o.fotos.map((url) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt="Estado del vehículo"
                            className="size-10 rounded-md border border-border object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <p className="mt-4 text-[13px] text-muted-foreground">
                  {o.propietario ?? "Sin dueño registrado"}
                  <br />
                  {fecha(o.fecha)}
                  {o.kilometraje
                    ? ` · ${o.kilometraje.toLocaleString("es-CL")} km`
                    : ""}
                </p>

                {o.total > 0 && (
                  <div className="mt-4 border-t border-border pt-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-2xl font-bold">
                        {pesos(o.total)}
                      </span>
                      {o.estadoPago !== "pagado" && (
                        <span className="text-[13px] font-medium text-acento">
                          Debe {pesos(saldo)}
                        </span>
                      )}
                    </div>
                    {/* Sin esto, "Debe $X" de un total mayor obliga a
                        restar de cabeza para saber si ya abonó algo. */}
                    {o.abonado > 0 && o.estadoPago !== "pagado" && (
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        Ya abonó {pesos(o.abonado)}
                      </p>
                    )}
                  </div>
                )}

                <div
                  className="mt-4 flex flex-wrap gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {tieneImpresion && (
                    <a
                      href={`/imprimir/${o.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-border px-4 py-2 text-[14px] transition-colors hover:bg-background"
                    >
                      Imprimir
                    </a>
                  )}
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
                        setEsperando(esperando === o.id ? null : o.id)
                      }
                      className="rounded-lg border border-border px-4 py-2 text-[14px] transition-colors hover:bg-background"
                    >
                      Falta repuesto
                    </button>
                  )}
                  {o.estado === "esperando_repuesto" && (
                    <button
                      onClick={() => volvio(o.id)}
                      disabled={retomando === o.id}
                      className="rounded-lg border border-border px-4 py-2 text-[14px] transition-colors hover:bg-background disabled:opacity-60"
                    >
                      {retomando === o.id ? "Guardando…" : "Volvió el auto"}
                    </button>
                  )}
                  {(o.estado === "ingresado" || o.estado === "en_proceso") && (
                    <button
                      onClick={() => setCerrando(editando ? null : o.id)}
                      className="rounded-lg bg-foreground px-4 py-2 text-[14px] font-medium text-background transition-opacity hover:opacity-90"
                    >
                      Terminar
                    </button>
                  )}
                  {o.estado === "terminado" && (
                    <>
                      <button
                        onClick={() => avanzar(o.id, "entregado")}
                        className="rounded-lg bg-foreground px-4 py-2 text-[14px] font-medium text-background transition-opacity hover:opacity-90"
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
                          Avisar
                        </a>
                      )}
                    </>
                  )}
                </div>

                {editando && (
                  <Cerrar
                    orden={o}
                    inventario={inventario}
                    onListo={() => setCerrando(null)}
                  />
                )}
                {esperando === o.id && (
                  <EsperarRepuesto
                    ordenId={o.id}
                    onListo={() => setEsperando(null)}
                  />
                )}
                {editandoAbierta === o.id && (
                  <EditarAbierta
                    orden={o}
                    onListo={() => setEditandoAbierta(null)}
                  />
                )}
                {editandoDescripcion === o.id && (
                  <EditarDescripcion
                    orden={o}
                    onListo={() => setEditandoDescripcion(null)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
