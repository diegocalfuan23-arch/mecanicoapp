"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECCIONES = [
  { href: "/panel", texto: "Inicio" },
  { href: "/panel/vehiculos", texto: "Vehículos" },
];

export function Navegacion() {
  const ruta = usePathname();

  return (
    <nav className="mx-auto max-w-6xl px-6">
      <ul className="flex gap-6 overflow-x-auto">
        {SECCIONES.map((s) => {
          const activo = ruta === s.href;
          return (
            <li key={s.href}>
              <Link
                href={s.href}
                className={`block border-b-2 py-3 text-[15px] whitespace-nowrap transition-colors ${
                  activo
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
