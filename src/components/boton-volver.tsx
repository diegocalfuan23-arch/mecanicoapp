"use client";

import { useRouter } from "next/navigation";

/**
 * Vuelve a la página anterior real (history.back), no a una ruta fija
 * como "/" — así funciona igual llegando desde la landing o desde
 * /registro, sin arriesgar terminar en la landing dentro de la PWA.
 */
export function BotonVolver() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="text-[14px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
    >
      Volver
    </button>
  );
}
