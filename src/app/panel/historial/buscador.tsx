"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { buscarVehiculos, type ResultadoBusqueda } from "./acciones";
import { Dictar } from "@/components/dictar";

type Resultado = ResultadoBusqueda;

export function Buscador() {
  const [consulta, setConsulta] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [buscando, empezarBusqueda] = useTransition();
  const [buscoAlgo, setBuscoAlgo] = useState(false);

  const [pregunta, setPregunta] = useState<string | null>(null);
  const [respuesta, setRespuesta] = useState<string | null>(null);
  const [preguntando, setPreguntando] = useState(false);

  async function preguntar(texto: string) {
    setPregunta(texto);
    setRespuesta(null);
    setPreguntando(true);
    setConsulta("");

    try {
      const res = await fetch("/api/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta: texto }),
      });
      const datos = await res.json();
      setRespuesta(res.ok ? datos.respuesta : `No se pudo responder: ${datos.error}`);
    } catch {
      setRespuesta("No se pudo conectar con el asistente.");
    } finally {
      setPreguntando(false);
    }
  }

  useEffect(() => {
    const q = consulta.trim();

    if (!q) {
      setResultados([]);
      setBuscoAlgo(false);
      return;
    }

    // Espera a que deje de escribir antes de consultar
    const espera = setTimeout(() => {
      empezarBusqueda(async () => {
        setResultados(await buscarVehiculos(q));
        setBuscoAlgo(true);
      });
    }, 250);

    return () => clearTimeout(espera);
  }, [consulta]);

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <span className="text-[13px] text-muted-foreground">
          O pregunta directo: &quot;¿cuánto debe la BXFS19?&quot;
        </span>
        <Dictar etiqueta="Preguntar" onTexto={preguntar} />
      </div>

      {(preguntando || respuesta) && (
        <div className="mt-4 rounded-xl border border-border bg-card p-6">
          <p className="text-[13px] text-muted-foreground">{pregunta}</p>
          {preguntando ? (
            <p className="mt-2 text-[15px] text-muted-foreground">
              Buscando…
            </p>
          ) : (
            <p className="mt-2 text-[15px]">{respuesta}</p>
          )}
          <button
            onClick={() => {
              setRespuesta(null);
              setPregunta(null);
            }}
            className="mt-4 text-[13px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="relative mt-4">
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

      {buscando && (
        <p className="mt-6 text-muted-foreground">Buscando…</p>
      )}

      {!buscando && buscoAlgo && resultados.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-border py-12 text-center">
          <p className="text-muted-foreground">
            Ningún vehículo coincide con «{consulta.trim()}».
          </p>
          <Link
            href="/panel/vehiculos"
            className="mt-4 inline-block text-acento hover:underline"
          >
            Registrarlo
          </Link>
        </div>
      )}

      {resultados.length > 0 && (
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

      {!consulta.trim() && (
        <p className="mt-8 text-center text-muted-foreground">
          También puedes buscar por marca, modelo o nombre del dueño.
        </p>
      )}
    </>
  );
}
