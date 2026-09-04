import { type ButtonHTMLAttributes, forwardRef } from "react";

/**
 * Antes cada pantalla del panel definía su propio padding de botón
 * (px-6 py-2, px-4 py-2, distintos tamaños de texto) — quedaban
 * inconsistentes y, en vista de escritorio, se sentían grandes e
 * invasivos. Este es el único lugar que decide el tamaño: cualquier
 * ajuste futuro se hace acá, no botón por botón en cada archivo.
 */
const VARIANTES = {
  primary:
    "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60",
  outline:
    "border border-border hover:bg-background disabled:opacity-60",
  ghost:
    "text-muted-foreground hover:bg-background hover:text-foreground disabled:opacity-60",
} as const;

const TAMANOS = {
  default: "px-4 py-1.5 text-[13px]",
  sm: "px-3 py-1 text-[12px]",
} as const;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTES;
  size?: keyof typeof TAMANOS;
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "primary", size = "default", className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors ${VARIANTES[variant]} ${TAMANOS[size]} ${className}`}
      {...props}
    />
  )
);
Button.displayName = "Button";
