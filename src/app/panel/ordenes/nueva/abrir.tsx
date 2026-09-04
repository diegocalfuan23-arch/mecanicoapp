"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { abrirOrden, type RepuestoUsado } from "../acciones";
import { miles, soloDigitos } from "@/lib/formato";
import { Dictar } from "@/components/dictar";
import { FotosVehiculo } from "@/components/fotos-vehiculo";
import { Selector } from "@/components/ui/selector";
import { Slider } from "@/components/ui/slider";
import { RepuestosUsados } from "@/components/repuestos-usados";
import { DiagramaAuto } from "@/components/diagrama-auto";
import { Button } from "@/components/ui/button";
import {
  accesoriosParaTipo,
  esAccesorioLibre,
  codificarAccesorioLibre,
  textoAccesorioLibre,
} from "@/lib/accesorios-auto";
import { SINTOMAS_COMUNES } from "@/lib/sintomas-comunes";

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

// Valor de opción imposible de chocar con un id real de usuario —
// selecciona el modo "escribir nombre libre" en vez de un técnico.
const OTRO_TECNICO = "__otro__";

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

export function Abrir({
  vehiculos,
  vehiculoIdInicial,
  tieneImpresion,
  inventario,
  tecnicos,
}: {
  vehiculos: VehiculoOpcion[];
  /** Al llegar desde "Nueva visita" en la ficha del vehículo. */
  vehiculoIdInicial?: string;
  /** Plan Serviteca: agrega datos del vehículo y diagrama de daños. */
  tieneImpresion: boolean;
  inventario: Insumo[];
  tecnicos: Tecnico[];
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
  const [combustible, setCombustible] = useState(50);
  const [accesorios, setAccesorios] = useState<string[]>([]);
  const [accesorioLibre, setAccesorioLibre] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [ordenadoPor, setOrdenadoPor] = useState("");
  const [ordenadoPorFono, setOrdenadoPorFono] = useState("");
  const [tecnicoId, setTecnicoId] = useState("");
  const [tecnicoNombre, setTecnicoNombre] = useState("");
  const [usaTecnicoLibre, setUsaTecnicoLibre] = useState(false);
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
      combustible: tieneImpresion ? String(combustible) : "",
      accesorios,
      observaciones,
      ordenadoPor,
      ordenadoPorFono,
      tecnicoId,
      tecnicoNombre,
      piezas,
    });
    setEnviando(false);

    if (res?.error) {
      setError(res.error);
      return;
    }
    router.push("/panel/ordenes");
    router.refresh();
  }

  if (vehiculos.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Necesitas registrar un vehículo antes de abrir una orden.
        </p>
        <button
          onClick={() => router.push("/panel/ordenes")}
          className="mt-4 text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <form onSubmit={enviar} className="flex flex-col gap-4">
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
              value={usaTecnicoLibre ? OTRO_TECNICO : tecnicoId}
              onChange={(valor) => {
                if (valor === OTRO_TECNICO) {
                  setUsaTecnicoLibre(true);
                  setTecnicoId("");
                  return;
                }
                setUsaTecnicoLibre(false);
                setTecnicoId(valor);
                setTecnicoNombre("");
              }}
              placeholder="Sin asignar"
              opciones={[
                ...tecnicos.map((t) => ({ valor: t.id, texto: t.nombre })),
                { valor: OTRO_TECNICO, texto: "Otro (sin cuenta)…" },
              ]}
            />
            {usaTecnicoLibre && (
              <input
                value={tecnicoNombre}
                onChange={(e) => setTecnicoNombre(e.target.value)}
                placeholder="Nombre del técnico"
                autoFocus
                className={`${campoBase()} mt-2`}
              />
            )}
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
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-medium">
                Nivel de combustible
              </span>
              <span className="text-[13px] tabular-nums text-muted-foreground">
                {combustible}%
              </span>
            </div>
            <Slider value={combustible} onChange={setCombustible} />
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
                  setSintoma((actual) => (actual ? `${actual}, ${s}` : s))
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
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  if (!accesorioLibre.trim()) return;
                  setAccesorios((actual) => [
                    ...actual,
                    codificarAccesorioLibre(accesorioLibre),
                  ]);
                  setAccesorioLibre("");
                }}
                className="shrink-0"
              >
                Agregar
              </Button>
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
          <Button type="submit" disabled={enviando}>
            {enviando ? "Abriendo…" : "Abrir orden"}
          </Button>
          <Button
            variant="outline"
            type="button"
            onClick={() => router.push("/panel/ordenes")}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
