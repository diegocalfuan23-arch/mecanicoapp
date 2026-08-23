"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
    href: "/panel/asistente",
    texto: "Asistente",
    icono: (
      <path
        d="M4 4.5h12a1 1 0 011 1v7a1 1 0 01-1 1H8.5L5 16.5V13.5H4a1 1 0 01-1-1v-7a1 1 0 011-1zM7 8h6M7 10.5h4"
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
    href: "/panel/vehiculos",
    texto: "Vehículos",
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
    href: "/panel/equipo",
    texto: "Equipo",
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
    href: "/panel/cuenta",
    texto: "Mi cuenta",
    icono: (
      <path
        d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM10 2.5l1.2 1.7 2-.5.4 2 1.9.8-.9 1.9.9 1.9-1.9.8-.4 2-2-.5L10 17.5l-1.2-1.9-2 .5-.4-2-1.9-.8.9-1.9-.9-1.9 1.9-.8.4-2 2 .5L10 2.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    ),
  },
];

function Enlaces({
  alNavegar,
  tieneInventario,
}: {
  alNavegar?: () => void;
  tieneInventario: boolean;
}) {
  const ruta = usePathname();
  const secciones = SECCIONES.filter(
    (s) => s.href !== "/panel/inventario" || tieneInventario
  );

  return (
    <ul className="flex flex-col gap-1">
      {secciones.map((s) => {
        const activo = ruta === s.href;
        return (
          <li key={s.href}>
            <Link
              href={s.href}
              onClick={alNavegar}
              aria-current={activo ? "page" : undefined}
              className={`flex items-center gap-4 rounded-lg px-4 py-2 text-[15px] transition-colors ${
                activo
                  ? "bg-foreground/10 font-medium text-foreground"
                  : "text-muted-foreground hover:bg-card hover:text-foreground"
              }`}
            >
              <svg viewBox="0 0 20 20" className="size-5 shrink-0" aria-hidden>
                {s.icono}
              </svg>
              {s.texto}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Barra lateral fija, solo en pantallas grandes. */
export function Sidebar({ tieneInventario }: { tieneInventario: boolean }) {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border lg:block">
      <div className="sticky top-0 p-4">
        <Enlaces tieneInventario={tieneInventario} />
      </div>
    </aside>
  );
}

/** Botón y panel deslizante, solo en pantallas chicas. */
export function MenuMovil({ tieneInventario }: { tieneInventario: boolean }) {
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
          <div className="absolute inset-y-0 left-0 w-64 border-r border-border bg-background p-4">
            <div className="mb-6 px-4 py-2 text-lg font-semibold tracking-tight">
              Mecanico<span className="text-acento">App</span>
            </div>
            <Enlaces
              alNavegar={() => setAbierto(false)}
              tieneInventario={tieneInventario}
            />
          </div>
        </div>
      )}
    </>
  );
}
