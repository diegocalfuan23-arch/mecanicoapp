"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Selector } from "@/components/ui/selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BuscadorCliente,
  type ClienteOpcion,
} from "@/components/buscador-cliente";
import {
  BuscadorVehiculo,
  type VehiculoOpcion,
} from "@/components/buscador-vehiculo";
import {
  crearCita,
  cambiarEstadoCita,
  eliminarCita,
  type CitaMes,
  type EstadoCita,
} from "./acciones";

const DIAS_SEMANA = ["LU", "MA", "MI", "JU", "VI", "SA", "DO"];

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const ESTADOS_CITA: { valor: EstadoCita; texto: string }[] = [
  { valor: "agendada", texto: "Agendada" },
  { valor: "confirmada", texto: "Confirmada" },
  { valor: "completada", texto: "Completada" },
  { valor: "no_presento", texto: "No se presentó" },
  { valor: "cancelada", texto: "Cancelada" },
];

const COLOR_ESTADO: Record<EstadoCita, string> = {
  agendada: "bg-primary",
  confirmada: "bg-success",
  completada: "bg-muted-foreground",
  no_presento: "bg-destructive",
  cancelada: "bg-destructive/50",
};

function horaLocal(fecha: Date) {
  return new Date(fecha).toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function diaISO(fecha: Date) {
  const d = new Date(fecha);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
}

function hoyISOLocal() {
  return diaISO(new Date());
}

function ModalNuevaCita({
  fechaInicial,
  clientes,
  vehiculos,
  onCerrar,
}: {
  fechaInicial: string;
  clientes: ClienteOpcion[];
  vehiculos: VehiculoOpcion[];
  onCerrar: () => void;
}) {
  const router = useRouter();
  const [cliente, setCliente] = useState<ClienteOpcion | null>(null);
  const [vehiculo, setVehiculo] = useState<VehiculoOpcion | null>(null);
  const [contactoNombre, setContactoNombre] = useState("");
  const [contactoTelefono, setContactoTelefono] = useState("");
  const [motivo, setMotivo] = useState("");
  const [fechaCita, setFechaCita] = useState(fechaInicial);
  const [hora, setHora] = useState("09:00");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function guardar() {
    setError(null);
    setEnviando(true);
    const res = await crearCita({
      clienteId: cliente?.id,
      vehiculoId: vehiculo?.id,
      contactoNombre,
      contactoTelefono,
      motivo,
      fechaIso: fechaCita,
      hora,
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
        className="scroll-discreto relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-medium">Nueva cita</h2>
          <button
            aria-label="Cerrar"
            onClick={onCerrar}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="mt-6">
          <span className="mb-2 block text-[13px] font-medium">
            Cliente (opcional)
          </span>
          <BuscadorCliente
            clientes={clientes}
            seleccionado={cliente}
            onSeleccionar={setCliente}
            tieneImpresion
          />
        </div>

        {!cliente && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <span className="mb-2 block text-[13px] font-medium">
                Nombre de contacto
              </span>
              <Input
                value={contactoNombre}
                onChange={(e) => setContactoNombre(e.target.value)}
                placeholder="Si aún no está en Clientes"
              />
            </div>
            <div>
              <span className="mb-2 block text-[13px] font-medium">
                Teléfono
              </span>
              <Input
                value={contactoTelefono}
                onChange={(e) => setContactoTelefono(e.target.value)}
                placeholder="+56 9…"
              />
            </div>
          </div>
        )}

        <div className="mt-4">
          <span className="mb-2 block text-[13px] font-medium">
            Vehículo (opcional)
          </span>
          <BuscadorVehiculo
            vehiculos={vehiculos}
            seleccionado={vehiculo}
            onSeleccionar={setVehiculo}
            tieneImpresion
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <span className="mb-2 block text-[13px] font-medium">Fecha</span>
            <Input
              type="date"
              value={fechaCita}
              onChange={(e) => setFechaCita(e.target.value)}
            />
          </div>
          <div>
            <span className="mb-2 block text-[13px] font-medium">Hora</span>
            <Input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          <span className="mb-2 block text-[13px] font-medium">Motivo</span>
          <Input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej. Revisión de frenos, cambio de aceite…"
            autoFocus
          />
        </div>

        {error && (
          <p className="mt-3 text-[13px] text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="button" onClick={guardar} disabled={enviando}>
            {enviando ? "Guardando…" : "Agendar"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function VistaAgenda({
  mes,
  citas,
  clientes,
  vehiculos,
}: {
  mes: string;
  citas: CitaMes[];
  clientes: ClienteOpcion[];
  vehiculos: VehiculoOpcion[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [mesLocal, setMesLocal] = useState(mes);
  const [mesSincronizado, setMesSincronizado] = useState(mes);

  function diaInicialDelMes(mesIso: string) {
    const hoy = hoyISOLocal();
    return hoy.slice(0, 7) === mesIso.slice(0, 7) ? hoy : `${mesIso.slice(0, 7)}-01`;
  }

  const [diaSeleccionado, setDiaSeleccionado] = useState(() => diaInicialDelMes(mes));
  const [creando, setCreando] = useState(false);

  if (mes !== mesSincronizado) {
    setMesSincronizado(mes);
    setMesLocal(mes);
    setDiaSeleccionado(diaInicialDelMes(mes));
  }

  const fechaRef = new Date(`${mesLocal}T00:00:00`);
  const anio = fechaRef.getFullYear();
  const mesIndice = fechaRef.getMonth();

  function irAMes(nuevoMes: string) {
    setMesLocal(nuevoMes);
    startTransition(() => {
      router.push(`/panel/agenda?mes=${nuevoMes}`);
    });
  }

  function cambiarMes(delta: number) {
    const d = new Date(anio, mesIndice + delta, 1);
    irAMes(diaISO(d));
  }

  const primerDiaMes = new Date(anio, mesIndice, 1);
  // getDay(): 0=domingo — se corrige a lunes-primero.
  const offsetInicio = (primerDiaMes.getDay() + 6) % 7;
  const diasEnMes = new Date(anio, mesIndice + 1, 0).getDate();

  const citasPorDia = new Map<string, CitaMes[]>();
  for (const c of citas) {
    const clave = diaISO(c.fecha);
    citasPorDia.set(clave, [...(citasPorDia.get(clave) ?? []), c]);
  }

  const celdas: (number | null)[] = [
    ...Array(offsetInicio).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];

  const citasDelDia = citasPorDia.get(diaSeleccionado) ?? [];

  async function marcarEstado(citaId: string, estado: EstadoCita) {
    const res = await cambiarEstadoCita(citaId, estado);
    if (!res?.error) router.refresh();
  }

  async function borrar(citaId: string) {
    const res = await eliminarCita(citaId);
    if (!res?.error) router.refresh();
  }

  return (
    <>
      {creando && (
        <ModalNuevaCita
          fechaInicial={diaSeleccionado}
          clientes={clientes}
          vehiculos={vehiculos}
          onCerrar={() => setCreando(false)}
        />
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => cambiarMes(-1)}
            aria-label="Mes anterior"
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
          <p className="min-w-40 text-center text-[15px] font-medium">
            {MESES[mesIndice]} de {anio}
          </p>
          <button
            type="button"
            onClick={() => cambiarMes(1)}
            aria-label="Mes siguiente"
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

        <Button onClick={() => setCreando(true)}>+ Nueva cita</Button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="grid grid-cols-7 border-b border-border bg-card">
            {DIAS_SEMANA.map((d) => (
              <div
                key={d}
                className="px-2 py-2 text-center text-[12px] font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {celdas.map((dia, i) => {
              if (dia === null) {
                return <div key={`vacio-${i}`} className="min-h-24 border-b border-r border-border last:border-r-0" />;
              }
              const clave = `${anio}-${String(mesIndice + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
              const citasDia = citasPorDia.get(clave) ?? [];
              const esHoy = clave === hoyISOLocal();
              const esSeleccionado = clave === diaSeleccionado;

              return (
                <button
                  key={clave}
                  type="button"
                  onClick={() => setDiaSeleccionado(clave)}
                  className={`min-h-24 border-b border-r border-border p-2 text-left align-top transition-colors last:border-r-0 hover:bg-card/70 ${
                    esSeleccionado ? "bg-primary/10" : ""
                  }`}
                >
                  <span
                    className={`inline-flex size-6 items-center justify-center rounded-full text-[13px] ${
                      esSeleccionado
                        ? "bg-primary text-primary-foreground font-medium"
                        : esHoy
                          ? "border border-primary font-medium text-primary"
                          : ""
                    }`}
                  >
                    {dia}
                  </span>
                  {citasDia.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {citasDia.slice(0, 4).map((c) => (
                        <span
                          key={c.id}
                          className={`size-1.5 rounded-full ${COLOR_ESTADO[c.estado]}`}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="font-medium">
            {new Date(`${diaSeleccionado}T00:00:00`).toLocaleDateString("es-CL", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {citasDelDia.length} cita{citasDelDia.length === 1 ? "" : "s"}
          </p>

          {citasDelDia.length === 0 ? (
            <p className="mt-6 text-[14px] text-muted-foreground">
              Sin citas este día.
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {citasDelDia.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium tabular-nums">
                        {horaLocal(c.fecha)}
                      </p>
                      <p className="truncate text-[14px]">
                        {c.clienteNombre || c.contactoNombre || "Sin nombre"}
                        {c.patente ? ` · ${c.patente}` : ""}
                      </p>
                      <p className="truncate text-[13px] text-muted-foreground">
                        {c.motivo}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => borrar(c.id)}
                      aria-label="Eliminar cita"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-2">
                    <Selector
                      value={c.estado}
                      onChange={(v) => marcarEstado(c.id, v as EstadoCita)}
                      opciones={ESTADOS_CITA.map((e) => ({
                        valor: e.valor,
                        texto: e.texto,
                      }))}
                      className="text-[13px]"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
