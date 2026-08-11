import Link from "next/link";
import { TextoPrivacidad } from "@/components/texto-privacidad";

export const metadata = {
  title: "Política de privacidad — MecanicoApp",
};

/**
 * La misma política, pero dentro del panel: leerla no debería sacar al
 * mecánico de su sesión ni hacerle perder el menú.
 */
export default function PrivacidadDelPanel() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/panel/cuenta"
        className="inline-flex items-center gap-2 text-[14px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg viewBox="0 0 20 20" className="size-4" aria-hidden>
          <path
            d="M12 4l-5 6 5 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Volver a mi cuenta
      </Link>

      <div className="mt-8">
        <TextoPrivacidad />
      </div>
    </div>
  );
}
