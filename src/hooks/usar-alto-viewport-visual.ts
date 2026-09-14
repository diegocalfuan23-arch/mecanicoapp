"use client";

import { useEffect, useState } from "react";

/**
 * Alto real de lo que se ve en pantalla, en píxeles — no el de layout
 * (`100dvh`/`100svh`), que en Android Chrome no siempre se recalcula
 * al abrir el teclado. `window.visualViewport` sí lo hace: es la API
 * pensada justo para esto (el teclado reduce el viewport VISUAL, no
 * el de layout, así que un elemento con `inset-0`/`h-dvh` puede quedar
 * calculado contra el tamaño de antes del teclado — el input termina
 * "empujado" fuera de lo que realmente se ve).
 *
 * `null` en el primer render del servidor y mientras no hay soporte
 * (Safari viejo, navegador de escritorio sin la API) — quien lo use
 * debe caer a `h-dvh`/`inset-0` normal en ese caso, no a 0.
 */
export function useAltoViewportVisual(): number | null {
  const [alto, setAlto] = useState<number | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    function actualizar() {
      setAlto(vv!.height);
    }

    actualizar();
    vv.addEventListener("resize", actualizar);
    return () => vv.removeEventListener("resize", actualizar);
  }, []);

  return alto;
}
