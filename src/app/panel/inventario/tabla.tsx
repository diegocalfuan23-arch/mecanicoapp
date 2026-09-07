"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  guardarInsumo,
  actualizarInsumo,
  eliminarInsumo,
  guardarServicio,
  actualizarServicio,
  eliminarServicio,
  type TipoItemServicio,
} from "./acciones";
import { pesos, miles, soloDigitos } from "@/lib/formato";
import { Button } from "@/components/ui/button";

type Insumo = {
  id: string;
  nombre: string;
  codigo: string | null;
  marca: string | null;
  stock: number;
  stockMinimo: number;
  costo: number;
  precio: number;
};

type Servicio = {
  id: string;
  tipo: string;
  nombre: string;
  descripcion: string | null;
  costo: number;
  precio: number | null;
  duracionMinutos: number | null;
  tarifaHora: number | null;
  horasPorDefecto: number | null;
};

const campoBase =
  "w-full rounded-lg border border-border bg-card px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30";

export function Formulario({
  insumo,
  onListo,
  enModal = false,
}: {
  insumo?: Insumo;
  onListo: () => void;
  enModal?: boolean;
}) {
  const router = useRouter();
  const editando = !!insumo;
  const [nombre, setNombre] = useState(insumo?.nombre ?? "");
  const [codigo, setCodigo] = useState(insumo?.codigo ?? "");
  const [marca, setMarca] = useState(insumo?.marca ?? "");
  const [stock, setStock] = useState(insumo ? String(insumo.stock) : "");
  const [stockMinimo, setStockMinimo] = useState(
    insumo ? String(insumo.stockMinimo) : ""
  );
  const [costo, setCosto] = useState(insumo ? String(insumo.costo) : "");
  const [precio, setPrecio] = useState(insumo ? String(insumo.precio) : "");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  async function guardar() {
    if (!nombre.trim()) return;
    setError(null);
    const datos = { nombre, codigo, marca, stock, stockMinimo, costo, precio };
    const res = editando
      ? await actualizarInsumo(insumo.id, datos)
      : await guardarInsumo(datos);

    if (res?.error) {
      setError(res.error);
      return res;
    }
    return res;
  }

  // Con autoguardado (editando) no hace falta el botón submit — cada
  // onBlur guarda solo. Sin él, "Volver" tiene que guardar primero: el
  // blur del campo con foco y el click competían por el mismo
  // re-render (mismo problema ya resuelto en Órdenes).
  async function alSalir() {
    if (!editando) return;
    await guardar();
    setGuardado(true);
    setTimeout(() => setGuardado(false), 1500);
    router.refresh();
  }

  async function volver() {
    if (editando) await guardar();
    onListo();
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const res = await guardar();
    setEnviando(false);
    if (!res?.error) {
      onListo();
      router.refresh();
    }
  }

  const contenido = (
    <>
      {!enModal && (
        <>
          <h2 className="text-lg font-medium">
            {editando ? `Editar ${insumo.nombre}` : "Nuevo insumo"}
          </h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Aceite, líquido de frenos, discos de corte — lo que se compra por
            adelantado, no un repuesto puntual de un auto.
          </p>
        </>
      )}

      <form
        onSubmit={editando ? (e) => e.preventDefault() : enviar}
        className={enModal ? "flex flex-col gap-4" : "mt-6 flex flex-col gap-4"}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">
              Nombre
            </span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onBlur={alSalir}
              placeholder="Aceite 10W-40"
              autoFocus
              className={campoBase}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">
              Código (opcional)
            </span>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              onBlur={alSalir}
              placeholder="Interno o del proveedor"
              className={campoBase}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">
              Marca (opcional)
            </span>
            <input
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              onBlur={alSalir}
              placeholder="Bosch, NGK, Monroe…"
              className={campoBase}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">
              Stock actual
            </span>
            <input
              value={stock}
              onChange={(e) => setStock(soloDigitos(e.target.value))}
              onBlur={alSalir}
              placeholder="10"
              inputMode="numeric"
              className={campoBase}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">
              Avisar si baja de
            </span>
            <input
              value={stockMinimo}
              onChange={(e) => setStockMinimo(soloDigitos(e.target.value))}
              onBlur={alSalir}
              placeholder="2"
              inputMode="numeric"
              className={campoBase}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">
              Costo por unidad
            </span>
            <input
              value={miles(costo)}
              onChange={(e) => setCosto(soloDigitos(e.target.value))}
              onBlur={alSalir}
              placeholder="17.500"
              inputMode="numeric"
              className={campoBase}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">
              Precio por unidad
            </span>
            <input
              value={miles(precio)}
              onChange={(e) => setPrecio(soloDigitos(e.target.value))}
              onBlur={alSalir}
              placeholder="25.000"
              inputMode="numeric"
              className={campoBase}
            />
          </label>
        </div>

        {error && <p className="text-[13px] text-destructive">{error}</p>}

        {editando ? (
          <div className="flex items-center justify-between gap-4">
            <span className="text-[13px] text-muted-foreground">
              {guardado ? "Guardado" : "Los cambios se guardan solos"}
            </span>
            <Button variant="outline" type="button" onClick={volver}>
              Volver
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button type="submit" disabled={enviando}>
              {enviando ? "Guardando…" : "Registrar insumo"}
            </Button>
            {!enModal && (
              <Button variant="outline" type="button" onClick={onListo}>
                Cancelar
              </Button>
            )}
          </div>
        )}
      </form>
    </>
  );

  if (enModal) return contenido;

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      {contenido}
    </div>
  );
}

