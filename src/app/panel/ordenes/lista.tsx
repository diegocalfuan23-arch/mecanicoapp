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
  serviciosDeOrden,
  procedimientosDeOrden,
  agregarProcedimiento,
  editarProcedimiento,
  quitarProcedimiento,
  type RepuestoUsado,
  type Procedimiento,
} from "./acciones";
import { ESTADOS } from "./estados";
import { pesos, fecha, miles, soloDigitos } from "@/lib/formato";
import { Dictar } from "@/components/dictar";
import { FotosVehiculo } from "@/components/fotos-vehiculo";
import { Selector } from "@/components/ui/selector";
import { RepuestosUsados } from "@/components/repuestos-usados";
import { DiagramaAuto } from "@/components/diagrama-auto";
import {
  NIVELES_COMBUSTIBLE,
  accesoriosParaTipo,
  esAccesorioLibre,
  codificarAccesorioLibre,
  textoAccesorioLibre,
} from "@/lib/accesorios-auto";

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

type VehiculoOpcion = {
  id: string;
  patente: string;
  marca: string | null;
  modelo: string | null;
  tipo: string | null;
  anio: number | null;
  color: string | null;
  motor: string | null;
  cilindrada: string | null;
  vin: string | null;
  movil: string | null;
  propietarioId: string | null;
  propietarioNumero: number | null;
  propietario: string | null;
  propietarioTelefono: string | null;
  propietarioEmail: string | null;
  propietarioDireccion: string | null;
  propietarioComuna: string | null;
  propietarioCiudad: string | null;
  esEmpresa: boolean | null;
  empresa: string | null;
  empresaRut: string | null;
  ultimoKilometraje: number | null;
};

type Insumo = {
  id: string;
  nombre: string;
  codigo: string | null;
  marca: string | null;
  stock: number;
  costo: number;
  precio: number;
};

type Tecnico = {
  id: string;
  nombre: string;
};

type Servicio = {
  id: string;
  grupo: string;
  codigo: string;
  etiqueta: string;
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
      <p className="text-[14px]">{valor ?? "No especifica"}</p>
    </div>
  );
}

