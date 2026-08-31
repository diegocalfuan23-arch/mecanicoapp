"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  abrirOrden,
  cambiarEstado,
  editarDescripcion,
  esperarRepuesto,
  retomarTrabajo,
  procedimientosDeOrden,
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
import { Procedimientos } from "@/components/procedimientos";
import {
  NIVELES_COMBUSTIBLE,
  accesoriosParaTipo,
  esAccesorioLibre,
  codificarAccesorioLibre,
  textoAccesorioLibre,
} from "@/lib/accesorios-auto";
import { SINTOMAS_COMUNES } from "@/lib/sintomas-comunes";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";

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

const VARIANTE_ESTADO: Record<
  string,
  "secondary" | "default" | "outline"
> = {
  ingresado: "secondary",
  en_proceso: "default",
  esperando_repuesto: "outline",
  terminado: "default",
  entregado: "secondary",
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
          {/* Lo más común, a un toque: baja la fricción del caso
              típico sin quitar la opción de escribir o dictar algo
              distinto — mismo criterio que Combustible/Accesorios. */}
          <div className="mb-2 flex flex-wrap gap-2">
            {SINTOMAS_COMUNES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() =>
                  setSintoma((actual) =>
                    actual ? `${actual}, ${s}` : s
                  )
                }
                className="rounded-lg border border-border px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                {s}
              </button>
            ))}
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
  tieneImpresion,
}: {
  ordenes: Orden[];
  vehiculos: VehiculoOpcion[];
  inventario: Insumo[];
  tecnicos: Tecnico[];
  tieneImpresion: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  // Al llegar desde "Nueva visita" en la ficha del vehículo, con
  // ?abrir=<id> en la URL: abre el formulario ya con ese auto puesto.
  const vehiculoDesdeUrl = params.get("abrir");
  const [abriendo, setAbriendo] = useState(!!vehiculoDesdeUrl);
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
        <ul className="mt-6 grid gap-4 lg:grid-cols-2">
          {visibles.map((o) => {
            const saldo = o.total - o.abonado;
            const puedeEditarDescripcion =
              o.estado === "terminado" || o.estado === "entregado";
            const puedeVerDetalle =
              o.estado === "ingresado" || o.estado === "en_proceso";

            // Toda la tarjeta lleva al detalle, no solo el botón
            // "Terminar" — el Router Cache de Next a veces no navega
            // en silencio a una ruta dinámica recién creada en esta
            // misma sesión (el <Link> del botón solo no bastaba
            // siempre). window.location fuerza una carga real de
            // página, sin depender de esa caché.
            function irAlDetalle() {
              window.location.href = `/panel/ordenes/${o.id}`;
            }

            return (
              <li key={o.id}>
                <Card
                  onClick={
                    puedeVerDetalle
                      ? irAlDetalle
                      : puedeEditarDescripcion
                        ? () => setEditandoDescripcion(o.id)
                        : undefined
                  }
                  className={`flex min-w-0 flex-col overflow-hidden py-0 transition-colors sm:flex-row ${
                    puedeVerDetalle || puedeEditarDescripcion
                      ? "cursor-pointer hover:ring-primary/40"
                      : ""
                  }`}
                >
                  {/* vehicle-thumb: ancho fijo al costado en desktop
                      (flex: 0 0 142px en el mockup), arriba en mobile —
                      solo si hay evidencia real subida, sin inventar
                      una imagen de stock. */}
                  {o.fotos.length > 0 && (
                    <div
                      className="relative h-32 shrink-0 bg-background sm:h-auto sm:w-[142px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a href={o.fotos[0]} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={o.fotos[0]}
                          alt="Estado del vehículo"
                          className="size-full object-cover"
                        />
                      </a>
                      {o.fotos.length > 1 && (
                        <Badge
                          variant="secondary"
                          className="absolute bottom-2 left-2 bg-background/85"
                        >
                          {o.fotos.length}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* order-card-body */}
                  <div className="min-w-0 flex-1 p-4 sm:p-[18px]">
                    {/* order-topline */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[13px] text-muted-foreground">
                        OT-{o.numero}
                      </span>
                      <Badge variant={VARIANTE_ESTADO[o.estado]}>
                        {nombreEstado(o.estado)}
                      </Badge>
                    </div>

                    {/* vehicle-name */}
                    <div className="mt-4 flex flex-wrap items-baseline gap-x-2">
                      <span className="font-mono text-lg font-semibold tracking-wide">
                        {o.patente}
                      </span>
                      {o.marca && (
                        <span className="text-[14px] text-muted-foreground">
                          {o.marca} {o.modelo}
                        </span>
                      )}
                    </div>

                    {/* h3 (título) + order-detail */}
                    <div className="mt-2 space-y-1">
                      {o.sintoma && (
                        <p className="text-[15px]">{o.sintoma}</p>
                      )}
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
                      {o.estado === "esperando_repuesto" &&
                        o.esperaDetalle && (
                          <p className="text-[15px]">
                            <span className="text-muted-foreground">
                              El auto no está aquí, esperando:{" "}
                            </span>
                            {o.esperaDetalle}
                          </p>
                        )}
                    </div>

                    {/* order-meta */}
                    <p className="mt-4 border-t border-border pt-3 text-[13px] text-muted-foreground">
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

                    {/* order-actions */}
                    <div
                      className="mt-4 flex flex-wrap gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {tieneImpresion && (
                        <a
                          href={`/imprimir/${o.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className={buttonVariants({ variant: "outline" })}
                        >
                          Imprimir
                        </a>
                      )}
                      {o.estado === "ingresado" && (
                        <Button
                          variant="outline"
                          onClick={() => avanzar(o.id, "en_proceso")}
                        >
                          Empezar
                        </Button>
                      )}
                      {(o.estado === "ingresado" ||
                        o.estado === "en_proceso") && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            setEsperando(esperando === o.id ? null : o.id)
                          }
                        >
                          Falta repuesto
                        </Button>
                      )}
                      {o.estado === "esperando_repuesto" && (
                        <Button
                          variant="outline"
                          onClick={() => volvio(o.id)}
                          disabled={retomando === o.id}
                        >
                          {retomando === o.id
                            ? "Guardando…"
                            : "Volvió el auto"}
                        </Button>
                      )}
                      {(o.estado === "ingresado" ||
                        o.estado === "en_proceso") && (
                        <Button onClick={irAlDetalle}>Terminar</Button>
                      )}
                      {o.estado === "terminado" && (
                        <>
                          <Button onClick={() => avanzar(o.id, "entregado")}>
                            Entregar
                          </Button>
                          {o.telefono && (
                            <a
                              href={`https://wa.me/${o.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(
                                `Hola ${o.propietario ?? ""}, su ${o.marca ?? "vehículo"} patente ${o.patente} ya está listo para retirar.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className={buttonVariants({
                                variant: "outline",
                              })}
                            >
                              Avisar
                            </a>
                          )}
                        </>
                      )}
                    </div>

                    {/* stopPropagation: las órdenes Terminadas/Entregadas
                        abren "Editar descripción" al hacer clic en toda
                        la tarjeta (más abajo, onClick de la Card) — sin
                        esto, escribir en el formulario de EsperarRepuesto
                        burbujeaba hasta la tarjeta y abría ese modal
                        encima por error. */}
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
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
