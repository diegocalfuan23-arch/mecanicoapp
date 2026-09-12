"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  crearInvitacion,
  cancelarInvitacion,
  cambiarRol,
  cambiarVePagos,
  quitarMiembro,
  asignarRolPersonalizado,
} from "./acciones";
import { Roles, type RolPersonalizado } from "./roles";
import { ETIQUETA_MODULO } from "@/lib/modulos-panel";
import { Selector } from "@/components/ui/selector";
import { Button } from "@/components/ui/button";

type Rol = "jefe_taller" | "mecanico";

type Miembro = {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  vePagos: boolean;
  rolPersonalizadoId: string | null;
  rolPersonalizadoNombre: string | null;
  createdAt: Date;
};

type Invitacion = {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  expiraEn: Date;
};

const ROLES = [
  { valor: "mecanico", texto: "Mecánico" },
  { valor: "jefe_taller", texto: "Jefe de taller" },
];

const ETIQUETA_ROL: Record<string, string> = {
  jefe_taller: "Jefe de taller",
  mecanico: "Mecánico",
};

/** Prefijo para distinguir un valor de rol a medida dentro del mismo Selector que jefe_taller/mecanico. */
const PREFIJO_PERSONALIZADO = "personalizado:";

const campo =
  "w-full rounded-lg border border-border bg-background px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30";

