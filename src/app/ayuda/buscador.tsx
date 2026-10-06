"use client";

import { useMemo, useState } from "react";

type Modulo = {
  id: string;
  texto: string;
  pasos: string[];
};

/**
 * Busca solo entre los módulos de uso (no en Cuenta — son solo 3
 * temas, ya están todos a la vista sin necesidad de filtrar). Filtra
 * en el cliente: es contenido estático, no amerita una consulta al
 * servidor por cada letra tecleada.
 */
export function BuscadorAyuda({ modulos }: { modulos: Modulo[] }) {
  const [consulta, setConsulta] = useState("");

  const resultados = useMemo(() => {
    const q = consulta.trim().toLowerCase();
    if (!q) return [];
    return modulos.filter(
      (m) =>
        m.texto.toLowerCase().includes(q) ||
        m.pasos.some((p) => p.toLowerCase().includes(q))
    );
  }, [consulta, modulos]);

  return (
    <div className="relative mt-6">
      <svg
        viewBox="0 0 20 20"
        className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      >
        <path
          d="M9 15A6 6 0 109 3a6 6 0 000 12zM13.5 13.5L17 17"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <input
        value={consulta}
        onChange={(e) => setConsulta(e.target.value)}
        placeholder="Buscar en la ayuda — ej. «fiado», «stock», «cerrar caja»"
        className="w-full rounded-xl border border-border bg-card py-3 pr-4 pl-11 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
      />

      {consulta.trim() && (
        <div className="scroll-discreto absolute top-full right-0 left-0 z-10 mt-2 max-h-80 overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-lg">
          {resultados.length === 0 ? (
            <p className="px-4 py-3 text-[13px] text-muted-foreground">
              Nada por «{consulta.trim()}». Prueba con otra palabra.
            </p>
          ) : (
            resultados.map((m) => (
              <a
                key={m.id}
                href={`#${m.id}`}
                onClick={() => setConsulta("")}
                className="block px-4 py-2.5 text-[14px] text-foreground transition-colors hover:bg-background"
              >
                {m.texto}
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}