export function FormularioServicio({
  tipo,
  item,
  onListo,
  enModal = false,
}: {
  tipo: TipoItemServicio;
  item?: Servicio;
  onListo: () => void;
  enModal?: boolean;
}) {
  const router = useRouter();
  const editando = !!item;
  const [nombre, setNombre] = useState(item?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(item?.descripcion ?? "");
  const [costo, setCosto] = useState(item ? String(item.costo) : "");
  const [precio, setPrecio] = useState(
    item?.precio != null ? String(item.precio) : ""
  );
  const [duracionMinutos, setDuracionMinutos] = useState(
    item?.duracionMinutos != null ? String(item.duracionMinutos) : ""
  );
  const [tarifaHora, setTarifaHora] = useState(
    item?.tarifaHora != null ? String(item.tarifaHora) : ""
  );
  const [horasPorDefecto, setHorasPorDefecto] = useState(
    item?.horasPorDefecto != null ? String(item.horasPorDefecto) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const esServicio = tipo === "servicio";

  async function guardar() {
    if (!nombre.trim()) return;
    setError(null);
    const datos = {
      tipo,
      nombre,
      descripcion,
      costo,
      precio,
      duracionMinutos,
      tarifaHora,
      horasPorDefecto,
    };
    const res = editando
      ? await actualizarServicio(item.id, datos)
      : await guardarServicio(datos);

    if (res?.error) {
      setError(res.error);
      return res;
    }
    return res;
  }

  async function alSalir() {
    if (!editando) return;
    await guardar();
    setGuardado(true);
    setTimeout(() => setGuardado(false), 1500);
    router.refresh();
  }

  async function volver() {
    if (editando) await guardar();
    onListo();
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const res = await guardar();
    setEnviando(false);
    if (!res?.error) {
      onListo();
      router.refresh();
    }
  }

  const contenido = (
    <>
      {!enModal && (
        <>
          <h2 className="text-lg font-medium">
            {editando
              ? `Editar ${item.nombre}`
              : esServicio
                ? "Nuevo servicio"
                : "Nueva mano de obra"}
          </h2>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {esServicio
              ? "Se cobra a precio fijo — cambio de aceite, alineación, diagnóstico."
              : "Se cobra por tarifa y horas — desarme, instalación, reparación."}
          </p>
        </>
      )}

      <form
        onSubmit={editando ? (e) => e.preventDefault() : enviar}
        className={enModal ? "flex flex-col gap-4" : "mt-6 flex flex-col gap-4"}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-[13px] font-medium">
              Nombre
            </span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onBlur={alSalir}
              placeholder={esServicio ? "Cambio de aceite" : "Mano de obra general"}
              autoFocus
              className={campoBase}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-[13px] font-medium">
              Descripción (opcional)
            </span>
            <input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              onBlur={alSalir}
              placeholder="Detalle, compatibilidad, notas internas…"
              className={campoBase}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[13px] font-medium">
              Costo por unidad
            </span>
            <input
              value={miles(costo)}
              onChange={(e) => setCosto(soloDigitos(e.target.value))}
              onBlur={alSalir}
              placeholder="0"
              inputMode="numeric"
              className={campoBase}
            />
          </label>
          {esServicio ? (
            <>
              <label className="block">
                <span className="mb-2 block text-[13px] font-medium">
                  Precio del servicio
                </span>
                <input
                  value={miles(precio)}
                  onChange={(e) => setPrecio(soloDigitos(e.target.value))}
                  onBlur={alSalir}
                  placeholder="12.000"
                  inputMode="numeric"
                  className={campoBase}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[13px] font-medium">
                  Duración estimada (min)
                </span>
                <input
                  value={duracionMinutos}
                  onChange={(e) =>
                    setDuracionMinutos(soloDigitos(e.target.value))
                  }
                  onBlur={alSalir}
                  placeholder="30"
                  inputMode="numeric"
                  className={campoBase}
                />
              </label>
            </>
          ) : (
            <>
              <label className="block">
                <span className="mb-2 block text-[13px] font-medium">
                  Tarifa por hora
                </span>
                <input
                  value={miles(tarifaHora)}
                  onChange={(e) => setTarifaHora(soloDigitos(e.target.value))}
                  onBlur={alSalir}
                  placeholder="15.000"
                  inputMode="numeric"
                  className={campoBase}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[13px] font-medium">
                  Horas por defecto
                </span>
                <input
                  value={horasPorDefecto}
                  onChange={(e) =>
                    setHorasPorDefecto(soloDigitos(e.target.value))
                  }
                  onBlur={alSalir}
                  placeholder="1"
                  inputMode="numeric"
                  className={campoBase}
                />
              </label>
            </>
          )}
        </div>

        {error && <p className="text-[13px] text-destructive">{error}</p>}

        {editando ? (
          <div className="flex items-center justify-between gap-4">
            <span className="text-[13px] text-muted-foreground">
              {guardado ? "Guardado" : "Los cambios se guardan solos"}
            </span>
            <Button variant="outline" type="button" onClick={volver}>
              Volver
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button type="submit" disabled={enviando}>
              {enviando ? "Guardando…" : "Registrar"}
            </Button>
            {!enModal && (
              <Button variant="outline" type="button" onClick={onListo}>
                Cancelar
              </Button>
            )}
          </div>
        )}
      </form>
    </>
  );

  if (enModal) return contenido;

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      {contenido}
    </div>
  );
}

function ListaServicios({
  tipo,
  servicios,
  onEditar,
  onNuevo,
}: {
  tipo: TipoItemServicio;
  servicios: Servicio[];
  onEditar: (servicio: Servicio) => void;
  onNuevo: () => void;
}) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState<Servicio | null>(null);
  const [borrando, setBorrando] = useState(false);

  const filtrados = servicios.filter((s) => s.tipo === tipo);
  const esServicio = tipo === "servicio";

  async function borrar() {
    if (!confirmando) return;
    setBorrando(true);
    await eliminarServicio(confirmando.id);
    setBorrando(false);
    setConfirmando(null);
    router.refresh();
  }

  return (
    <>
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
              ¿Eliminar {confirmando.nombre}?
            </h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Las órdenes o ventas que ya lo usaron mantienen su registro,
              solo se borra del catálogo.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={borrar}
                disabled={borrando}
                className="rounded-lg bg-destructive px-6 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {borrando ? "Borrando…" : "Sí, eliminar"}
              </button>
              <Button variant="outline" onClick={() => setConfirmando(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {filtrados.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">
            {esServicio
              ? "Todavía no registraste ningún servicio."
              : "Todavía no registraste mano de obra."}
          </p>
          <button
            onClick={onNuevo}
            className="mt-4 text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Registrar el primero
          </button>
        </div>
      ) : (
        <>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:hidden">
            {filtrados.map((s) => (
              <li
                key={s.id}
                onClick={() => onEditar(s)}
                className="flex min-w-0 cursor-pointer flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:p-6"
              >
                <p className="truncate font-medium">{s.nombre}</p>
                {s.descripcion && (
                  <p className="mt-1 truncate text-[13px] text-muted-foreground">
                    {s.descripcion}
                  </p>
                )}
                <p className="mt-4 text-2xl font-bold">
                  {esServicio ? pesos(s.precio ?? 0) : pesos(s.tarifaHora ?? 0)}
                </p>
                <p className="text-[13px] text-muted-foreground">
                  {esServicio
                    ? s.duracionMinutos
                      ? `${s.duracionMinutos} min estimados`
                      : "sin duración estimada"
                    : `por hora${s.horasPorDefecto ? ` · ${s.horasPorDefecto}h por defecto` : ""}`}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmando(s);
                  }}
                  className="mt-4 self-start text-[13px] text-muted-foreground underline underline-offset-4 hover:text-destructive"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>

          <div className="scroll-discreto mt-6 hidden overflow-x-auto rounded-xl border border-border lg:block">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-border bg-card">
                  {[
                    "Nombre",
                    "Costo",
                    esServicio ? "Precio" : "Tarifa/hora",
                    esServicio ? "Duración" : "Horas por defecto",
                    "Acciones",
                  ].map((c) => (
                    <th
                      key={c}
                      className="px-4 py-4 text-left font-medium whitespace-nowrap text-muted-foreground"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => onEditar(s)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-card/50"
                  >
                    <td className="px-4 py-4 font-medium whitespace-nowrap">
                      {s.nombre}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap tabular-nums">
                      {pesos(s.costo)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap tabular-nums">
                      {esServicio ? pesos(s.precio ?? 0) : pesos(s.tarifaHora ?? 0)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                      {esServicio
                        ? s.duracionMinutos
                          ? `${s.duracionMinutos} min`
                          : "No especifica"
                        : s.horasPorDefecto
                          ? `${s.horasPorDefecto} h`
                          : "No especifica"}
                    </td>
                    <td
                      className="px-4 py-4 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setConfirmando(s)}
                        className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-destructive"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

const ETIQUETA_TIPO: Record<"repuesto" | "servicio" | "mano_obra", string> = {
  repuesto: "Repuesto/producto",
  servicio: "Servicio",
  mano_obra: "Mano de obra",
};

function BadgeTipo({ tipo }: { tipo: "repuesto" | "servicio" | "mano_obra" }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-2.5 py-1 text-[12px] font-medium whitespace-nowrap text-primary">
      {ETIQUETA_TIPO[tipo]}
    </span>
  );
}

export function TablaInventario({
  insumos,
  servicios,
}: {
  insumos: Insumo[];
  servicios: Servicio[];
}) {
  const router = useRouter();
  const [pestana, setPestana] = useState<
    "todos" | "repuesto" | "servicio" | "mano_obra"
  >("todos");
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [tipoNuevo, setTipoNuevo] = useState<
    "repuesto" | "servicio" | "mano_obra"
  >("repuesto");
  const [editando, setEditando] = useState<Insumo | null>(null);
  const [editandoServicio, setEditandoServicio] = useState<Servicio | null>(
    null
  );
  const [confirmando, setConfirmando] = useState<Insumo | null>(null);
  const [borrando, setBorrando] = useState(false);

  async function borrar() {
    if (!confirmando) return;
    setBorrando(true);
    await eliminarInsumo(confirmando.id);
    setBorrando(false);
    setConfirmando(null);
    router.refresh();
  }

  const pestanas: { id: typeof pestana; etiqueta: string }[] = [
    { id: "todos", etiqueta: "Todos" },
    { id: "repuesto", etiqueta: "Repuesto / producto" },
    { id: "servicio", etiqueta: "Servicio" },
    { id: "mano_obra", etiqueta: "Mano de obra" },
  ];

  const q = busqueda.trim().toLowerCase();
  const insumosFiltrados = insumos.filter(
    (i) =>
      !q ||
      i.nombre.toLowerCase().includes(q) ||
      i.codigo?.toLowerCase().includes(q) ||
      i.marca?.toLowerCase().includes(q)
  );
  const serviciosFiltrados = servicios.filter(
    (s) => !q || s.nombre.toLowerCase().includes(q)
  );

  function cerrarFormularios() {
    setAbierto(false);
    setEditando(null);
    setEditandoServicio(null);
  }

  // Editando ya trae su tipo fijo desde la fila — solo al crear se
  // eligen las 3 pestañas dentro del propio modal (como Bujía).
  const tipoModal: "repuesto" | "servicio" | "mano_obra" = editandoServicio
    ? (editandoServicio.tipo as "servicio" | "mano_obra")
    : editando
      ? "repuesto"
      : tipoNuevo;

  const modalNuevoItem = (abierto || editando || editandoServicio) && (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        aria-label="Cancelar"
        onClick={cerrarFormularios}
        className="absolute inset-0 bg-black/60"
      />
      <div
        role="dialog"
        aria-modal
        className="scroll-discreto relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-border bg-card p-6 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-medium">
            {editando || editandoServicio ? "Editar ítem" : "Nuevo ítem de inventario"}
          </h2>
          <button
            aria-label="Cerrar"
            onClick={cerrarFormularios}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 flex gap-1 rounded-lg border border-border p-1">
          {(["repuesto", "servicio", "mano_obra"] as const).map((t) => (
            <button
              key={t}
              type="button"
              disabled={!!editando || !!editandoServicio}
              onClick={() => setTipoNuevo(t)}
              className={`flex-1 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                tipoModal === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {ETIQUETA_TIPO[t]}
            </button>
          ))}
        </div>

        <div className="mt-6">
          {tipoModal === "repuesto" ? (
            <Formulario
              key={editando?.id ?? "nuevo"}
              insumo={editando ?? undefined}
              onListo={cerrarFormularios}
              enModal
            />
          ) : (
            <FormularioServicio
              key={editandoServicio?.id ?? "nuevo"}
              tipo={tipoModal}
              item={editandoServicio ?? undefined}
              onListo={cerrarFormularios}
              enModal
            />
          )}
        </div>
      </div>
    </div>
  );

  const encabezado = (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <svg
          viewBox="0 0 20 20"
          className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        >
          <circle
            cx="9"
            cy="9"
            r="6.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M17 17l-4-4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, código o marca…"
          className="w-full rounded-lg border border-border bg-card py-1.5 pr-3 pl-8 text-[13px] outline-none placeholder:text-muted-foreground/60 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
        />
      </div>
      <Button
        onClick={() => {
          cerrarFormularios();
          setTipoNuevo(pestana === "todos" ? "repuesto" : pestana);
          setAbierto(true);
        }}
        className="shrink-0"
      >
        Nuevo ítem
      </Button>
    </div>
  );

  const tabs = (
    <div className="mb-6 flex w-full gap-1 overflow-x-auto rounded-lg border border-border p-1 sm:w-fit">
      {pestanas.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => {
            setPestana(p.id);
            cerrarFormularios();
          }}
          className={`shrink-0 rounded-md px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors ${
            pestana === p.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {p.etiqueta}
        </button>
      ))}
    </div>
  );

  if (pestana === "servicio" || pestana === "mano_obra") {
    return (
      <>
        {encabezado}
        {tabs}
        {modalNuevoItem}
        <ListaServicios
          tipo={pestana}
          servicios={serviciosFiltrados}
          onEditar={(s) => setEditandoServicio(s)}
          onNuevo={() => {
            setTipoNuevo(pestana);
            setAbierto(true);
          }}
        />
      </>
    );
  }

  const filasTodos =
    pestana === "todos"
      ? [
          ...insumosFiltrados.map((i) => ({
            id: i.id,
            tipo: "repuesto" as const,
            nombre: i.nombre,
            precio: i.precio,
            insumo: i,
          })),
          ...serviciosFiltrados.map((s) => ({
            id: s.id,
            tipo: s.tipo as "servicio" | "mano_obra",
            nombre: s.nombre,
            precio: s.tipo === "servicio" ? (s.precio ?? 0) : (s.tarifaHora ?? 0),
            servicio: s,
          })),
        ].sort((a, b) => a.nombre.localeCompare(b.nombre))
      : [];

  if (pestana === "todos") {
    return (
      <>
        {encabezado}
        {tabs}
        {modalNuevoItem}
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
                ¿Eliminar {confirmando.nombre}?
              </h2>
              <p className="mt-2 text-[15px] text-muted-foreground">
                Las órdenes que ya lo usaron mantienen su registro, solo se
                borra del inventario.
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={borrar}
                  disabled={borrando}
                  className="rounded-lg bg-destructive px-6 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {borrando ? "Borrando…" : "Sí, eliminar"}
                </button>
                <Button variant="outline" onClick={() => setConfirmando(null)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {filasTodos.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-border py-16 text-center">
            <p className="text-muted-foreground">
              {q
                ? "Nada coincide con esa búsqueda."
                : "Todavía no registraste nada en el inventario."}
            </p>
          </div>
        ) : (
          <div className="scroll-discreto overflow-x-auto rounded-xl border border-border">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-border bg-card">
                  {["Nombre", "Tipo", "Precio", "Acciones"].map((c) => (
                    <th
                      key={c}
                      className="px-4 py-3 text-left font-medium whitespace-nowrap text-muted-foreground"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filasTodos.map((f) => (
                  <tr
                    key={f.id}
                    onClick={() =>
                      f.tipo === "repuesto"
                        ? setEditando(f.insumo!)
                        : setEditandoServicio(f.servicio!)
                    }
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-card/50"
                  >
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {f.nombre}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <BadgeTipo tipo={f.tipo} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                      {pesos(f.precio)}
                    </td>
                    <td
                      className="px-4 py-3 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          f.tipo === "repuesto"
                            ? setConfirmando(f.insumo!)
                            : undefined
                        }
                        className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-destructive"
                      >
                        {f.tipo === "repuesto" ? "Eliminar" : "Editar para eliminar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {encabezado}
      {tabs}
      {modalNuevoItem}
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
              ¿Eliminar {confirmando.nombre}?
            </h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Las órdenes que ya lo usaron mantienen su registro, solo se
              borra del inventario.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={borrar}
                disabled={borrando}
                className="rounded-lg bg-destructive px-6 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {borrando ? "Borrando…" : "Sí, eliminar"}
              </button>
              <Button variant="outline" onClick={() => setConfirmando(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {insumosFiltrados.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">
            {q
              ? "Nada coincide con esa búsqueda."
              : "Todavía no registraste ningún insumo."}
          </p>
          {!q && (
            <button
              onClick={() => {
                setTipoNuevo("repuesto");
                setAbierto(true);
              }}
              className="mt-4 text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Registrar el primero
            </button>
          )}
        </div>
      ) : (
        <>
          {/* En el teléfono, cada insumo es una tarjeta — la tabla de
              escritorio obligaría a arrastrar de lado. */}
          <ul className="grid gap-4 sm:grid-cols-2 lg:hidden">
            {insumosFiltrados.map((i) => {
              const bajo = i.stock <= i.stockMinimo && i.stockMinimo > 0;
              return (
                <li
                  key={i.id}
                  onClick={() => setEditando(i)}
                  className="flex min-w-0 cursor-pointer flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:p-6"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-medium">{i.nombre}</p>
                    {bajo && (
                      <span className="shrink-0 rounded-full bg-acento/15 px-2 py-1 text-[12px] font-medium text-acento">
                        Queda poco
                      </span>
                    )}
                  </div>
                  {(i.marca || i.codigo) && (
                    <p className="mt-1 truncate text-[13px] text-muted-foreground">
                      {[i.marca, i.codigo].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <p className="mt-4 text-2xl font-bold">{i.stock}</p>
                  <p className="text-[13px] text-muted-foreground">
                    en stock
                  </p>
                  <p className="mt-4 text-[13px] text-muted-foreground">
                    Cuesta {pesos(i.costo)} · cobras {pesos(i.precio)}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmando(i);
                    }}
                    className="mt-4 self-start text-[13px] text-muted-foreground underline underline-offset-4 hover:text-destructive"
                  >
                    Eliminar
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="scroll-discreto hidden overflow-x-auto rounded-xl border border-border lg:block">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-border bg-card">
                  {["Nombre", "Código", "Marca", "Stock", "Costo", "Precio", "Acciones"].map(
                    (c) => (
                      <th
                        key={c}
                        className="px-4 py-4 text-left font-medium whitespace-nowrap text-muted-foreground"
                      >
                        {c}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {insumosFiltrados.map((i) => {
                  const bajo = i.stock <= i.stockMinimo && i.stockMinimo > 0;
                  return (
                    <tr
                      key={i.id}
                      onClick={() => setEditando(i)}
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-card/50"
                    >
                      <td className="px-4 py-4 font-medium whitespace-nowrap">
                        {i.nombre}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                        {i.codigo ?? "No especifica"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                        {i.marca ?? "No especifica"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap tabular-nums">
                        {i.stock}
                        {bajo && (
                          <span className="ml-2 rounded-full bg-acento/15 px-2 py-1 font-sans text-[12px] font-medium text-acento">
                            Queda poco
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap tabular-nums">
                        {pesos(i.costo)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap tabular-nums">
                        {pesos(i.precio)}
                      </td>
                      <td
                        className="px-4 py-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setConfirmando(i)}
                          className="text-[13px] text-muted-foreground underline underline-offset-4 hover:text-destructive"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
