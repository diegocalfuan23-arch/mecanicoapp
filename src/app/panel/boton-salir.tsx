"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function BotonSalir() {
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await authClient.signOut();
        router.push("/");
        router.refresh();
      }}
      className="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-card"
    >
      Salir
    </button>
  );
}
