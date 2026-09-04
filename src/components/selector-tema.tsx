"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

/**
 * Claro/oscuro por taller, no del sistema — el default sigue siendo
 * oscuro (así nadie ve un cambio sorpresa), esto solo deja elegir.
 * Pedido urgente de Diego: en oscuro no se veía bien la interfaz.
 */
export function SelectorTema() {
  const { theme, setTheme } = useTheme();
  // next-themes no conoce el tema real hasta montar en el cliente —
  // antes de eso, mostrar cualquiera de las dos opciones como
  // "activa" sería adivinar y podría no coincidir con lo que ya se
  // aplicó (evita el parpadeo de un estado incorrecto).
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    // No hay forma de derivar esto sin efecto: es literalmente "ya
    // estamos en el cliente, después de la hidratación" — no un
    // valor que dependa de props/estado ya conocido al renderizar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMontado(true);
  }, []);

  const opciones = [
    { valor: "dark", texto: "Oscuro" },
    { valor: "light", texto: "Claro" },
  ] as const;

  return (
    <div>
      <span className="mb-2 block text-[13px] font-medium">Apariencia</span>
      <div className="inline-flex rounded-lg border border-border p-1">
        {opciones.map((o) => (
          <button
            key={o.valor}
            type="button"
            onClick={() => setTheme(o.valor)}
            className={`rounded-md px-4 py-1.5 text-[13px] font-medium transition-colors ${
              montado && theme === o.valor
                ? "bg-foreground/10 text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.texto}
          </button>
        ))}
      </div>
    </div>
  );
}
