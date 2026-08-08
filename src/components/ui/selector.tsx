"use client";

import { Select } from "@base-ui/react/select";

type Opcion = { valor: string; texto: string };

/**
 * Reemplaza al <select> nativo, cuya lista desplegable la pinta el
 * sistema operativo con su propio azul — un color ajeno a la paleta que
 * no se puede quitar de forma confiable en todos los navegadores.
 */
export function Selector({
  value,
  onChange,
  opciones,
  placeholder = "Elige una opción",
  autoFocus,
  className = "",
}: {
  value: string;
  onChange: (valor: string) => void;
  opciones: Opcion[];
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <Select.Root
      value={value}
      onValueChange={(v) => onChange((v as string) ?? "")}
    >
      <Select.Trigger
        autoFocus={autoFocus}
        className={`flex w-full items-center justify-between gap-4 rounded-lg border border-border bg-background px-4 py-2 text-left text-[15px] transition-colors outline-none select-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 data-popup-open:border-primary/60 ${className}`}
      >
        <Select.Value
          className="truncate data-placeholder:text-muted-foreground/50"
          placeholder={placeholder}
        />
        <Select.Icon className="shrink-0 text-muted-foreground">
          <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
            <path
              d="M6 8l4 4 4-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner className="z-50 outline-none select-none" sideOffset={4}>
          <Select.Popup className="max-h-[min(24rem,var(--available-height))] min-w-(--anchor-width) overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-lg outline-none">
            {opciones.map((o) => (
              <Select.Item
                key={o.valor}
                value={o.valor}
                className="cursor-default px-4 py-2 text-[15px] outline-none select-none data-highlighted:bg-secondary data-selected:font-medium"
              >
                <Select.ItemText>{o.texto}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