function Abrir({
  vehiculos,
  vehiculoIdInicial,
  tieneImpresion,
  inventario,
  tecnicos,
  onListo,
}: {
  vehiculos: VehiculoOpcion[];
  /** Al llegar desde "Nueva visita" en la ficha del vehículo. */
  vehiculoIdInicial?: string;
  /** Plan Serviteca: agrega datos del vehículo y diagrama de daños. */
  tieneImpresion: boolean;
  inventario: Insumo[];
  tecnicos: Tecnico[];
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
  const [danoOtro, setDanoOtro] = useState("");
  const [combustible, setCombustible] = useState("");
  const [accesorios, setAccesorios] = useState<string[]>([]);
  const [accesorioLibre, setAccesorioLibre] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [ordenadoPor, setOrdenadoPor] = useState("");
  const [ordenadoPorFono, setOrdenadoPorFono] = useState("");
  const [tecnicoId, setTecnicoId] = useState("");
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
      danoOtro,
      combustible,
      accesorios,
      observaciones,
      ordenadoPor,
      ordenadoPorFono,
      tecnicoId,
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
              // Si el vehículo nuevo es de otro tipo (ej. cambia a
              // moto), se quitan los accesorios marcados que ya no
              // corresponden — una moto no trae "vidrios sin daño".
              const validos = accesoriosParaTipo(v?.tipo).map((a) => a.id);
              setAccesorios((actual) =>
                actual.filter((a) => (validos as string[]).includes(a))
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
            <DatoVehiculo etiqueta="Cilindrada" valor={elegido.cilindrada} />
            <DatoVehiculo etiqueta="VIN / Chasis" valor={elegido.vin} />
            <DatoVehiculo etiqueta="Móvil" valor={elegido.movil} />
          </div>
        )}

        {tieneImpresion && elegido && elegido.propietarioId && (
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-[13px] font-medium">Cliente</p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Se edita en Propietarios.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <DatoVehiculo
                etiqueta="Cliente"
                valor={
                  elegido.propietarioNumero
                    ? `${elegido.propietario} · #${elegido.propietarioNumero}`
                    : elegido.propietario
                }
              />
              <DatoVehiculo
                etiqueta="Fono"
                valor={elegido.propietarioTelefono}
              />
              <DatoVehiculo
                etiqueta="E-mail"
                valor={elegido.propietarioEmail}
              />
              <DatoVehiculo
                etiqueta="Dirección"
                valor={elegido.propietarioDireccion}
              />
              <DatoVehiculo
                etiqueta="Comuna"
                valor={elegido.propietarioComuna}
              />
              <DatoVehiculo
                etiqueta="Ciudad"
                valor={elegido.propietarioCiudad}
              />
              {elegido.esEmpresa && (
                <>
                  <DatoVehiculo etiqueta="Empresa" valor={elegido.empresa} />
                  <DatoVehiculo
                    etiqueta="RUT empresa"
                    valor={elegido.empresaRut}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {tieneImpresion && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-[13px] font-medium">
                Quién ordenó el trabajo (si no es el dueño)
              </span>
              <input
                value={ordenadoPor}
                onChange={(e) => setOrdenadoPor(e.target.value)}
                placeholder="Ej. esposa, hijo, otra persona"
                className={campoBase()}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-[13px] font-medium">Fono</span>
              <input
                value={ordenadoPorFono}
                onChange={(e) => setOrdenadoPorFono(e.target.value)}
                placeholder="+56 9 1234 5678"
                inputMode="tel"
                className={campoBase()}
              />
            </label>
          </div>
        )}

        {tieneImpresion && tecnicos.length > 0 && (
          <div>
            <span className="mb-2 block text-[13px] font-medium">
              Técnico a cargo
            </span>
            <Selector
              value={tecnicoId}
              onChange={setTecnicoId}
              placeholder="Sin asignar"
              opciones={tecnicos.map((t) => ({
                valor: t.id,
                texto: t.nombre,
              }))}
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
            <label className="mt-3 block">
              <span className="mb-1 block text-[12px] text-muted-foreground">
                Otro daño no cubierto por el diagrama (opcional)
              </span>
              <input
                value={danoOtro}
                onChange={(e) => setDanoOtro(e.target.value)}
                placeholder="Ej: parabrisas trizado, retrovisor roto"
                className={`${campoBase()} bg-card`}
              />
            </label>
          </div>
        )}

        {tieneImpresion && (
          <div>
            <span className="mb-2 block text-[13px] font-medium">
              Accesorios que trae
            </span>
            <div className="flex flex-wrap gap-2">
              {accesoriosParaTipo(elegido?.tipo).map((a) => {
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
              {accesorios
                .filter((a) => esAccesorioLibre(a))
                .map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() =>
                      setAccesorios((actual) => actual.filter((x) => x !== a))
                    }
                    className="rounded-lg border border-foreground bg-foreground/10 px-4 py-2 text-[14px] text-foreground"
                  >
                    {textoAccesorioLibre(a)} ✕
                  </button>
                ))}
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={accesorioLibre}
                onChange={(e) => setAccesorioLibre(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  if (!accesorioLibre.trim()) return;
                  setAccesorios((actual) => [
                    ...actual,
                    codificarAccesorioLibre(accesorioLibre),
                  ]);
                  setAccesorioLibre("");
                }}
                placeholder="Otro accesorio (ej: cadenas de nieve)"
                className={`${campoBase()} bg-card`}
              />
              <button
                type="button"
                onClick={() => {
                  if (!accesorioLibre.trim()) return;
                  setAccesorios((actual) => [
                    ...actual,
                    codificarAccesorioLibre(accesorioLibre),
                  ]);
                  setAccesorioLibre("");
                }}
                className="shrink-0 rounded-lg border border-border px-4 py-2 text-[14px] transition-colors hover:bg-background"
              >
                Agregar
              </button>
            </div>
          </div>
        )}

        {tieneImpresion && (
          <RepuestosUsados
            piezas={piezas}
            onCambio={setPiezas}
            inventario={inventario}
            mostrarDonde={false}
          />
        )}

        {tieneImpresion && (
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">
              Observaciones
            </span>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Cualquier otra nota sobre esta orden"
              rows={2}
              className={`${campoBase()} resize-y`}
            />
          </label>
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
  tieneImpresion,
  tecnicos,
  servicios: catalogoServicios,
  onListo,
}: {
  orden: Orden;
  tieneImpresion: boolean;
  tecnicos: Tecnico[];
  servicios: Servicio[];
  onListo: () => void;
}) {
  const router = useRouter();
  const [sintoma, setSintoma] = useState(orden.sintoma ?? "");
  const [kilometraje, setKilometraje] = useState(
    orden.kilometraje ? String(orden.kilometraje) : ""
  );
  const [diagnostico, setDiagnostico] = useState(orden.diagnostico ?? "");
  const [tecnicoId, setTecnicoId] = useState(orden.tecnicoId ?? "");
  const [guardadoAbierta, setGuardadoAbierta] = useState(false);
  const [manoObraFreno, setManoObraFreno] = useState("");
  const [cargoTraslado, setCargoTraslado] = useState("");
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
  // línea, y ve el total acumulado del cliente. Vive en el mismo
  // formulario que el cierre (antes era un modal aparte): un solo
  // lugar para ver y editar la orden, se cierre hoy o no.
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
          rows={2}
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
          rows={2}
          className={`${campoBase()} resize-y bg-card`}
        />
      </label>

      <div className="mt-4">
        <Procedimientos
          ordenId={orden.id}
          items={procedimientos}
          onCambio={setProcedimientos}
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <span className="mb-2 block text-[13px] font-medium">
            Mano de obra
          </span>
          <p className={`${campoBase()} bg-card text-muted-foreground`}>
            {manoObra ? pesos(Number(manoObra)) : "—"}
          </p>
        </div>
        {tieneImpresion && (
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
          <span className="mb-3 block text-[13px] font-medium">
            Servicios realizados
          </span>
          <div className="flex flex-col gap-4">
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

      {error && <p className="mt-2 text-[13px] text-destructive">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-4">
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
          onClick={onListo}
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

/**
 * Lo que se va haciendo, línea por línea, con su costo — pedido real
 * de Tío Lalo: cambia algo (ej. "cambio de embrague"), anota mano de
 * obra + repuesto de esa línea, y ve el total acumulado del cliente
 * sin esperar a cerrar la orden. Hace de CRUD completo: agregar, y
 * hacer clic en una línea existente la carga acá arriba para
 * corregirla (el botón pasa a "Guardar cambios") o quitarla.
 */
function Procedimientos({
  ordenId,
  items,
  onCambio,
}: {
  ordenId: string;
  items: Procedimiento[];
  onCambio: React.Dispatch<React.SetStateAction<Procedimiento[]>>;
}) {
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState("");
  const [manoObra, setManoObra] = useState("");
  const [repuestoNombre, setRepuestoNombre] = useState("");
  const [repuesto, setRepuesto] = useState("");

  const total = items.reduce((s, p) => s + p.manoObra + p.repuesto, 0);

  function limpiar() {
    setEditandoId(null);
    setDescripcion("");
    setManoObra("");
    setRepuesto("");
    setRepuestoNombre("");
  }

  function editar(p: Procedimiento) {
    setEditandoId(p.id);
    setDescripcion(p.descripcion);
    setManoObra(p.manoObra ? String(p.manoObra) : "");
    setRepuesto(p.repuesto ? String(p.repuesto) : "");
    setRepuestoNombre(p.repuestoNombre ?? "");
  }

  async function guardar() {
    if (!descripcion.trim()) return;
    if (!Number(manoObra) && !Number(repuesto)) return;
    const datos = {
      descripcion: descripcion.trim(),
      manoObra,
      repuesto,
      repuestoNombre,
    };
    const optimista: Procedimiento = {
      id: editandoId ?? `tmp-${crypto.randomUUID()}`,
      descripcion: datos.descripcion,
      manoObra: Number(datos.manoObra) || 0,
      repuesto: Number(datos.repuesto) || 0,
      repuestoNombre: datos.repuestoNombre.trim() || null,
    };
    // Optimista: se ve en la tarjeta al instante, sin esperar al
    // servidor — la respuesta real solo confirma o corrige el id.
    onCambio(
      editandoId
        ? items.map((p) => (p.id === editandoId ? optimista : p))
        : [...items, optimista]
    );
    limpiar();

    const res = editandoId
      ? await editarProcedimiento(editandoId, datos)
      : await agregarProcedimiento(ordenId, datos);
    if (res?.ok && res.item) {
      onCambio((actuales) =>
        actuales.map((p) => (p.id === optimista.id ? res.item : p))
      );
    }
  }

  async function quitar(id: string) {
    onCambio(items.filter((p) => p.id !== id));
    if (editandoId === id) limpiar();
    await quitarProcedimiento(id);
  }

  const campo =
    "w-full rounded-lg border border-border bg-card px-3 py-2 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30";

  return (
    <div>
      <span className="mb-2 block text-[13px] font-medium">Qué se hizo</span>

      {items.length > 0 && (
        <ul className="mb-2 grid gap-2 sm:grid-cols-3">
          {items.map((p) => (
            <li
              key={p.id}
              className={`relative rounded-lg border transition-colors ${
                editandoId === p.id
                  ? "border-primary/60 bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <button
                type="button"
                onClick={() => editar(p)}
                className="block w-full rounded-lg px-3 py-2 pr-8 text-left text-[14px] hover:bg-background"
              >
                <span className="block truncate">{p.descripcion}</span>
                {p.repuestoNombre && (
                  <span className="block truncate text-muted-foreground">
                    {p.repuestoNombre}
                  </span>
                )}
                <span className="mt-1 block font-medium tabular-nums">
                  {pesos(p.manoObra + p.repuesto)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => quitar(p.id)}
                aria-label="Quitar"
                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
              >
                <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
                  <path
                    d="M6 6l8 8M14 6l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Cambio de pastillas delanteras y rectificado de discos"
          rows={2}
          className={`${campo} resize-y`}
        />
        <input
          value={miles(manoObra)}
          onChange={(e) => setManoObra(soloDigitos(e.target.value))}
          placeholder="Mano de obra"
          inputMode="numeric"
          className={`${campo} sm:w-32`}
        />
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
        <input
          value={repuestoNombre}
          onChange={(e) => setRepuestoNombre(e.target.value)}
          placeholder="Repuesto comprado (ej. pastillas delanteras)"
          className={campo}
        />
        <input
          value={miles(repuesto)}
          onChange={(e) => setRepuesto(soloDigitos(e.target.value))}
          placeholder="Precio repuesto"
          inputMode="numeric"
          className={`${campo} sm:w-32`}
        />
      </div>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={!descripcion.trim()}
          className="flex-1 rounded-lg bg-primary px-4 py-2 text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40 sm:flex-none"
        >
          {editandoId ? "Guardar cambios" : "Agregar"}
        </button>
        {editandoId && (
          <button
            type="button"
            onClick={limpiar}
            className="rounded-lg border border-border px-4 py-2 text-[14px] transition-colors hover:bg-card"
          >
            Cancelar
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
        <span className="text-[14px] text-muted-foreground">
          Lleva gastado
        </span>
        <span className="text-xl font-semibold tabular-nums text-primary">
          {pesos(total)}
        </span>
      </div>
    </div>
  );
}

/**
 * Corregir "qué se hizo" en una orden ya Terminada o Entregada — se
 * acordó de algo que faltó anotar, o hay que corregir un monto ya
 * cobrado. Sin tocar el total cobrado al cerrar: solo el registro de
 * qué se hizo, para consultarlo o corregirlo después.
 */
function EditarDescripcion({
  orden,
  onListo,
}: {
  orden: Orden;
  onListo: () => void;
}) {
  const router = useRouter();
  const [procedimientos, setProcedimientos] = useState<Procedimiento[]>([]);

  useEffect(() => {
    procedimientosDeOrden(orden.id).then(setProcedimientos);
  }, [orden.id]);

  // Cada cambio en Procedimientos (agregar/editar/quitar) ya guarda
  // esa línea en la base; acá solo falta mantener actualizado el
  // texto "qué se hizo" de la orden con la nueva lista.
  function onCambio(accion: React.SetStateAction<Procedimiento[]>) {
    setProcedimientos((actuales) => {
      const items = typeof accion === "function" ? accion(actuales) : accion;
      editarDescripcion(
        orden.id,
        items.map((p) => p.descripcion).join(", ")
      ).then(() => router.refresh());
      return items;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Cerrar"
        onClick={onListo}
        className="absolute inset-0 bg-black/60"
      />
      <div className="relative w-full max-w-md rounded-lg border border-border bg-background p-4">
        <Procedimientos
          ordenId={orden.id}
          items={procedimientos}
          onCambio={onCambio}
        />

        <div className="mt-4 flex items-center justify-end">
          <button
            type="button"
            onClick={onListo}
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
  tecnicos,
  servicios,
  tieneImpresion,
}: {
  ordenes: Orden[];
  vehiculos: VehiculoOpcion[];
  inventario: Insumo[];
  tecnicos: Tecnico[];
  servicios: Servicio[];
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
        tecnicos={tecnicos}
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
                    ? () => setCerrando(editando ? null : o.id)
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

                <div className="mt-4 flex-1">
                  {o.fotos.length > 0 && (
                    <div
                      className="mb-3 flex flex-wrap gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {o.fotos.map((url) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt="Estado del vehículo"
                            className="size-20 rounded-lg border border-border object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="space-y-1">
                    {o.sintoma && <p className="text-[15px]">{o.sintoma}</p>}
                    {o.diagnostico && (
                      <p className="text-[15px] text-muted-foreground">
                        {o.diagnostico}
                      </p>
                    )}
                    {o.descripcion && (
                      <p className="text-[14px] text-muted-foreground">
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
                  </div>
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

                {/* stopPropagation: la tarjeta entera abre "Editar
                    orden abierta" al hacer clic (más abajo, onClick del
                    <li>) — sin esto, escribir en cualquier campo de
                    estos formularios burbujeaba hasta la tarjeta y
                    abría ese modal encima por error. */}
                {editando && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <Cerrar
                      orden={o}
                      tieneImpresion={tieneImpresion}
                      tecnicos={tecnicos}
                      servicios={servicios}
                      onListo={() => setCerrando(null)}
                    />
                  </div>
                )}
                {esperando === o.id && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <EsperarRepuesto
                      ordenId={o.id}
                      onListo={() => setEsperando(null)}
                    />
                  </div>
                )}
                {editandoDescripcion === o.id && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <EditarDescripcion
                      orden={o}
                      onListo={() => setEditandoDescripcion(null)}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
