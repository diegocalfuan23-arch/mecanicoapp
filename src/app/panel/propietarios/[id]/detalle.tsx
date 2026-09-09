"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { pesos, fecha as formatoFecha } from "@/lib/formato";
import { Selector } from "@/components/ui/selector";
import { Button } from "@/components/ui/button";
import {
  actualizarRatingNps,
  actualizarNotificarEmail,
  type ClienteCRMDetalle,
} from "../acciones";
import { Formulario } from "../tabla";

function nombreCompleto(c: ClienteCRMDetalle) {
  return [c.nombre, c.apellido].filter(Boolean).join(" ");
}

function tiempoRelativo(fecha: Date | null) {
  if (!fecha) return "—";
  const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000);
  if (dias <= 0) return "Hoy";
  if (dias === 1) return "hace 1 día";
  if (dias < 30) return `hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `hace ${meses} ${meses === 1 ? "mes" : "meses"}`;
  const anios = Math.floor(meses / 12);
  return `hace ${anios} ${anios === 1 ? "año" : "años"}`;
}

const OPCIONES_RATING = [
  { valor: "", texto: "Sin calificar" },
  { valor: "1", texto: "1 / 5" },
  { valor: "2", texto: "2 / 5" },
  { valor: "3", texto: "3 / 5" },
  { valor: "4", texto: "4 / 5" },
  { valor: "5", texto: "5 / 5" },
];

const OPCIONES_NPS = [
  { valor: "", texto: "Sin calificar" },
  ...Array.from({ length: 11 }, (_, i) => ({ valor: String(i), texto: String(i) })),
];

const ETIQUETA_ESTADO_CITA: Record<string, string> = {
  agendada: "Programada",
  confirmada: "Confirmada",
  completada: "Completada",
  cancelada: "Cancelada",
  no_presento: "No asistió",
};

function Interruptor({
  activo,
  onClick,
  disabled,
}: {
  activo: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      onClick={onClick}
      disabled={disabled}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed ${
        activo ? "bg-primary" : "bg-border"
      }`}
    >
      <span
        className={`absolute top-0.5 size-4 rounded-full bg-background transition-transform ${
          activo ? "translate-x-4.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function Acordeon({
  titulo,
  cantidad,
  children,
}: {
  titulo: string;
  cantidad: number;
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="rounded-xl border border-border">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          {titulo} ({cantidad})
        </span>
        <svg
          viewBox="0 0 20 20"
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${abierto ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path
            d="M6 8l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {abierto && cantidad > 0 && (
        <div className="border-t border-border px-4 py-3">{children}</div>
      )}
    </div>
  );
}

export function DetalleClienteCRM({
  cliente,
  tieneImpresion,
}: {
  cliente: ClienteCRMDetalle;
  tieneImpresion: boolean;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [rating, setRating] = useState(cliente.rating ? String(cliente.rating) : "");
  const [nps, setNps] = useState(cliente.nps != null ? String(cliente.nps) : "");
  const [notificarEmail, setNotificarEmail] = useState(cliente.notificarEmail);
  const [guardando, setGuardando] = useState(false);

  async function guardarRatingNps(nuevoRating: string, nuevoNps: string) {
    setGuardando(true);
    await actualizarRatingNps(cliente.id, {
      rating: nuevoRating ? Number(nuevoRating) : null,
      nps: nuevoNps ? Number(nuevoNps) : null,
    });
    setGuardando(false);
    router.refresh();
  }

  async function alternarNotificarEmail() {
    const nuevo = !notificarEmail;
    setNotificarEmail(nuevo);
    await actualizarNotificarEmail(cliente.id, nuevo);
    router.refresh();
  }

  if (editando) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-lg font-medium">
          {nombreCompleto(cliente)} · Cliente #{cliente.numero}
        </h2>
        <div className="mt-6">
          <Formulario
            propietario={{
              id: cliente.id,
              numero: cliente.numero,
              nombre: cliente.nombre,
              apellido: cliente.apellido,
              rut: cliente.rut,
              documentoAlternativo: false,
              telefono: cliente.telefono,
              email: cliente.email,
              direccion: cliente.direccion,
              direccionDepto: null,
              comuna: null,
              ciudad: null,
              esEmpresa: false,
              empresa: null,
              empresaRut: null,
              notas: cliente.notas,
              trato: "normal",
              formaPago: null,
              autos: cliente.vehiculos,
              deuda: 0,
              visitas: cliente.ordenes,
              gastado: 0,
              ultimaVisita: cliente.ultimoContacto,
            }}
            tieneImpresion={tieneImpresion}
            onListo={() => {
              setEditando(false);
              router.refresh();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/panel/propietarios"
            className="mb-2 inline-flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground"
          >
            ← Clientes
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">
            {nombreCompleto(cliente)}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Métricas de relación y actividad del cliente
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {cliente.email && (
            <a
              href={`mailto:${cliente.email}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-1.5 text-[13px] font-medium transition-colors hover:bg-card"
            >
              Enviar correo
            </a>
          )}
          {cliente.telefono && (
            <a
              href={`https://wa.me/${cliente.telefono.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-success/15 px-4 py-1.5 text-[13px] font-medium text-success transition-colors hover:bg-success/25"
            >
              Contactar por WhatsApp
            </a>
          )}
          {cliente.telefono && (
            <a
              href={`tel:${cliente.telefono}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-1.5 text-[13px] font-medium transition-colors hover:bg-card"
            >
              Llamar
            </a>
          )}
          <Button onClick={() => setEditando(true)}>Editar</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { etiqueta: "Órdenes", valor: cliente.ordenes },
          { etiqueta: "Presupuestos", valor: cliente.presupuestos },
          { etiqueta: "Ventas", valor: cliente.ventas },
          { etiqueta: "Citas", valor: cliente.citas },
          { etiqueta: "Vehículos", valor: cliente.vehiculos },
        ].map((k) => (
          <div key={k.etiqueta} className="rounded-xl border border-border bg-card p-4">
            <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
              {k.etiqueta}
            </p>
            <p className="mt-2 text-2xl font-bold">{k.valor}</p>
          </div>
        ))}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
            Monto presupuestos
          </p>
          <p className="mt-2 text-2xl font-bold text-muted-foreground">—</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
            Rating
          </p>
          <div className="mt-2">
            <Selector
              value={rating}
              onChange={(v) => {
                setRating(v);
                guardarRatingNps(v, nps);
              }}
              opciones={OPCIONES_RATING}
              placeholder="—"
            />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
            NPS
          </p>
          <div className="mt-2">
            <Selector
              value={nps}
              onChange={(v) => {
                setNps(v);
                guardarRatingNps(rating, v);
              }}
              opciones={OPCIONES_NPS}
              placeholder="—"
            />
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
            Último contacto
          </p>
          <p className="mt-2 text-lg font-bold">{tiempoRelativo(cliente.ultimoContacto)}</p>
          {cliente.ultimoContacto && (
            <p className="text-[12px] text-muted-foreground">
              {formatoFecha(cliente.ultimoContacto)}
            </p>
          )}
        </div>
      </div>
      {guardando && (
        <p className="mt-2 text-[12px] text-muted-foreground">Guardando…</p>
      )}
      <p className="mt-2 text-[13px] text-muted-foreground">
        Promedio de evaluaciones en órdenes de trabajo entregadas.
      </p>

      <div className="mt-8">
        <h2 className="mb-3 text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          Historial de documentos
        </h2>
        <div className="flex flex-col gap-3">
          <Acordeon titulo="Órdenes de trabajo" cantidad={cliente.ordenesDetalle.length}>
            <ul className="flex flex-col gap-2">
              {cliente.ordenesDetalle.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between text-[14px]"
                >
                  <span>
                    OT-{o.numero} · {formatoFecha(o.fecha)}
                  </span>
                  <span className="font-medium tabular-nums">{pesos(o.total)}</span>
                </li>
              ))}
            </ul>
          </Acordeon>
          <Acordeon titulo="Ventas POS" cantidad={cliente.ventasDetalle.length}>
            <ul className="flex flex-col gap-2">
              {cliente.ventasDetalle.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between text-[14px]"
                >
                  <span>
                    V-{v.numero} · {formatoFecha(v.fecha)}
                  </span>
                  <span className="font-medium tabular-nums">{pesos(v.total)}</span>
                </li>
              ))}
            </ul>
          </Acordeon>
          <Acordeon titulo="Citas" cantidad={cliente.citasDetalle.length}>
            <ul className="flex flex-col gap-2">
              {cliente.citasDetalle.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between text-[14px]"
                >
                  <span className="truncate">
                    {c.motivo} · {formatoFecha(c.fecha)}
                  </span>
                  <span className="shrink-0 text-[12px] text-muted-foreground">
                    {ETIQUETA_ESTADO_CITA[c.estado] ?? c.estado}
                  </span>
                </li>
              ))}
            </ul>
          </Acordeon>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-medium">Datos generales</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <span className="text-[13px] text-muted-foreground">Nombre: </span>
            <span className="text-[14px]">{cliente.nombre}</span>
          </div>
          <div>
            <span className="text-[13px] text-muted-foreground">Apellido: </span>
            <span className="text-[14px]">{cliente.apellido || "—"}</span>
          </div>
          <div>
            <span className="text-[13px] text-muted-foreground">Email: </span>
            <span className="text-[14px]">{cliente.email || "—"}</span>
          </div>
          <div>
            <span className="text-[13px] text-muted-foreground">Teléfono: </span>
            <span className="text-[14px]">{cliente.telefono || "—"}</span>
          </div>
          <div>
            <span className="text-[13px] text-muted-foreground">RUT: </span>
            <span className="text-[14px]">{cliente.rut || "—"}</span>
          </div>
          <div>
            <span className="text-[13px] text-muted-foreground">Dirección: </span>
            <span className="text-[14px]">{cliente.direccion || "—"}</span>
          </div>
          <div>
            <span className="text-[13px] text-muted-foreground">Actualizado: </span>
            <span className="text-[14px]">{formatoFecha(cliente.updatedAt)}</span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-[13px] text-muted-foreground">Notas: </span>
            <span className="text-[14px]">{cliente.notas || "—"}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-medium">Notificaciones</h2>
        <p className="mt-1 text-[13px] text-muted-foreground italic">
          Activa los canales en los que el cliente desea recibir avisos del
          taller.
        </p>
        <div className="mt-4 flex flex-wrap gap-8">
          <label className="flex items-center gap-3">
            <Interruptor activo={notificarEmail} onClick={alternarNotificarEmail} />
            <span className="text-[14px]">Notificar por email</span>
          </label>
          <div>
            <label className="flex items-center gap-3">
              <Interruptor activo={false} disabled />
              <span className="text-[14px] text-muted-foreground">
                Notificar por WhatsApp
              </span>
            </label>
            <p className="mt-1 text-[12px] text-acento">
              Conecta WhatsApp en configuración para habilitar esta opción.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium">Vehículos sugeridos</h2>
        <p className="mt-1 text-[13px] text-muted-foreground italic">
          Se agregan al usar un vehículo en una cotización, orden o cita; no
          implican propiedad del vehículo.
        </p>
        {cliente.vehiculosDetalle.length === 0 ? (
          <p className="mt-4 text-[14px] text-muted-foreground">
            Sin vehículos sugeridos para este cliente.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {cliente.vehiculosDetalle.map((v) => (
              <div key={v.id} className="rounded-xl border border-border bg-card p-4">
                <Link
                  href={`/panel/historial/${v.patente}`}
                  className="inline-block rounded-md border border-border px-2 py-1 font-mono text-[14px] font-bold hover:bg-background"
                >
                  {v.patente}
                </Link>
                <p className="mt-2 text-[14px] text-muted-foreground">
                  {[v.marca, v.modelo, v.anio, v.color].filter(Boolean).join(" ") ||
                    "Sin datos"}
                </p>
                {v.vin && (
                  <p className="mt-1 text-[12px] text-muted-foreground">VIN: {v.vin}</p>
                )}
                <label className="mt-3 flex items-center gap-3">
                  <Interruptor activo={false} disabled />
                  <span className="text-[14px] text-muted-foreground">
                    Notificar recordatorio de revisión técnica
                  </span>
                </label>
                <p className="mt-1 text-[12px] text-acento">
                  Conecta WhatsApp en configuración para enviar el recordatorio.
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
