import { TextoPrivacidad } from "@/components/texto-privacidad";
import { BotonVolver } from "@/components/boton-volver";

export const metadata = {
  title: "Política de privacidad — MecanicoApp",
};

/**
 * Versión pública, para quien todavía no tiene cuenta. Se llega tanto
 * desde la landing como desde /registro — "Volver" va a la página
 * anterior real, no siempre "/" (dentro de la PWA no debe existir
 * ninguna forma de terminar en la landing).
 */
export default function Privacidad() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <BotonVolver />

      <div className="mt-8">
        <TextoPrivacidad />
      </div>
    </div>
  );
}
