"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function BotonSalir() {
  return (
    <Button
      variant="outline"
      onClick={async () => {
        await authClient.signOut();
        // location.href, no router.push: fuerza una recarga completa
        // del documento. Con router.push (navegación client-side), el
        // <html> nunca se recrea, así que si el usuario había elegido
        // tema claro dentro del panel, esa clase queda pegada en
        // /entrar — página pública que siempre debe verse oscura.
        window.location.href = "/entrar";
      }}
    >
      Salir
    </Button>
  );
}
