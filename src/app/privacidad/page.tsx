import Link from "next/link";
import { TextoPrivacidad } from "@/components/texto-privacidad";

export const metadata = {
  title: "Política de privacidad — MecanicoApp",
};

/** Versión pública, para quien todavía no tiene cuenta. */
export default function Privacidad() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <Link
        href="/"
        className="text-[14px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        Volver
      </Link>

      <div className="mt-8">
        <TextoPrivacidad />
      </div>
    </div>
  );
}
