"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  cambiarEstado,
  editarDescripcion,
  esperarRepuesto,
  retomarTrabajo,
  procedimientosDeOrden,
  type Procedimiento,
} from "./acciones";
import { ESTADOS } from "./estados";
import { pesos, fecha } from "@/lib/formato";
import { Dictar } from "@/components/dictar";
import { Procedimientos } from "@/components/procedimientos";
import { Selector } from "@/components/ui/selector";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PackageIcon,
  Tick02Icon,
  Image02Icon,
  Search01Icon,
  FilterIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

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
  procedimientos: number;
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

// No hay un campo de prioridad — se deriva de cuánto lleva
// abierta la orden: más días esperando, más urgente.
function prioridad(fechaIngreso: Date, estado: string): "Alta" | "Media" {
  if (estado === "terminado" || estado === "entregado") return "Media";
  const dias =
    (Date.now() - new Date(fechaIngreso).getTime()) / (1000 * 60 * 60 * 24);
  return dias >= 3 ? "Alta" : "Media";
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
          <Button variant="outline" type="button" onClick={onListo}>
            Volver
          </Button>
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
          <Button variant="outline" type="button" onClick={onListo}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}

export function ListaOrdenes({
  ordenes,
  tieneImpresion,
}: {
  ordenes: Orden[];
  tieneImpresion: boolean;
}) {
  const router = useRouter();
  const [esperando, setEsperando] = useState<string | null>(null);
  const [editandoDescripcion, setEditandoDescripcion] = useState<
    string | null
  >(null);
  const [retomando, setRetomando] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("abiertas");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaAbierta, setBusquedaAbierta] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [kmMinimo, setKmMinimo] = useState("");
  const [kmMaximo, setKmMaximo] = useState("");
  const [ordenAZ, setOrdenAZ] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(15);

  const filtrosActivos =
    (kmMinimo ? 1 : 0) + (kmMaximo ? 1 : 0) + (ordenAZ ? 1 : 0);

  const visibles = (
    filtro === "abiertas"
      ? ordenes.filter((o) => o.estado !== "entregado")
      : ordenes
  )
    .filter((o) => {
      const texto = busqueda.trim().toLowerCase();
      if (!texto) return true;
      return `${o.patente} ${o.marca ?? ""} ${o.modelo ?? ""} ${o.propietario ?? ""}`
        .toLowerCase()
        .includes(texto);
    })
    .filter((o) => {
      if (kmMinimo && (o.kilometraje ?? 0) < Number(kmMinimo)) return false;
      if (kmMaximo && (o.kilometraje ?? 0) > Number(kmMaximo)) return false;
      return true;
    })
    .sort((a, b) => {
      if (!ordenAZ) return 0;
      const nombreA = `${a.marca ?? ""} ${a.modelo ?? ""}`.trim();
      const nombreB = `${b.marca ?? ""} ${b.modelo ?? ""}`.trim();
      return nombreA.localeCompare(nombreB, "es");
    });

  // Si un filtro deja menos páginas de las que había, o cambia el
  // tamaño de página, la página actual puede quedar fuera de rango
  // — se recorta acá mismo en vez de con un efecto aparte.
  const totalPaginas = Math.max(1, Math.ceil(visibles.length / porPagina));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visiblesPagina = visibles.slice(
    (paginaSegura - 1) * porPagina,
    paginaSegura * porPagina
  );

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

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* En móvil, abrir el buscador reemplaza toda la fila (como
            la barra de búsqueda de una app) en vez de competir por
            espacio con Abiertas/Todas/Filtros — con eso angosto se
            veía apretado y el texto se cortaba casi de inmediato.
            Desde sm: siempre hay espacio de sobra, así que conviven
            en la misma fila sin necesidad de ese modo. flex-wrap
            evita que, si igual no cupiera todo, algo se desborde
            fuera de la tarjeta — baja a una segunda línea en vez. */}
        <div
          className={`flex shrink-0 gap-1 rounded-lg border border-border p-1 ${busquedaAbierta ? "hidden sm:flex" : ""}`}
        >
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

        <div
          className={`flex min-w-0 items-center gap-2 ${busquedaAbierta ? "flex-1" : ""} sm:flex-none`}
        >
          {/* En escritorio el buscador está siempre abierto, como un
              campo normal — el modo "ícono que se expande" es solo
              para móvil, donde el espacio compite con Abiertas/Todas/
              Filtros. Por eso este <label> se renderiza siempre, pero
              en móvil queda oculto salvo que busquedaAbierta sea true;
              desde sm: se muestra sin condición. */}
          <label
            className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 sm:flex-none ${busquedaAbierta ? "flex" : "hidden sm:flex"}`}
          >
            <HugeiconsIcon
              icon={Search01Icon}
              className="size-4 shrink-0 text-muted-foreground"
            />
            <input
              autoFocus={busquedaAbierta}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por patente, vehículo…"
              className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground/60 sm:w-64"
            />
            {busqueda && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setBusqueda("")}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
            <button
              type="button"
              aria-label="Cerrar búsqueda"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setBusqueda("");
                setBusquedaAbierta(false);
              }}
              className="shrink-0 text-muted-foreground hover:text-foreground sm:hidden"
            >
              ✕
            </button>
          </label>

          {/* Botón-lupa: solo aparece en móvil cuando el buscador está
              cerrado — en escritorio el campo ya está siempre visible
              arriba, este botón nunca se muestra desde sm:. */}
          {!busquedaAbierta && (
            <button
              type="button"
              onClick={() => setBusquedaAbierta(true)}
              aria-label="Buscar"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border transition-colors hover:bg-card sm:hidden"
            >
              <HugeiconsIcon icon={Search01Icon} className="size-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setMostrarFiltros((a) => !a)}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[14px] transition-colors ${
              mostrarFiltros ? "bg-card" : "hover:bg-card"
            } ${busquedaAbierta ? "hidden sm:flex" : ""}`}
          >
            <HugeiconsIcon icon={FilterIcon} className="size-4" />
            <span className="hidden sm:inline">Filtros</span>
            {filtrosActivos > 0 && (
              <span className="font-semibold text-acento">
                {filtrosActivos}
              </span>
            )}
          </button>

          {/* Selector.Trigger trae "w-full" en su clase base — un
              ancho fijo pasado por className no siempre le gana en
              especificidad. Envolverlo en un <div> de ancho fijo es
              lo confiable: el "w-full" interno llena ESE contenedor,
              en vez de intentar sobrescribir su propia clase. */}
          <div
            className={`w-24 shrink-0 ${busquedaAbierta ? "hidden sm:block" : ""}`}
          >
            <Selector
              value={String(porPagina)}
              onChange={(v) => setPorPagina(Number(v))}
              opciones={[
                { valor: "15", texto: "15" },
                { valor: "30", texto: "30" },
              ]}
              className="bg-card px-2 py-2 text-[13px]"
            />
          </div>
        </div>
      </div>

      {mostrarFiltros && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            aria-label="Cerrar filtros"
            onClick={() => setMostrarFiltros(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div
            role="dialog"
            aria-modal
            className="relative w-full max-w-sm rounded-xl border border-border bg-card p-6"
          >
            <h2 className="text-lg font-medium">Filtros</h2>

            <div className="mt-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="mb-1 block text-[12px] text-muted-foreground">
                    Kilometraje desde
                  </span>
                  <input
                    value={kmMinimo}
                    onChange={(e) =>
                      setKmMinimo(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="0"
                    inputMode="numeric"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-[12px] text-muted-foreground">
                    Kilometraje hasta
                  </span>
                  <input
                    value={kmMaximo}
                    onChange={(e) =>
                      setKmMaximo(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="Sin límite"
                    inputMode="numeric"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[14px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60"
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 text-[14px]">
                <input
                  type="checkbox"
                  checked={ordenAZ}
                  onChange={(e) => setOrdenAZ(e.target.checked)}
                  className="size-4 accent-primary"
                />
                Ordenar A-Z por vehículo
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button
                onClick={() => setMostrarFiltros(false)}
                className="flex-1"
              >
                Aplicar
              </Button>
              {filtrosActivos > 0 && (
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setKmMinimo("");
                    setKmMaximo("");
                    setOrdenAZ(false);
                  }}
                >
                  Limpiar
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {visibles.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-muted-foreground">
            {ordenes.length === 0
              ? "Todavía no hay órdenes de trabajo."
              : "No hay órdenes abiertas."}
          </p>
          {ordenes.length === 0 && (
            <Link
              href="/panel/ordenes/nueva"
              className="mt-4 inline-block text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Ingresar el primer vehículo
            </Link>
          )}
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 lg:grid-cols-2">
          {visiblesPagina.map((o) => {
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

            const nivelPrioridad = prioridad(o.fecha, o.estado);

            return (
              <li
                key={o.id}
                onClick={
                  puedeVerDetalle
                    ? irAlDetalle
                    : puedeEditarDescripcion
                      ? () => setEditandoDescripcion(o.id)
                      : undefined
                }
                className={`flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors sm:flex-row ${
                  puedeVerDetalle || puedeEditarDescripcion
                    ? "cursor-pointer hover:border-primary/40"
                    : ""
                }`}
              >
                {/* vehicle-thumb: ancho fijo al costado en desktop,
                    arriba en mobile — con badge de cantidad de fotos
                    igual al mockup. Solo si hay evidencia real
                    subida, sin inventar una imagen de stock. */}
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
                    <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-background/85 px-2 py-1 text-[11px] text-foreground">
                      <HugeiconsIcon icon={Image02Icon} className="size-3" />
                      {o.fotos.length}
                    </span>
                  </div>
                )}

                {/* order-card-body */}
                <div className="min-w-0 flex-1 p-4 sm:p-[18px]">
                  {/* order-topline: OT-id + estado + prioridad. El
                      mockup solo trae prioridad porque su demo ya
                      agrupaba por sección "En proceso" — acá se
                      mezclan los 5 estados en "Todas", así que el
                      badge de estado sí hace falta. */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[13px] text-muted-foreground">
                      OT-{o.numero}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-[12px] font-medium ${COLOR_ESTADO[o.estado]}`}
                      >
                        {nombreEstado(o.estado)}
                      </span>
                      <span
                        className={`flex items-center gap-1.5 text-[11px] ${
                          nivelPrioridad === "Alta"
                            ? "text-destructive"
                            : "text-acento"
                        }`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {nivelPrioridad}
                      </span>
                    </div>
                  </div>

                  {/* vehicle-name */}
                  <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
                    <span className="font-mono text-lg font-semibold tracking-wide">
                      {o.patente}
                    </span>
                    {o.marca && (
                      <span className="text-[13px] text-muted-foreground">
                        {o.marca} {o.modelo}
                      </span>
                    )}
                  </div>

                  {/* h3 (título) + order-detail */}
                  <div className="mt-2 space-y-1">
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

                  {/* No hay un "total esperado" de procedimientos por
                      orden para calcular un % de avance real — cada
                      trabajo termina llevando una cantidad distinta.
                      Se muestra el conteo tal cual, sin fingir que
                      mide cuánto falta. */}
                  {(puedeVerDetalle || o.estado === "esperando_repuesto") && (
                    <p className="mt-4 text-[13px] text-muted-foreground">
                      {o.procedimientos === 0
                        ? "Sin procedimientos anotados aún"
                        : `${o.procedimientos} ${o.procedimientos === 1 ? "procedimiento anotado" : "procedimientos anotados"}`}
                    </p>
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
                        className="rounded-lg border border-border px-4 py-2 text-[14px] transition-colors hover:bg-background"
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
                        className="flex items-center gap-1.5"
                      >
                        <HugeiconsIcon icon={PackageIcon} className="size-4" />
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
                      <button
                        onClick={irAlDetalle}
                        className="flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-[14px] font-medium text-background transition-opacity hover:opacity-90"
                      >
                        <HugeiconsIcon icon={Tick02Icon} className="size-4" />
                        Terminar
                      </button>
                    )}
                    {o.estado === "terminado" && (
                      <>
                        <button
                          onClick={() => avanzar(o.id, "entregado")}
                          className="flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-[14px] font-medium text-background transition-opacity hover:opacity-90"
                        >
                          <HugeiconsIcon
                            icon={Tick02Icon}
                            className="size-4"
                          />
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

                  {/* stopPropagation: las órdenes Terminadas/Entregadas
                      abren "Editar descripción" al hacer clic en toda
                      la tarjeta (más abajo, onClick del <li>) — sin
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
              </li>
            );
          })}
        </ul>
      )}

      {totalPaginas > 1 && (
        <div className="mt-6 flex items-center justify-center gap-1">
          <button
            type="button"
            disabled={paginaSegura <= 1}
            onClick={() => setPagina(paginaSegura - 1)}
            aria-label="Página anterior"
            className="flex size-8 items-center justify-center rounded-lg border border-border transition-colors hover:bg-card disabled:opacity-40"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
          </button>
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPagina(n)}
              className={`flex size-8 items-center justify-center rounded-lg text-[13px] transition-colors ${
                n === paginaSegura
                  ? "bg-primary font-medium text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-card hover:text-foreground"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            disabled={paginaSegura >= totalPaginas}
            onClick={() => setPagina(paginaSegura + 1)}
            aria-label="Página siguiente"
            className="flex size-8 items-center justify-center rounded-lg border border-border transition-colors hover:bg-card disabled:opacity-40"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
          </button>
        </div>
      )}
    </>
  );
}
