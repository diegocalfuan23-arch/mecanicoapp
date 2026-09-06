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

function Formulario({
  insumo,
  onListo,
}: {
  insumo?: Insumo;
  onListo: () => void;
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

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
      <h2 className="text-lg font-medium">
        {editando ? `Editar ${insumo.nombre}` : "Nuevo insumo"}
      </h2>
      <p className="mt-1 text-[14px] text-muted-foreground">
        Aceite, líquido de frenos, discos de corte — lo que se compra por
        adelantado, no un repuesto puntual de un auto.
      </p>

      <form
        onSubmit={editando ? (e) => e.preventDefault() : enviar}
        className="mt-6 flex flex-col gap-4"
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
            <Button variant="outline" type="button" onClick={onListo}>
              Cancelar
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

function FormularioServicio({
  tipo,
  item,
  onListo,
}: {
  tipo: TipoItemServicio;
  item?: Servicio;
  onListo: () => void;
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

  return (
    <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
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

      <form
        onSubmit={editando ? (e) => e.preventDefault() : enviar}
        className="mt-6 flex flex-col gap-4"
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
            <Button variant="outline" type="button" onClick={onListo}>
              Cancelar
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}

function ListaServicios({
  tipo,
  servicios,
}: {
  tipo: TipoItemServicio;
  servicios: Servicio[];
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Servicio | null>(null);
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

  if (abierto || editando) {
    return (
      <FormularioServicio
        key={editando?.id ?? "nuevo"}
        tipo={tipo}
        item={editando ?? undefined}
        onListo={() => {
          setAbierto(false);
          setEditando(null);
        }}
      />
    );
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

      <div className="flex justify-end">
        <Button onClick={() => setAbierto(true)} className="shrink-0">
          {esServicio ? "Nuevo servicio" : "Nueva mano de obra"}
        </Button>
      </div>

      {filtrados.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">
            {esServicio
              ? "Todavía no registraste ningún servicio."
              : "Todavía no registraste mano de obra."}
          </p>
          <button
            onClick={() => setAbierto(true)}
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
                onClick={() => setEditando(s)}
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
                    onClick={() => setEditando(s)}
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

export function TablaInventario({
  insumos,
  servicios,
}: {
  insumos: Insumo[];
  servicios: Servicio[];
}) {
  const router = useRouter();
  const [pestana, setPestana] = useState<"repuesto" | "servicio" | "mano_obra">(
    "repuesto"
  );
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Insumo | null>(null);
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
    { id: "repuesto", etiqueta: "Repuesto/producto" },
    { id: "servicio", etiqueta: "Servicio" },
    { id: "mano_obra", etiqueta: "Mano de obra" },
  ];

  const tabs = (
    <div className="mb-6 flex rounded-lg border border-border p-1">
      {pestanas.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => {
            setPestana(p.id);
            setAbierto(false);
            setEditando(null);
          }}
          className={`flex-1 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
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
        {tabs}
        <ListaServicios tipo={pestana} servicios={servicios} />
      </>
    );
  }

  if (abierto || editando) {
    return (
      <>
        {tabs}
        <Formulario
          key={editando?.id ?? "nuevo"}
          insumo={editando ?? undefined}
          onListo={() => {
            setAbierto(false);
            setEditando(null);
          }}
        />
      </>
    );
  }

  return (
    <>
      {tabs}
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

      <div className="flex justify-end">
        <Button onClick={() => setAbierto(true)} className="shrink-0">
          Nuevo insumo
        </Button>
      </div>

      {insumos.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">
            Todavía no registraste ningún insumo.
          </p>
          <button
            onClick={() => setAbierto(true)}
            className="mt-4 text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Registrar el primero
          </button>
        </div>
      ) : (
        <>
          {/* En el teléfono, cada insumo es una tarjeta — la tabla de
              escritorio obligaría a arrastrar de lado. */}
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:hidden">
            {insumos.map((i) => {
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

          <div className="scroll-discreto mt-6 hidden overflow-x-auto rounded-xl border border-border lg:block">
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
                {insumos.map((i) => {
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
