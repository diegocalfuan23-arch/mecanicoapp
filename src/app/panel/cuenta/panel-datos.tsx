"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { exportarMisDatos, eliminarMiCuenta } from "./acciones";

export function PanelDatos({ correo }: { correo: string }) {
  const router = useRouter();
  const [exportando, setExportando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [escrito, setEscrito] = useState("");
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function descargar() {
    setExportando(true);
    setError(null);
    try {
      const datos = await exportarMisDatos();
      const blob = new Blob([JSON.stringify(datos, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mecanicoapp-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("No se pudieron preparar los datos. Intenta de nuevo.");
    } finally {
      setExportando(false);
    }
  }

  async function borrar() {
    setBorrando(true);
    setError(null);

    const res = await eliminarMiCuenta(escrito);

    if (res?.error) {
      setError(res.error);
      setBorrando(false);
      return;
    }

    await authClient.signOut();
    router.push("/");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-medium">Llevarte tus datos</h2>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Descarga todo lo que la app guarda de tu taller: vehículos,
          clientes, órdenes, pagos y conversaciones. Es un archivo que
          puedes abrir o llevar a otro sistema.
        </p>
        <button
          onClick={descargar}
          disabled={exportando}
          className="mt-4 rounded-lg border border-border px-6 py-2 font-medium transition-colors hover:bg-background disabled:opacity-60"
        >
          {exportando ? "Preparando…" : "Descargar mis datos"}
        </button>
      </div>

      <div className="rounded-xl border border-destructive/40 bg-card p-6">
        <h2 className="text-lg font-medium">Eliminar la cuenta</h2>
        <p className="mt-2 text-[15px] text-muted-foreground">
          Se borra tu cuenta y todo lo que hay dentro: vehículos, clientes,
          órdenes, pagos, fotos y conversaciones. No se puede deshacer y no
          hay forma de recuperarlo después.
        </p>

        {!confirmando ? (
          <button
            onClick={() => setConfirmando(true)}
            className="mt-4 rounded-lg border border-destructive/50 px-6 py-2 font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            Eliminar mi cuenta
          </button>
        ) : (
          <div className="mt-4">
            <label className="block">
              <span className="mb-2 block text-[13px] font-medium">
                Escribe {correo} para confirmar
              </span>
              <input
                value={escrito}
                onChange={(e) => setEscrito(e.target.value)}
                placeholder={correo}
                autoFocus
                className="w-full rounded-lg border border-border bg-background px-4 py-2 text-[15px] outline-none placeholder:text-muted-foreground/50 focus:border-destructive/60 focus:ring-1 focus:ring-destructive/30"
              />
            </label>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                onClick={borrar}
                disabled={borrando || !escrito.trim()}
                className="rounded-lg bg-destructive px-6 py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {borrando ? "Borrando…" : "Borrar todo definitivamente"}
              </button>
              <button
                onClick={() => {
                  setConfirmando(false);
                  setEscrito("");
                  setError(null);
                }}
                className="rounded-lg border border-border px-6 py-2 font-medium transition-colors hover:bg-background"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-4 text-[13px] text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
