"use client";

import { Slider as SliderPrimitive } from "@base-ui/react/slider";

/** Control deslizante 0-100 con la barra de progreso ya llena hasta
 * el valor actual — pensado para porcentajes (ej. nivel de combustible). */
export function Slider({
  value,
  onChange,
  className = "",
}: {
  value: number;
  onChange: (valor: number) => void;
  className?: string;
}) {
  return (
    <SliderPrimitive.Root
      value={value}
      onValueChange={(v) => onChange(v as number)}
      min={0}
      max={100}
      step={5}
      className={`w-full ${className}`}
    >
      <SliderPrimitive.Control className="flex w-full items-center py-2 select-none">
        <SliderPrimitive.Track className="relative h-2 w-full rounded-full bg-secondary">
          <SliderPrimitive.Indicator className="absolute h-full rounded-full bg-primary" />
          <SliderPrimitive.Thumb className="block size-5 rounded-full border-2 border-primary bg-background outline-none focus-visible:ring-2 focus-visible:ring-primary/40" />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}
