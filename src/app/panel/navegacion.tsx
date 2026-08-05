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
];

function Enlaces({ alNavegar }: { alNavegar?: () => void }) {
  const ruta = usePathname();

  return (
    <ul className="flex flex-col gap-1">
      {SECCIONES.map((s) => {
        const activo = ruta === s.href;
        return (
          <li key={s.href}>
            <Link
              href={s.href}
              onClick={alNavegar}
              aria-current={activo ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] transition-colors ${
                activo
                  ? "bg-primary/10 font-medium text-primary"
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
export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border lg:block">
      <div className="sticky top-0 p-4">
        <Enlaces />
      </div>
    </aside>
  );
}

/** Botón y panel deslizante, solo en pantallas chicas. */
export function MenuMovil() {
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
            <div className="mb-6 px-3 py-2 text-lg font-semibold tracking-tight">
              Mecanico<span className="text-primary">App</span>
            </div>
            <Enlaces alNavegar={() => setAbierto(false)} />
          </div>
        </div>
      )}
    </>
  );
}
