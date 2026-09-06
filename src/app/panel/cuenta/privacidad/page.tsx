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
      <TextoPrivacidad />
    </div>
  );
}
