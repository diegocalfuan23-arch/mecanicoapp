"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Dentro de la PWA instalada no debe existir forma de volver a la
 * landing pública — es una app, no un sitio. En el navegador normal
 * (PC o celular sin instalar) sí, así que el link se restringe solo
 * al modo standalone, no a todo el mundo por igual.
 *
 * matchMedia es síncrono: se lee en el inicializador de useState
 * (evaluado solo en el primer render del cliente) en vez de en un
 * efecto — así el resultado ya está listo desde el primer paint del
 * cliente, sin el parpadeo de un estado nulo intermedio.
 */
export function LogoAuth() {
  const [enPwa] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(display-mode: standalone)").matches
  );

  const texto = (
    <>
      Mecanico<span className="text-acento">App</span>
    </>
  );

  if (enPwa) {
    return <span className="text-lg font-semibold tracking-tight">{texto}</span>;
  }

  return (
    <Link href="/" className="text-lg font-semibold tracking-tight">
      {texto}
    </Link>
  );
}
