"use client";

import { usePathname, useRouter } from "next/navigation";

/**
 * Flecha "volver" del header del panel — solo aparece en páginas que
 * no son la raíz de un módulo (/panel/ventas/nueva,
 * /panel/diagnosticos/<id>, /panel/cuenta/privacidad), nunca en
 * listados (/panel/ordenes) ni en Inicio. Regla automática por
 * profundidad de ruta: cualquier página nueva que se agregue hereda
 * el comportamiento sin tocar el header.
 *
 * Distinto de BotonVolver (components/boton-volver.tsx): ese es del
 * flujo público de login/registro, con texto y router.back() — este
 * es solo ícono y calcula la ruta padre, no el historial real.
 */
export function FlechaVolver() {
  const pathname = usePathname();
  const router = useRouter();

  const segmentos = pathname.split("/").filter(Boolean);
  // ["panel"] → Inicio. ["panel", "ordenes"] → raíz de módulo. Ambos
  // sin flecha. Desde 3 segmentos ya es un formulario o un detalle.
  if (segmentos.length < 3) return null;

  const rutaAnterior = "/" + segmentos.slice(0, -1).join("/");

  return (
    <button
      type="button"
      onClick={() => router.push(rutaAnterior)}
      aria-label="Volver"
      className="flex size-9 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-foreground/10"
    >
      <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
        <path
          d="M12.5 5L7 10l5.5 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