function Formulario({
  onListo,
  esDueno,
  rolesPersonalizados,
}: {
  onListo: () => void;
  /** Solo el dueño puede nombrar Jefe de taller o asignar roles a medida. */
  esDueno: boolean;
  rolesPersonalizados: RolPersonalizado[];
}) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [valorRol, setValorRol] = useState<string>("mecanico");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkGenerado, setLinkGenerado] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const esPersonalizado = valorRol.startsWith(PREFIJO_PERSONALIZADO);
  const rol: Rol = esPersonalizado
    ? "mecanico"
    : (valorRol as Rol);
  const rolPersonalizadoId = esPersonalizado
    ? valorRol.slice(PREFIJO_PERSONALIZADO.length)
    : null;

  const opcionesRol = [
    ...(esDueno ? ROLES : ROLES.filter((r) => r.valor === "mecanico")),
    ...(esDueno
      ? rolesPersonalizados.map((r) => ({
          valor: `${PREFIJO_PERSONALIZADO}${r.id}`,
          texto: r.nombre,
        }))
      : []),
  ];

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const res = await crearInvitacion({ nombre, correo, rol, rolPersonalizadoId });
    setEnviando(false);

    if (res?.error || !res?.url) {
      setError(res?.error ?? "No se pudo generar la invitación.");
      return;
    }

    setLinkGenerado(res.url);
    router.refresh();
  }

  async function copiarLink() {
    if (!linkGenerado) return;
    await navigator.clipboard.writeText(linkGenerado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  if (linkGenerado) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
        <h2 className="text-lg font-medium">Invitación enviada</h2>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Le mandamos un correo a {correo}. Si prefieres avisarle tú mismo
          (WhatsApp, etc.), comparte este link:
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={linkGenerado}
            onFocus={(e) => e.target.select()}
            className={`${campo} font-mono text-[13px]`}
          />
          <Button type="button" variant="outline" onClick={copiarLink} className="shrink-0">
            {copiado ? "Copiado" : "Copiar"}
          </Button>
        </div>
        <p className="mt-2 text-[12px] text-muted-foreground">
          El link sirve por 7 días. La persona crea su propia contraseña
          al entrar.
        </p>
        <Button type="button" onClick={onListo} className="mt-4">
          Listo
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <h2 className="text-lg font-medium">Invitar al equipo</h2>
      <p className="mt-1 text-[14px] text-muted-foreground">
        Le mandamos un link para que cree su propia cuenta y contraseña —
        tú no necesitas definirla.
      </p>

      <form onSubmit={enviar} className="mt-6 flex flex-col gap-4">
        <label className="block">
          <span className="mb-2 block text-[13px] font-medium">Nombre</span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre de la persona"
            autoFocus
            className={campo}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[13px] font-medium">Correo</span>
          <input
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            type="email"
            placeholder="correo@ejemplo.cl"
            className={campo}
          />
        </label>

        <div>
          <span className="mb-2 block text-[13px] font-medium">Rol</span>
          <Selector
            value={valorRol}
            onChange={setValorRol}
            opciones={opcionesRol}
          />
          <p className="mt-2 text-[12px] text-muted-foreground">
            {esPersonalizado
              ? "Ve solo los módulos que elegiste al crear este rol."
              : rol === "jefe_taller"
                ? "Ve todo salvo poder tocar a otro jefe de taller o al dueño."
                : "Ve Órdenes, Vehículos y lo operativo del día a día."}
          </p>
        </div>

        {error && <p className="text-[13px] text-destructive">{error}</p>}

        <div className="flex flex-col gap-4 sm:flex-row">
          <Button type="submit" disabled={enviando}>
            {enviando ? "Enviando…" : "Enviar invitación"}
          </Button>
          <Button variant="outline" type="button" onClick={onListo}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}

function PestanasEquipo({
  pestana,
  onCambiar,
}: {
  pestana: "equipo" | "roles";
  onCambiar: (p: "equipo" | "roles") => void;
}) {
  const opciones: { valor: "equipo" | "roles"; texto: string }[] = [
    { valor: "equipo", texto: "Equipo" },
    { valor: "roles", texto: "Roles" },
  ];
  return (
    <div className="mb-6 flex gap-1 border-b border-border">
      {opciones.map((o) => (
        <button
          key={o.valor}
          onClick={() => onCambiar(o.valor)}
          className={`px-4 py-2 text-[14px] font-medium transition-colors ${
            pestana === o.valor
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.texto}
        </button>
      ))}
    </div>
  );
}

export function TablaEquipo({
  miembros: iniciales,
  invitaciones,
  esDueno,
  rolesPersonalizados,
  tieneRolesPersonalizados,
  modulosDisponibles,
}: {
  miembros: Miembro[];
  invitaciones: Invitacion[];
  /** El dueño puede nombrar jefes de taller y tocar a cualquiera. */
  esDueno: boolean;
  rolesPersonalizados: RolPersonalizado[];
  /** Siempre true hoy (los 4 planes lo tienen) — se deja por si algún plan futuro vuelve a excluirlo. */
  tieneRolesPersonalizados: boolean;
  /** Qué módulos puede marcar un rol a medida — varía según el plan del taller. */
  modulosDisponibles: readonly string[];
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [pestana, setPestana] = useState<"equipo" | "roles">("equipo");
  const [confirmando, setConfirmando] = useState<Miembro | null>(null);
  const [quitando, setQuitando] = useState(false);
  // Optimista: el checkbox/selector responde al instante, sin esperar
  // la vuelta del servidor ni un router.refresh() completo por cada clic.
  const [miembros, setMiembros] = useState(iniciales);

  async function quitar() {
    if (!confirmando) return;
    setQuitando(true);
    await quitarMiembro(confirmando.id);
    setQuitando(false);
    setConfirmando(null);
    router.refresh();
  }

  async function alternarVePagos(m: Miembro) {
    const nuevo = !m.vePagos;
    setMiembros((actuales) =>
      actuales.map((x) => (x.id === m.id ? { ...x, vePagos: nuevo } : x))
    );
    await cambiarVePagos(m.id, nuevo);
  }

  async function alternarRol(m: Miembro, valor: string) {
    const esPersonalizado = valor.startsWith(PREFIJO_PERSONALIZADO);
    const anterior = { rol: m.rol, rolPersonalizadoId: m.rolPersonalizadoId };

    if (esPersonalizado) {
      const rolPersonalizadoId = valor.slice(PREFIJO_PERSONALIZADO.length);
      const nombre =
        rolesPersonalizados.find((r) => r.id === rolPersonalizadoId)?.nombre ??
        null;
      setMiembros((actuales) =>
        actuales.map((x) =>
          x.id === m.id
            ? { ...x, rolPersonalizadoId, rolPersonalizadoNombre: nombre }
            : x
        )
      );
      const res = await asignarRolPersonalizado(m.id, rolPersonalizadoId);
      if (res?.error) {
        setMiembros((actuales) =>
          actuales.map((x) => (x.id === m.id ? { ...x, ...anterior } : x))
        );
        router.refresh();
      }
      return;
    }

    const rol = valor as Rol;
    setMiembros((actuales) =>
      actuales.map((x) =>
        x.id === m.id
          ? { ...x, rol, rolPersonalizadoId: null, rolPersonalizadoNombre: null }
          : x
      )
    );
    const res = await cambiarRol(m.id, rol);
    if (res?.error) {
      // Revertir en la UI si el servidor lo rechazó (ej. un jefe de
      // taller tratando de nombrar a otro jefe de taller).
      setMiembros((actuales) =>
        actuales.map((x) => (x.id === m.id ? { ...x, ...anterior } : x))
      );
      router.refresh();
    }
  }

  if (abierto) {
    return (
      <Formulario
        onListo={() => setAbierto(false)}
        esDueno={esDueno}
        rolesPersonalizados={rolesPersonalizados}
      />
    );
  }

  if (tieneRolesPersonalizados && pestana === "roles") {
    return (
      <>
        <PestanasEquipo pestana={pestana} onCambiar={setPestana} />
        <Roles
          roles={rolesPersonalizados}
          modulos={modulosDisponibles}
          etiquetas={ETIQUETA_MODULO}
        />
      </>
    );
  }

  return (
    <>
      {tieneRolesPersonalizados && (
        <PestanasEquipo pestana={pestana} onCambiar={setPestana} />
      )}
      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            aria-label="Cancelar"
            onClick={() => setConfirmando(null)}
            className="absolute inset-0 bg-black/60"
          />
          <div
            role="dialog"
            aria-modal
            className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6"
          >
            <h2 className="text-lg font-medium">
              ¿Quitar a {confirmando.nombre}?
            </h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Deja de tener acceso al taller. Su cuenta no se borra, solo
              se desvincula.
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={quitar}
                disabled={quitando}
                className="rounded-lg bg-destructive px-6 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {quitando ? "Quitando…" : "Sí, quitar"}
              </button>
              <Button variant="outline" onClick={() => setConfirmando(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={() => setAbierto(true)} className="shrink-0">
          Invitar al equipo
        </Button>
      </div>

      {invitaciones.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-[13px] font-medium text-muted-foreground">
            Invitaciones pendientes
          </p>
          <ul className="flex flex-col gap-2">
            {invitaciones.map((inv) => (
              <li
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border px-4 py-3"
              >
                <div>
                  <span className="text-[14px] font-medium">
                    {inv.nombre}
                  </span>
                  <span className="ml-2 text-[13px] text-muted-foreground">
                    {inv.email} · {ETIQUETA_ROL[inv.rol] ?? inv.rol}
                  </span>
                </div>
                <button
                  onClick={async () => {
                    await cancelarInvitacion(inv.id);
                    router.refresh();
                  }}
                  className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-destructive"
                >
                  Cancelar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {miembros.length === 0 && invitaciones.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">
            Todavía no agregaste a nadie de tu equipo.
          </p>
          <button
            onClick={() => setAbierto(true)}
            className="mt-4 text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Invitar al primero
          </button>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {miembros.map((m) => {
            // Un jefe_taller (no dueño) no puede tocar a otro
            // jefe_taller — ni cambiarle el rol, ni quitarlo.
            const puedeGestionar = esDueno || m.rol !== "jefe_taller";

            return (
              <li
                key={m.id}
                className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-4 sm:p-6"
              >
                <p className="truncate font-medium">{m.nombre}</p>
                <p className="mt-1 truncate text-[14px] text-muted-foreground">
                  {m.correo}
                </p>

                {puedeGestionar ? (
                  <div className="mt-3">
                    <Selector
                      value={
                        m.rolPersonalizadoId
                          ? `${PREFIJO_PERSONALIZADO}${m.rolPersonalizadoId}`
                          : m.rol
                      }
                      onChange={(v) => alternarRol(m, v)}
                      opciones={[
                        ...(esDueno
                          ? ROLES
                          : ROLES.filter((r) => r.valor === "mecanico")),
                        ...(esDueno
                          ? rolesPersonalizados.map((r) => ({
                              valor: `${PREFIJO_PERSONALIZADO}${r.id}`,
                              texto: r.nombre,
                            }))
                          : []),
                      ]}
                      className="text-[13px]"
                    />
                  </div>
                ) : (
                  <span className="mt-3 inline-block w-fit rounded-full bg-foreground/10 px-3 py-1 text-[12px] font-medium">
                    {m.rolPersonalizadoNombre ?? ETIQUETA_ROL[m.rol] ?? m.rol}
                  </span>
                )}

                {!m.rolPersonalizadoId && m.rol !== "jefe_taller" && (
                  <label className="mt-4 flex items-center gap-2 text-[13px]">
                    <input
                      type="checkbox"
                      checked={m.vePagos}
                      onChange={() => alternarVePagos(m)}
                      className="size-4 accent-primary"
                    />
                    Ve Pagos y precios de repuestos
                  </label>
                )}

                {puedeGestionar && (
                  <button
                    onClick={() => setConfirmando(m)}
                    className="mt-4 self-start text-[13px] text-muted-foreground underline underline-offset-4 hover:text-destructive"
                  >
                    Quitar
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
