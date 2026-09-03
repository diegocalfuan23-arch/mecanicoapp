"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  buscarVehiculos,
  guardarBusquedaPatente,
  busquedasRecientes,
  type ResultadoBusqueda,
} from "./acciones";
import { buscarPorPatente, guardarVehiculo } from "@/app/panel/vehiculos/acciones";

type Resultado = ResultadoBusqueda;
type DatosExternos = {
  vin: string;
  marca: string;
  modelo: string;
  anio: string;
  color: string;
  motor: string;
  cilindrada: string;
  tipo: string;
  kilometrajeInicial: string;
};

export function Buscador({
  tieneImpresion = false,
}: {
  /** Plan Serviteca: si no hay coincidencia local, busca en GetAPI
   * por patente (marca/modelo/año/color/VIN) — nunca trae historial
   * de trabajos, eso solo existe para autos que ya pasaron por acá. */
  tieneImpresion?: boolean;
}) {
  const router = useRouter();
  const [consulta, setConsulta] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [buscando, empezarBusqueda] = useTransition();
  const [buscoAlgo, setBuscoAlgo] = useState(false);
  const [externo, setExterno] = useState<DatosExternos | null>(null);
  const [buscandoExterno, setBuscandoExterno] = useState(false);
  const [errorExterno, setErrorExterno] = useState<string | null>(null);
  const [registrando, setRegistrando] = useState(false);
  const [errorRegistro, setErrorRegistro] = useState<string | null>(null);
  const [recientes, setRecientes] = useState<string[]>([]);

  useEffect(() => {
    busquedasRecientes().then(setRecientes);
  }, []);

  /** Registro en un clic con lo que ya trajo GetAPI — sin pasar por
   * el formulario. El propietario queda vacío: eso no existe en
   * registros públicos, se completa después a mano. */
  async function registrarDeUnClic() {
    if (!externo) return;
    setRegistrando(true);
    setErrorRegistro(null);

    const res = await guardarVehiculo({
      patente: consulta.trim(),
      vin: externo.vin,
      marca: externo.marca,
      modelo: externo.modelo,
      anio: externo.anio,
      color: externo.color,
      tipo: externo.tipo,
      motor: externo.motor,
      cilindrada: externo.cilindrada,
      kilometrajeInicial: externo.kilometrajeInicial,
      primeraVez: true,
      comparteHistorial: false,
    });

    setRegistrando(false);
    if (res?.error) {
      setErrorRegistro(res.error);
      return;
    }
    // Ya quedó registrado — se va a la ficha en Vehículos, no al
    // formulario de "nuevo" (eso volvería a pedir la misma patente).
    router.push("/panel/vehiculos");
  }

  // Búsqueda local: rápida, es tu propia base de datos — sin costo
  // externo por cada tecla.
  useEffect(() => {
    const q = consulta.trim();
    // Cuadro vacío: no hay nada que sincronizar con el servidor, así
    // que no dispara setState desde el cuerpo del efecto — solo
    // "no programar la consulta" (el estado vacío se deriva más abajo
    // directo de `consulta`, sin duplicarlo en resultados/buscoAlgo).
    if (!q) return;

    const espera = setTimeout(() => {
      empezarBusqueda(async () => {
        const propios = await buscarVehiculos(q);
        setResultados(propios);
        setBuscoAlgo(true);
        setExterno(null);
        // Solo se guarda como "búsqueda de patente" si la consulta
        // luce como una patente (no cualquier término que haya
        // matcheado por marca, modelo o nombre del dueño).
        const patenteLimpia = q.toUpperCase().replace(/[^A-Z0-9]/g, "");
        if (propios.length > 0 && patenteLimpia.length >= 5) {
          guardarBusquedaPatente(q).then(() => busquedasRecientes().then(setRecientes));
        }
      });
    }, 250);

    return () => clearTimeout(espera);
  }, [consulta]);

  // Registro externo (GetAPI): debounce mucho más largo a propósito
  // — la key de prueba solo permite 3 consultas por minuto, y con
  // 250ms cada letra tecleada gastaba el límite antes de terminar de
  // escribir la patente completa (bug real: "UD8011" con 6 letras
  // dispararía 6 consultas). Se espera bastante más que deje de
  // escribir, y solo corre si ya se sabe que no hay nada local.
  useEffect(() => {
    const q = consulta.trim();
    if (!q || !tieneImpresion || buscando || resultados.length > 0) return;
    if (!buscoAlgo) return;

    const espera = setTimeout(() => {
      setBuscandoExterno(true);
      setErrorExterno(null);
      buscarPorPatente(q).then((res) => {
        setBuscandoExterno(false);
        if (res.ok) {
          setExterno(res.datos);
          guardarBusquedaPatente(q).then(() => busquedasRecientes().then(setRecientes));
        } else if (res.error && res.error !== "No se encontró esa patente.") {
          // "No encontrada" cae al mensaje normal de siempre — solo
          // se avisa aparte cuando algo salió mal de verdad (límite
          // de consultas, sin conexión, etc.).
          setErrorExterno(res.error);
        }
      });
    }, 1200);

    return () => clearTimeout(espera);
  }, [consulta, tieneImpresion, buscando, buscoAlgo, resultados.length]);

  return (
    <>
      <div className="relative">
        <svg
          viewBox="0 0 20 20"
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        >
          <path
            d="M9 15A6 6 0 109 3a6 6 0 000 12zM13.5 13.5L17 17"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <input
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="Escribe la patente"
          autoFocus
          autoCapitalize="characters"
          className="w-full rounded-xl border border-border bg-card py-4 pr-4 pl-12 text-lg outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {(buscando || buscandoExterno) && (
        <p className="mt-6 text-muted-foreground">Buscando…</p>
      )}

      {!buscandoExterno && errorExterno && (
        <p className="mt-6 text-[13px] text-destructive" role="alert">
          {errorExterno}
        </p>
      )}

      {/* Sin coincidencia local, pero sí en el registro externo (Plan
          Serviteca): se ve como una tarjeta más, marcada como que no
          ha pasado por acá — solo trae datos del auto, nunca
          historial de trabajos (eso no existe fuera de este taller).
          El propietario nunca viene de acá: no existe en registros
          públicos, se completa después a mano. */}
      {!buscando &&
        !buscandoExterno &&
        !!consulta.trim() &&
        buscoAlgo &&
        resultados.length === 0 &&
        externo && (
          <div className="mt-6 rounded-xl border border-border bg-card px-6 py-4">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="font-mono text-lg font-medium">
                {consulta.trim().toUpperCase()}
              </span>
              <span className="text-muted-foreground">
                {[externo.marca, externo.modelo, externo.anio]
                  .filter(Boolean)
                  .join(" ")}
              </span>
              <span className="rounded-full bg-foreground/10 px-2 py-1 text-[12px] font-medium">
                No registrado en tu taller
              </span>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] text-muted-foreground sm:grid-cols-3">
              {externo.color && (
                <div>
                  <dt className="text-[11px] uppercase">Color</dt>
                  <dd>{externo.color}</dd>
                </div>
              )}
              {externo.tipo && (
                <div>
                  <dt className="text-[11px] uppercase">Tipo</dt>
                  <dd>{externo.tipo}</dd>
                </div>
              )}
              {externo.motor && (
                <div>
                  <dt className="text-[11px] uppercase">Motor</dt>
                  <dd>{externo.motor}</dd>
                </div>
              )}
              {externo.cilindrada && (
                <div>
                  <dt className="text-[11px] uppercase">Cilindrada</dt>
                  <dd>{externo.cilindrada}</dd>
                </div>
              )}
              {externo.vin && (
                <div>
                  <dt className="text-[11px] uppercase">VIN</dt>
                  <dd className="font-mono">{externo.vin}</dd>
                </div>
              )}
              {externo.kilometrajeInicial && (
                <div>
                  <dt className="text-[11px] uppercase">Kilometraje</dt>
                  <dd>
                    {Number(externo.kilometrajeInicial).toLocaleString("es-CL")}{" "}
                    km
                  </dd>
                </div>
              )}
            </dl>

            <p className="mt-3 text-[12px] text-muted-foreground">
              El dueño no viene en este registro — se agrega después.
            </p>

            {errorRegistro && (
              <p className="mt-2 text-[13px] text-destructive" role="alert">
                {errorRegistro}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={registrarDeUnClic}
                disabled={registrando}
                className="rounded-lg bg-primary px-4 py-2 text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {registrando ? "Registrando…" : "Registrarlo con estos datos"}
              </button>
              <Link
                href={`/panel/vehiculos?patente=${encodeURIComponent(consulta.trim())}`}
                className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Revisar antes de guardar
              </Link>
            </div>
          </div>
        )}

      {!buscando &&
        !buscandoExterno &&
        !!consulta.trim() &&
        buscoAlgo &&
        resultados.length === 0 &&
        !externo && (
          <div className="mt-8 rounded-xl border border-dashed border-border py-12 text-center">
            <p className="text-muted-foreground">
              Ningún vehículo coincide con «{consulta.trim()}».
            </p>
            <Link
              href={`/panel/vehiculos?patente=${encodeURIComponent(consulta.trim())}`}
              className="mt-4 inline-block text-acento hover:underline"
            >
              Registrarlo
            </Link>
          </div>
        )}

      {!!consulta.trim() && resultados.length > 0 && (
        <ul className="mt-6 flex flex-col gap-2">
          {resultados.map((v) => (
            <li key={v.id}>
              <Link
                href={`/panel/historial/${v.id}`}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card px-6 py-4 transition-colors hover:border-primary/40"
              >
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="font-mono text-lg font-medium">
                      {v.patente}
                    </span>
                    <span className="text-muted-foreground">
                      {[v.marca, v.modelo, v.anio].filter(Boolean).join(" ")}
                    </span>
                    {!v.propio && (
                      <span className="rounded-full bg-foreground/10 px-2 py-1 text-[12px] font-medium">
                        Otro taller
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {v.propietario ?? "Sin dueño registrado"}
                    {v.color ? ` · ${v.color}` : ""}
                  </p>
                </div>
                <span className="text-[13px] text-muted-foreground">
                  {v.visitas === 0
                    ? "Sin visitas"
                    : `${v.visitas} ${v.visitas === 1 ? "visita" : "visitas"}`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!consulta.trim() && recientes.length > 0 && (
        <div className="mt-8">
          <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
            Búsquedas recientes
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {recientes.map((patente) => (
              <button
                key={patente}
                type="button"
                onClick={() => setConsulta(patente)}
                className="rounded-full border border-border bg-card px-3 py-1.5 font-mono text-[13px] transition-colors hover:border-primary/40"
              >
                {patente}
              </button>
            ))}
          </div>
        </div>
      )}

      {!consulta.trim() && (
        <p className="mt-8 text-center text-muted-foreground">
          También puedes buscar por marca, modelo o nombre del dueño.
        </p>
      )}
    </>
  );
}
