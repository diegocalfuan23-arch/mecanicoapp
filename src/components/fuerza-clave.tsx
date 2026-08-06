const REGLAS = [
  { prueba: (v: string) => v.length >= 8, texto: "8 caracteres o más" },
  { prueba: (v: string) => /[A-Z]/.test(v), texto: "Una mayúscula" },
  { prueba: (v: string) => /[a-z]/.test(v), texto: "Una minúscula" },
  { prueba: (v: string) => /\d/.test(v), texto: "Un número" },
];

const NIVELES = [
  { etiqueta: "Muy débil", color: "bg-destructive" },
  { etiqueta: "Débil", color: "bg-destructive" },
  { etiqueta: "Aceptable", color: "bg-primary" },
  { etiqueta: "Buena", color: "bg-primary" },
  { etiqueta: "Segura", color: "bg-success" },
];

export function FuerzaClave({ valor }: { valor: string }) {
  if (!valor) return null;

  const puntaje = REGLAS.filter((r) => r.prueba(valor)).length;
  const nivel = NIVELES[puntaje];

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1" aria-hidden>
          {REGLAS.map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < puntaje ? nivel.color : "bg-border"
              }`}
            />
          ))}
        </div>
        <span className="text-[12px] text-muted-foreground">
          {nivel.etiqueta}
        </span>
      </div>

      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {REGLAS.map((regla) => {
          const ok = regla.prueba(valor);
          return (
            <li
              key={regla.texto}
              className={`flex items-center gap-1 text-[12px] ${
                ok ? "text-success" : "text-muted-foreground"
              }`}
            >
              <svg viewBox="0 0 12 12" className="size-3 shrink-0" aria-hidden>
                {ok ? (
                  <path
                    d="M2.5 6.2l2.3 2.3L9.5 3.8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ) : (
                  <circle
                    cx="6"
                    cy="6"
                    r="2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                  />
                )}
              </svg>
              {regla.texto}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
