"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

type Opcion = { valor: string; texto: string };

/**
 * Envoltorio sobre el Select de shadcn con la API simple que ya usa
 * todo el proyecto (value/onChange/opciones) — evita tener que tocar
 * cada pantalla que lo usa. Reemplaza al <select> nativo, cuyo
 * desplegable pinta el sistema operativo con su propio azul, un color
 * ajeno a la paleta que no se puede quitar de forma confiable.
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
    <Select
      // "" y no null: a diferencia de base-ui puro, el wrapper de
      // shadcn espera string | undefined — value="" ya alcanza para
      // que SelectValue muestre el placeholder.
      value={value || undefined}
      onValueChange={(v) => onChange((v as string) ?? "")}
      items={opciones.map((o) => ({ value: o.valor, label: o.texto }))}
    >
      <SelectTrigger
        autoFocus={autoFocus}
        className={`w-full rounded-lg border-border bg-background px-4 py-2 text-[15px] font-normal whitespace-normal ${className}`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {opciones.map((o) => (
          <SelectItem key={o.valor} value={o.valor}>
            {o.texto}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
