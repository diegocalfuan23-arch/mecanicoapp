"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

/**
 * Sin `grupo`, el ítem va siempre visible arriba del todo, fuera de
 * cualquier sección colapsable — son los accesos de uso diario que
 * nadie debería tener que expandir nada para encontrar.
 */
const SECCIONES = [
  {
    href: "/panel",
    texto: "Inicio",
    icono: (
      <path
        d="M3 9.5L10 4l7 5.5V16a1 1 0 01-1 1h-4v-4H8v4H4a1 1 0 01-1-1V9.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/panel/agenda",
    texto: "Agenda",
    icono: (
      <path
        d="M5 4.5h10a1 1 0 011 1V16a1 1 0 01-1 1H5a1 1 0 01-1-1V5.5a1 1 0 011-1zM4 8h12M7 3v3M13 3v3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/panel/historial",
    texto: "Buscar patente",
    icono: (
      <path
        d="M9 15A6 6 0 109 3a6 6 0 000 12zM13.5 13.5L17 17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    ),
  },
  {
    href: "/panel/diagnosticos",
    texto: "Diagnósticos",
    grupo: "Operación",
    icono: (
      <path
        d="M6 3.5v4a3 3 0 006 0v-4M9 12.5a3.5 3.5 0 107 0v-1M13.5 15.5a2 2 0 100-4 2 2 0 000 4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/panel/inspecciones",
    texto: "Inspecciones",
    grupo: "Operación",
    icono: (
      <path
        d="M4 6.5a2 2 0 012-2h8a2 2 0 012 2v9.5l-3-2-3 2-3-2-3 2v-9.5zM7 7.5h6M7 10h6M7 12.5h3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/panel/presupuestos",
    texto: "Presupuestos",
    grupo: "Operación",
    icono: (
      <path
        d="M5 3.5h10a1 1 0 011 1v11a1 1 0 01-1 1H5a1 1 0 01-1-1v-11a1 1 0 011-1zM7 7.5h6M7 10h6M7 12.5h3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/panel/ordenes",
    texto: "Órdenes",
    grupo: "Operación",
    icono: (
      <path
        d="M6 3.5h8a1 1 0 011 1V16a.5.5 0 01-.8.4L10 14l-4.2 2.4A.5.5 0 015 16V4.5a1 1 0 011-1zM7.5 8h5M7.5 10.5h3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/panel/ventas",
    texto: "Ventas POS",
    grupo: "Ventas",
    icono: (
      <path
        d="M4 5.5h1.5l1.4 8.4a1.5 1.5 0 001.5 1.3h6.4a1.5 1.5 0 001.5-1.2l1-5.3H6.3M8 17a1 1 0 100-2 1 1 0 000 2zM13.5 17a1 1 0 100-2 1 1 0 000 2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/panel/vehiculos",
    texto: "Vehículos",
    grupo: "Ventas",
    icono: (
      <path
        d="M3 12.5h14M4.5 12.5l1.2-4.2A2 2 0 017.6 7h4.8a2 2 0 011.9 1.3l1.2 4.2M4 12.5V15a1 1 0 001 1h1a1 1 0 001-1v-.5M13 14.5v.5a1 1 0 001 1h1a1 1 0 001-1v-2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/panel/propietarios",
    texto: "Propietarios",
    grupo: "Ventas",
    icono: (
      <path
        d="M10 10a3 3 0 100-6 3 3 0 000 6zM4 16.5c0-2.5 2.7-4 6-4s6 1.5 6 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    ),
  },
  {
    href: "/panel/inventario",
    texto: "Inventario",
    grupo: "Inventario",
    icono: (
      <path
        d="M4 6.5l6-3 6 3v7l-6 3-6-3v-7zM4 6.5l6 3 6-3M10 9.5V16.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/panel/servicios",
    texto: "Servicios",
    grupo: "Inventario",
    icono: (
      <path
        d="M11.5 2.5l1 2.2 2.3.5-1.6 1.8.2 2.4-2.2-1-2.2 1 .2-2.4-1.6-1.8 2.3-.5 1-2.2zM5.5 12.5a3 3 0 100 6 3 3 0 000-6zM4.5 15.5h2M14 12l2.5 2.5M16.5 12L14 14.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/panel/compras",
    texto: "Compras",
    grupo: "Inventario",
    icono: (
      <path
        d="M4 6l1-3h10l1 3M4 6h12M4 6v9a1 1 0 001 1h10a1 1 0 001-1V6M7.5 9a2.5 2.5 0 005 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/panel/equipo",
    texto: "Equipo",
    grupo: "Administración",
    icono: (
      <path
        d="M7 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM13 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM2.5 16c0-2.2 2-3.5 4.5-3.5s4.5 1.3 4.5 3.5M11 12.8c2 .2 3.5 1.4 3.5 3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/panel/pagos",
    texto: "Pagos",
    grupo: "Administración",
    icono: (
      <path
        d="M3 6.5h14v9H3v-9zM3 9.5h14M6 13h2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/panel/caja",
    texto: "Caja",
    grupo: "Administración",
    icono: (
      <path
        d="M4 5.5h12a1 1 0 011 1v7a1 1 0 01-1 1H4a1 1 0 01-1-1v-7a1 1 0 011-1zM10 8a2 2 0 100 4 2 2 0 000-4zM4 8v-.5M16 8v-.5M4 12v.5M16 12v.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

const GRUPOS_ORDEN = ["Operación", "Ventas", "Inventario", "Administración"];
const CLAVE_COLAPSADOS = "mecanicoapp:sidebar:grupos-colapsados";

function leerColapsadosGuardados(): Set<string> {
  try {
    const guardado = localStorage.getItem(CLAVE_COLAPSADOS);
    return guardado ? new Set(JSON.parse(guardado)) : new Set();
  } catch {
    // localStorage no disponible (modo privado, política del navegador)
    // — todos expandidos es el valor por defecto más seguro.
    return new Set();
  }
}

const ETIQUETA_PLAN: Record<string, string> = {
  prueba: "Gratis",
  taller: "Plan Taller",
  serviteca: "Plan Serviteca",
  empresarial: "Plan Empresarial",
};

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase();
}

/**
 * Tarjeta de perfil al fondo del sidebar — reemplaza al ítem de texto
 * plano "Mi cuenta" que antes vivía dentro de la lista de enlaces.
 * Mismo patrón que ChatGPT/otros SaaS: avatar + nombre + plan a la
 * izquierda, acción a la derecha.
 */
function TarjetaCuenta({ nombre, plan }: { nombre: string; plan: string }) {
  return (
    <Link
      href="/panel/cuenta"
      className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-card"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[12px] font-semibold text-primary">
        {iniciales(nombre) || "?"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium">{nombre}</span>
        <span className="block truncate text-[12px] text-muted-foreground">
          {ETIQUETA_PLAN[plan] ?? plan}
        </span>
      </span>
    </Link>
  );
}

function ItemEnlace({
  seccion,
  activo,
  alNavegar,
}: {
  seccion: (typeof SECCIONES)[number];
  activo: boolean;
  alNavegar?: () => void;
}) {
  return (
    <li>
      <Link
        href={seccion.href}
        onClick={alNavegar}
        aria-current={activo ? "page" : undefined}
        className={`flex items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] transition-colors ${
          activo
            ? "bg-foreground/10 font-medium text-foreground"
            : "text-muted-foreground hover:bg-card hover:text-foreground"
        }`}
      >
        <svg viewBox="0 0 20 20" className="size-4 shrink-0" aria-hidden>
          {seccion.icono}
        </svg>
        {seccion.texto}
      </Link>
    </li>
  );
}

function GrupoColapsable({
  titulo,
  secciones,
  ruta,
  colapsado,
  onToggle,
  alNavegar,
}: {
  titulo: string;
  secciones: typeof SECCIONES;
  ruta: string;
  colapsado: boolean;
  onToggle: () => void;
  alNavegar?: () => void;
}) {
  if (secciones.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-lg px-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase hover:text-foreground"
        aria-expanded={!colapsado}
      >
        {titulo}
        <svg
          viewBox="0 0 20 20"
          className={`size-3.5 shrink-0 transition-transform ${colapsado ? "-rotate-90" : ""}`}
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
      {!colapsado && (
        <ul className="mt-1 flex flex-col gap-1">
          {secciones.map((s) => (
            <ItemEnlace
              key={s.href}
              seccion={s}
              activo={ruta === s.href}
              alNavegar={alNavegar}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function Enlaces({
  alNavegar,
  tieneInventario,
  tieneServicios,
  tieneCatalogoServicios,
  vePagos,
  veEquipo,
}: {
  alNavegar?: () => void;
  tieneInventario: boolean;
  tieneServicios: boolean;
  /** El ítem "Servicios" (catálogo de checklist) es gestión, no operación. */
  tieneCatalogoServicios: boolean;
  vePagos: boolean;
  veEquipo: boolean;
}) {
  const ruta = usePathname();
  const [colapsados, setColapsados] = useState<Set<string>>(new Set());

  // Todos expandidos en el render del servidor (localStorage no existe
  // ahí); apenas el cliente monta, se sincroniza con lo que el usuario
  // ya había colapsado antes — sincronizar con una fuente externa real
  // tras montar es el caso previsto para setState dentro de un efecto,
  // pese a que la regla del linter lo marca en general.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setColapsados(leerColapsadosGuardados());
  }, []);

  function toggleGrupo(grupo: string) {
    setColapsados((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(grupo)) siguiente.delete(grupo);
      else siguiente.add(grupo);
      try {
        localStorage.setItem(CLAVE_COLAPSADOS, JSON.stringify([...siguiente]));
      } catch {
        // Nada que hacer si no se puede persistir — el toggle igual
        // funciona para el resto de la sesión.
      }
      return siguiente;
    });
  }

  const secciones = SECCIONES.filter((s) => {
    if (s.href === "/panel/agenda") return tieneServicios;
    if (s.href === "/panel/compras") return tieneServicios;
    if (s.href === "/panel/inventario") return tieneInventario;
    if (s.href === "/panel/servicios") return tieneCatalogoServicios;
    if (s.href === "/panel/diagnosticos") return tieneServicios;
    if (s.href === "/panel/inspecciones") return tieneServicios;
    if (s.href === "/panel/ventas") return tieneServicios;
    if (s.href === "/panel/presupuestos") return tieneServicios;
    if (s.href === "/panel/pagos") return vePagos;
    if (s.href === "/panel/caja") return vePagos;
    if (s.href === "/panel/equipo") return veEquipo;
    return true;
  });

  const sinGrupo = secciones.filter((s) => !("grupo" in s));

  return (
    <div>
      <ul className="flex flex-col gap-1">
        {sinGrupo.map((s) => (
          <ItemEnlace key={s.href} seccion={s} activo={ruta === s.href} alNavegar={alNavegar} />
        ))}
      </ul>
      {GRUPOS_ORDEN.map((grupo) => (
        <GrupoColapsable
          key={grupo}
          titulo={grupo}
          secciones={secciones.filter((s) => "grupo" in s && s.grupo === grupo)}
          ruta={ruta}
          colapsado={colapsados.has(grupo)}
          onToggle={() => toggleGrupo(grupo)}
          alNavegar={alNavegar}
        />
      ))}
    </div>
  );
}

/** Barra lateral fija, solo en pantallas grandes. */
export function Sidebar({
  nombre,
  plan,
  tieneInventario,
  tieneServicios,
  tieneCatalogoServicios,
  vePagos,
  veEquipo,
}: {
  nombre: string;
  plan: string;
  tieneInventario: boolean;
  tieneServicios: boolean;
  tieneCatalogoServicios: boolean;
  vePagos: boolean;
  veEquipo: boolean;
}) {
  return (
    <aside className="hidden w-52 shrink-0 border-r border-border lg:block">
      <div className="sticky top-0 flex h-dvh flex-col p-4">
        <Link
          href="/panel"
          className="mb-4 shrink-0 truncate px-3 text-[15px] font-semibold tracking-tight"
        >
          Mecanico<span className="text-acento">App</span>
        </Link>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Enlaces
            tieneInventario={tieneInventario}
            tieneServicios={tieneServicios}
            tieneCatalogoServicios={tieneCatalogoServicios}
            vePagos={vePagos}
            veEquipo={veEquipo}
          />
        </div>
        <div className="mt-2 shrink-0">
          <TarjetaCuenta nombre={nombre} plan={plan} />
        </div>
      </div>
    </aside>
  );
}

/** Botón y panel deslizante, solo en pantallas chicas. */
export function MenuMovil({
  nombre,
  plan,
  tieneInventario,
  tieneServicios,
  tieneCatalogoServicios,
  vePagos,
  veEquipo,
}: {
  nombre: string;
  plan: string;
  tieneInventario: boolean;
  tieneServicios: boolean;
  tieneCatalogoServicios: boolean;
  vePagos: boolean;
  veEquipo: boolean;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        aria-label="Abrir menú"
        className="rounded-lg border border-border p-2 lg:hidden"
      >
        <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
          <path
            d="M3 5.5h14M3 10h14M3 14.5h14"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {abierto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Cerrar menú"
            onClick={() => setAbierto(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-background p-4">
            <div className="mb-6 shrink-0 px-4 py-2 text-lg font-semibold tracking-tight">
              Mecanico<span className="text-acento">App</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <Enlaces
                alNavegar={() => setAbierto(false)}
                tieneInventario={tieneInventario}
                tieneServicios={tieneServicios}
                tieneCatalogoServicios={tieneCatalogoServicios}
                vePagos={vePagos}
                veEquipo={veEquipo}
              />
            </div>
            <div className="mt-2 shrink-0">
              <TarjetaCuenta nombre={nombre} plan={plan} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
